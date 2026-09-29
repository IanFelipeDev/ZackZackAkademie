import { useMutation } from '@tanstack/react-query';
import { Outlet, useNavigate } from 'react-router';
import { homePathFor, isStaff, usePresenceHeartbeat, useSignedInUser, type Role } from '@/features/auth';
import { AppFooter, AppHeader, PageDecorations, type NavItem } from '@/shared/ui';
import { useContainer } from './context/container-context';

const STUDENT_NAV: readonly NavItem[] = [
  { to: '/painel', label: 'Painel', icon: 'insights' },
  { to: '/treino', label: 'Área de Treino', icon: 'edit_note' },
  { to: '/sprechen', label: 'Expressão Oral', icon: 'record_voice_over' },
  { to: '/meus-textos', label: 'Meus Textos Salvos', icon: 'history_edu' },
];

const TEACHER_NAV: readonly NavItem[] = [
  { to: '/revisoes', label: 'Correções pendentes', icon: 'rate_review' },
  { to: '/revisoes/historico', label: 'Histórico', icon: 'history' },
  { to: '/avaliacoes-orais', label: 'Avaliações orais', icon: 'record_voice_over' },
];

const ADMIN_NAV: readonly NavItem[] = [
  ...TEACHER_NAV,
  { to: '/admin/usuarios', label: 'Usuários', icon: 'group' },
];

function navFor(role: Role): readonly NavItem[] {
  if (role === 'admin') return ADMIN_NAV;
  return isStaff(role) ? TEACHER_NAV : STUDENT_NAV;
}

/** Shell for signed-in pages. Rendered inside RequireRole, so a user is always present. */
export function AppLayout() {
  const { auth } = useContainer();
  const user = useSignedInUser();
  const navigate = useNavigate();
  usePresenceHeartbeat();
  const signOut = useMutation({
    mutationFn: () => auth.signOut.execute(),
    onSuccess: () => void navigate('/entrar', { replace: true }),
  });

  return (
    // Bottom padding keeps content and footer clear of the fixed phone nav bar.
    <div className="flex min-h-screen flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <PageDecorations />
      <AppHeader
        navItems={navFor(user.role)}
        homeTo={homePathFor(user.role)}
        userName={user.displayName}
        onSignOut={() => signOut.mutate()}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
