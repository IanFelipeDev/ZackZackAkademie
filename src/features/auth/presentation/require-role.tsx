import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { FullPageSpinner } from '@/shared/ui';
import type { Role } from '../domain/role';
import { useAuth } from './auth-provider';

interface RequireRoleProps {
  readonly allowed: readonly Role[];
  readonly children: ReactNode;
}

/** UX-only route guard; the real authorization boundary is RLS (ARCHITECTURE §8). */
export function RequireRole({ allowed, children }: RequireRoleProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />;
  if (!allowed.includes(user.role)) return <Navigate to="/acesso-negado" replace />;
  return children;
}
