import { useCallback, useEffect, useState } from 'react';

const TICK_MS = 1000;

export interface Stopwatch {
  readonly seconds: number;
  readonly isRunning: boolean;
  readonly toggle: () => void;
  readonly start: () => void;
  readonly pause: () => void;
  readonly reset: () => void;
}

/** Count-up exam timer (Schreiben and Sprechen). Starts paused. */
export function useStopwatch(): Stopwatch {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return undefined;
    const interval = window.setInterval(() => setSeconds((s) => s + 1), TICK_MS);
    return () => window.clearInterval(interval);
  }, [isRunning]);

  const toggle = useCallback(() => setIsRunning((running) => !running), []);
  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(0);
  }, []);

  return { seconds, isRunning, toggle, start, pause, reset };
}
