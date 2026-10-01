import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'recorded' | 'denied' | 'failed';

export interface AudioRecorder {
  /** False when the browser cannot record (no microphone API or no MediaRecorder). */
  readonly isSupported: boolean;
  readonly status: RecorderStatus;
  /** Object URL of the last recording, playable in an <audio> element; null until there is one. */
  readonly audioUrl: string | null;
  readonly start: () => void;
  readonly stop: () => void;
}

/** Recordings stop on their own after this long, so a forgotten recorder does not keep the microphone open. */
export const MAX_RECORDING_MS = 15_000;

function isRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  );
}

/**
 * Records from the microphone into memory. Nothing is uploaded: the recording lives as an object URL until the next
 * recording or until the component unmounts, and the microphone is released as soon as recording stops.
 */
export function useAudioRecorder(): AudioRecorder {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const urlRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const releaseMicrophone = useCallback(() => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    releaseMicrophone();
  }, [releaseMicrophone]);

  const start = useCallback(() => {
    if (!isRecordingSupported() || recorderRef.current?.state === 'recording') return;
    setStatus('requesting');
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!isMountedRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        recorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        });
        recorder.addEventListener('stop', () => {
          if (!isMountedRef.current) return;
          if (urlRef.current) URL.revokeObjectURL(urlRef.current);
          // The recorder picks the format (webm in Chrome, mp4 in Safari); keep its type so playback works.
          const url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }));
          urlRef.current = url;
          setAudioUrl(url);
          setStatus('recorded');
        });
        recorderRef.current = recorder;
        recorder.start();
        setStatus('recording');
        timeoutRef.current = window.setTimeout(stop, MAX_RECORDING_MS);
      })
      .catch((error: unknown) => {
        if (!isMountedRef.current) return;
        const denied = error instanceof DOMException && error.name === 'NotAllowedError';
        setStatus(denied ? 'denied' : 'failed');
      });
  }, [stop]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      releaseMicrophone();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [releaseMicrophone]);

  return { isSupported: isRecordingSupported(), status, audioUrl, start, stop };
}
