import { vi } from 'vitest';

/** Minimal MediaRecorder for jsdom: stop() emits one chunk and then the stop event, like the browser does. */
class FakeMediaRecorder extends EventTarget {
  state: RecordingState = 'inactive';
  readonly mimeType = 'audio/webm';
  start() {
    this.state = 'recording';
  }
  pause() {
    this.state = 'paused';
  }
  resume() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.dispatchEvent(Object.assign(new Event('dataavailable'), { data: new Blob(['voice']) }));
    this.dispatchEvent(new Event('stop'));
  }
}

/**
 * Gives jsdom a microphone. `getUserMedia` decides what asking for it does; by default it is granted.
 * Returns the spy on the track's stop(), to check the microphone is released. Undo with `removeFakeMicrophone`.
 */
export function installFakeMicrophone(getUserMedia?: () => Promise<unknown>) {
  const stopTrack = vi.fn();
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: getUserMedia ?? (() => Promise.resolve({ getTracks: () => [{ stop: stopTrack }] })),
    },
  });
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:recording');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  return { stopTrack };
}

export function removeFakeMicrophone() {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'mediaDevices');
}
