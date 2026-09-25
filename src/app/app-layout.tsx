import { useMutation } from '@tanstack/react-query';
import { Outlet, useNavigate } from 'react-router';
import { isStaff, useSignedInUser } from '@/features/auth';
import { AppFooter, AppHeader, PageDecorations, type NavItem } from '@/shared/ui';
import { useContainer } from './context/container-context';

const STUDENT_NAV: readonly NavItem[] = [
  { to: '/treino', label: 'Área de Treino' },
  { to: '/meus-textos', label: 'Meus Textos Salvos' },
];

const STAFF_NAV: readonly NavItem[] = [{ to: '/revisoes', label: 'Correções pendentes' }];

/** Shell for signed-in pages. Rendered inside RequireRole, so a user is always present. */
export function AppLayout() {
  const { auth } = useContainer();
  const user = useSignedInUser();
  const navigate = useNavigate();
  const signOut = useMutation({
    mutationFn: () => auth.signOut.execute(),
    onSuccess: () => void navigate('/entrar', { replace: true }),
  });

  return (
    <div className="flex min-h-screen flex-col">
      <PageDecorations />
      <AppHeader
        navItems={isStaff(user.role) ? STAFF_NAV : STUDENT_NAV}
        userName={user.displayName}
        onSignOut={() => signOut.mutate()}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
