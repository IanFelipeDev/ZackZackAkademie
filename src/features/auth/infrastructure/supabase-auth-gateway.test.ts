import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { AppSupabaseClient } from '@/shared/infrastructure/supabase/client';
import { SupabaseAuthGateway } from './supabase-auth-gateway';

type AuthCallback = (event: AuthChangeEvent, session: Session | null) => void;

function createGateway() {
  let emit: AuthCallback = () => undefined;
  const unsubscribe = vi.fn();
  const client = {
    auth: {
      onAuthStateChange: (callback: AuthCallback) => {
        emit = callback;
        return { data: { subscription: { unsubscribe } } };
      },
    },
  } as unknown as AppSupabaseClient;
  const sessionOf = (userId: string) => ({ user: { id: userId } }) as Session;
  return {
    gateway: new SupabaseAuthGateway(client),
    emit: (...args: Parameters<AuthCallback>) => emit(...args),
    sessionOf,
    unsubscribe,
  };
}

describe('SupabaseAuthGateway.onAuthStateChange', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('ignores the initial session and repeated events for the same user', () => {
    const { gateway, emit, sessionOf } = createGateway();
    const listener = vi.fn();
    gateway.onAuthStateChange(listener);

    emit('INITIAL_SESSION', sessionOf('ana'));
    // Supabase re-emits SIGNED_IN each time the tab becomes visible again.
    emit('SIGNED_IN', sessionOf('ana'));
    emit('TOKEN_REFRESHED', sessionOf('ana'));
    emit('USER_UPDATED', sessionOf('ana'));
    vi.runAllTimers();

    expect(listener).not.toHaveBeenCalled();
  });

  it('fires when the user signs out, signs in or is replaced by another account', () => {
    const { gateway, emit, sessionOf } = createGateway();
    const listener = vi.fn();
    gateway.onAuthStateChange(listener);

    emit('INITIAL_SESSION', null);
    emit('SIGNED_IN', sessionOf('ana'));
    vi.runAllTimers();
    expect(listener).toHaveBeenCalledTimes(1);

    emit('SIGNED_IN', sessionOf('bruno'));
    vi.runAllTimers();
    expect(listener).toHaveBeenCalledTimes(2);

    emit('SIGNED_OUT', null);
    vi.runAllTimers();
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('returns an unsubscribe function', () => {
    const { gateway, unsubscribe } = createGateway();
    gateway.onAuthStateChange(vi.fn())();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
