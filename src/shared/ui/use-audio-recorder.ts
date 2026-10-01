import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderStatus =
  'idle' | 'requesting' | 'recording' | 'paused' | 'recorded' | 'denied' | 'failed';

/** A finished recording: the audio itself, its format and an object URL to play it back. */
export interface RecordedAudio {
  readonly blob: Blob;
  readonly mimeType: string;
  readonly url: string;
}

export interface AudioRecorderOptions {
  /** Recording stops on its own after this long, so a forgotten recorder does not keep the microphone open. */
  readonly maxMs?: number;
  /** Target bitrate; lower keeps uploads small. The browser default when omitted. */
  readonly audioBitsPerSecond?: number;
}

export interface AudioRecorder {
  /** False when the browser cannot record (no microphone API or no MediaRecorder). */
  readonly isSupported: boolean;
  readonly status: RecorderStatus;
  /** The last finished recording; null until there is one. */
  readonly recording: RecordedAudio | null;
  /** Asks for the microphone and starts; resolves to false when that is refused or fails. */
  readonly start: () => Promise<boolean>;
  readonly pause: () => void;
  readonly resume: () => void;
  /** Stops and resolves with the recording (null when nothing was recording). Releases the microphone. */
  readonly stop: () => Promise<RecordedAudio | null>;
  /** Stops without keeping anything and forgets the last recording. */
  readonly discard: () => void;
}

/** Default limit, enough for a pronunciation; longer practices pass their own. */
export const MAX_RECORDING_MS = 15_000;

function isRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  );
}

/**
 * Records from the microphone into memory. Nothing leaves the browser here: the recording lives as a Blob and an
 * object URL until the next recording, a discard or unmount. Callers decide whether to upload it.
 */
export function useAudioRecorder({
  maxMs = MAX_RECORDING_MS,
  audioBitsPerSecond,
}: AudioRecorderOptions = {}): AudioRecorder {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [recording, setRecording] = useState<RecordedAudio | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const urlRef = useRef<string | null>(null);
  /** Resolves the pending stop() once the recorder has emitted its data. */
  const stoppedRef = useRef<((audio: RecordedAudio | null) => void) | null>(null);
  /** Set by discard(): the next stop event throws its data away. */
  const discardRef = useRef(false);
  const isMountedRef = useRef(true);

  const releaseMicrophone = useCallback(() => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const forgetUrl = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, []);

  const stop = useCallback((): Promise<RecordedAudio | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      releaseMicrophone();
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      stoppedRef.current = resolve;
      recorder.stop();
      releaseMicrophone();
    });
  }, [releaseMicrophone]);

  const start = useCallback(async (): Promise<boolean> => {
    if (!isRecordingSupported()) return false;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') return true;
    setStatus('requesting');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error: unknown) {
      if (isMountedRef.current) {
        const denied = error instanceof DOMException && error.name === 'NotAllowedError';
        setStatus(denied ? 'denied' : 'failed');
      }
      return false;
    }
    if (!isMountedRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return false;
    }
    streamRef.current = stream;
    const recorder = new MediaRecorder(stream, audioBitsPerSecond ? { audioBitsPerSecond } : undefined);
    const chunks: Blob[] = [];
    discardRef.current = false;
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });
    recorder.addEventListener('stop', () => {
      const resolve = stoppedRef.current;
      stoppedRef.current = null;
      if (!isMountedRef.current || discardRef.current) {
        resolve?.(null);
        return;
      }
      forgetUrl();
      // The recorder picks the format (webm in Chrome, mp4 in Safari); keep its type so playback and upload work.
      const blob = new Blob(chunks, { type: recorder.mimeType });
      const audio = { blob, mimeType: recorder.mimeType, url: URL.createObjectURL(blob) };
      urlRef.current = audio.url;
      setRecording(audio);
      setStatus('recorded');
      resolve?.(audio);
    });
    recorderRef.current = recorder;
    recorder.start();
    setStatus('recording');
    timeoutRef.current = window.setTimeout(() => void stop(), maxMs);
    return true;
  }, [audioBitsPerSecond, forgetUrl, maxMs, stop]);

  const pause = useCallback(() => {
    if (recorderRef.current?.state !== 'recording') return;
    recorderRef.current.pause();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    if (recorderRef.current?.state !== 'paused') return;
    recorderRef.current.resume();
    setStatus('recording');
  }, []);

  const discard = useCallback(() => {
    discardRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    releaseMicrophone();
    forgetUrl();
    setRecording(null);
    setStatus('idle');
  }, [forgetUrl, releaseMicrophone]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
      releaseMicrophone();
      forgetUrl();
    };
  }, [forgetUrl, releaseMicrophone]);

  return { isSupported: isRecordingSupported(), status, recording, start, pause, resume, stop, discard };
}
