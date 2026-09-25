import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useContainer } from '@/app/context/container-context';
import type { User } from '../domain/user';
import { CURRENT_USER_QUERY_KEY } from './auth-query-keys';

interface AuthState {
  readonly user: User | null;
  readonly isLoading: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth } = useContainer();
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => auth.getCurrentUser.execute(),
    staleTime: Infinity,
  });

  useEffect(
    // A different user may now be signed in: drop every cached query so no data leaks between sessions.
    () => auth.gateway.onAuthStateChange(() => void queryClient.resetQueries()),
    [auth.gateway, queryClient],
  );

  return (
    <AuthContext.Provider value={{ user: data ?? null, isLoading: isPending }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const state = useContext(AuthContext);
  if (!state) throw new Error('useAuth must be used inside <AuthProvider>');
  return state;
}

/** For screens that are only reachable behind RequireRole. */
// eslint-disable-next-line react-refresh/only-export-components
export function useSignedInUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('useSignedInUser requires a signed-in user');
  return user;
}
