import type { RouteObject } from 'react-router';
import { RequireRole } from '@/features/auth';
import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from '@/features/auth/presentation';
import { AppLayout } from './app-layout';
import { ForbiddenPage, HomeRedirect, NotFoundPage } from './status-pages';

// Feature screens load on demand so the login page stays small.
const loadWriting = () => import('@/features/writing/presentation');
const loadFeedback = () => import('@/features/feedback/presentation');
const loadUsers = () => import('@/features/users/presentation');
const loadSpeaking = () => import('@/features/speaking/presentation');
const loadDashboard = () => import('@/features/dashboard/presentation');

// Only students write; RLS enforces the same (ARCHITECTURE §8 permissions matrix).
export const routes: RouteObject[] = [
  { path: '/', element: <HomeRedirect /> },
  { path: '/entrar', element: <LoginPage /> },
  { path: '/esqueci-senha', element: <ForgotPasswordPage /> },
  { path: '/redefinir-senha', element: <ResetPasswordPage /> },
  { path: '/trocar-senha', element: <ResetPasswordPage mode="first-access" /> },
  { path: '/acesso-negado', element: <ForbiddenPage /> },
  {
    element: (
      <RequireRole allowed={['student']}>
        <AppLayout />
      </RequireRole>
    ),
    children: [
      { path: '/painel', lazy: async () => ({ Component: (await loadDashboard()).DashboardPage }) },
      { path: '/treino', lazy: async () => ({ Component: (await loadWriting()).WritingPracticePage }) },
      { path: '/meus-textos', lazy: async () => ({ Component: (await loadWriting()).MySubmissionsPage }) },
      { path: '/sprechen', lazy: async () => ({ Component: (await loadSpeaking()).SpeakingCatalogPage }) },
      {
        path: '/sprechen/:topicId',
        lazy: async () => ({ Component: (await loadSpeaking()).SpeakingTopicPage }),
      },
      {
        path: '/meus-textos/:submissionId',
        lazy: async () => ({ Component: (await loadWriting()).SubmissionDetailPage }),
      },
    ],
  },
  {
    element: (
      <RequireRole allowed={['teacher', 'admin']}>
        <AppLayout />
      </RequireRole>
    ),
    children: [
      { path: '/revisoes', lazy: async () => ({ Component: (await loadFeedback()).ReviewQueuePage }) },
      {
        path: '/revisoes/historico',
        lazy: async () => ({ Component: (await loadFeedback()).ReviewHistoryPage }),
      },
      {
        path: '/revisoes/:submissionId',
        lazy: async () => ({ Component: (await loadFeedback()).ReviewSubmissionPage }),
      },
      {
        path: '/avaliacoes-orais',
        lazy: async () => ({ Component: (await loadSpeaking()).AssessmentQueuePage }),
      },
      {
        path: '/avaliacoes-orais/:practiceId',
        lazy: async () => ({ Component: (await loadSpeaking()).AssessPracticePage }),
      },
    ],
  },
  {
    element: (
      <RequireRole allowed={['admin']}>
        <AppLayout />
      </RequireRole>
    ),
    children: [
      { path: '/admin/usuarios', lazy: async () => ({ Component: (await loadUsers()).UsersAdminPage }) },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];
