import { useMutation } from '@tanstack/react-query';
import { Outlet, useNavigate } from 'react-router';
import { isStaff, useSignedInUser, type Role } from '@/features/auth';
import { AppFooter, AppHeader, PageDecorations, type NavItem } from '@/shared/ui';
import { useContainer } from './context/container-context';

const STUDENT_NAV: readonly NavItem[] = [
  { to: '/treino', label: 'Área de Treino' },
  { to: '/meus-textos', label: 'Meus Textos Salvos' },
];

const TEACHER_NAV: readonly NavItem[] = [{ to: '/revisoes', label: 'Correções pendentes' }];

const ADMIN_NAV: readonly NavItem[] = [...TEACHER_NAV, { to: '/admin/usuarios', label: 'Usuários' }];

function navFor(role: Role): readonly NavItem[] {
  if (role === 'admin') return ADMIN_NAV;
  return isStaff(role) ? TEACHER_NAV : STUDENT_NAV;
}

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
        navItems={navFor(user.role)}
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
