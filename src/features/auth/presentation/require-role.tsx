import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { FullPageSpinner } from '@/shared/ui';
import type { Role } from '../domain/role';
import { CHANGE_PASSWORD_PATH, LOGIN_PATH } from './auth-paths';
import { useAuth } from './auth-provider';

interface RequireRoleProps {
  readonly allowed: readonly Role[];
  readonly children: ReactNode;
}

/**
 * UX-only route guard; the real authorization boundary is RLS (ARCHITECTURE §8).
 * Users still on a temporary password are sent to change it before anything else.
 */
export function RequireRole({ allowed, children }: RequireRoleProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <FullPageSpinner />;
  if (!user)
    return <Navigate to={LOGIN_PATH} replace state={{ from: location.pathname + location.search }} />;
  if (user.mustChangePassword) return <Navigate to={CHANGE_PASSWORD_PATH} replace />;
  if (!allowed.includes(user.role)) return <Navigate to="/acesso-negado" replace />;
  return children;
}
