import { useEffect, useState } from 'react';

/** Current time, refreshed periodically so "online" and "há 3 min" stay current without a reload. */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(interval);
  }, [intervalMs]);
  return now;
}
