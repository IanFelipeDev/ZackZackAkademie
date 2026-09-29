import { useEffect } from 'react';
import { useContainer } from '@/app/context/container-context';
import { useAuth } from './auth-provider';

/** Often enough for "online now" (5 minutes window) without noticeable load. */
const HEARTBEAT_MS = 2 * 60_000;

/**
 * Tells the server the signed-in user is active: on mount, every two minutes while the tab is visible and when
 * the tab becomes visible again. Presence is best effort, so failures are ignored.
 */
export function usePresenceHeartbeat(): void {
  const { auth } = useContainer();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return undefined;
    const beat = () => {
      if (document.visibilityState !== 'visible') return;
      auth.recordActivity.execute().catch(() => undefined);
    };
    beat();
    const interval = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener('visibilitychange', beat);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', beat);
    };
  }, [auth.recordActivity, userId]);
}
