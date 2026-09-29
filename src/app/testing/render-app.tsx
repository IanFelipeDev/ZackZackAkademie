import { render } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { InMemoryAuthGateway } from '@/features/auth/application/testing/in-memory-auth-gateway';
import type { User } from '@/features/auth/domain/user';
import { InMemoryReviewRepository } from '@/features/feedback/application/testing/in-memory-review-repository';
import {
  buildSpeakingTopic,
  InMemorySpeakingStore,
} from '@/features/speaking/application/testing/in-memory-speaking-store';
import {
  buildExercise,
  InMemoryWritingStore,
} from '@/features/writing/application/testing/in-memory-writing-store';
import { InMemoryUserAdminGateway } from '@/features/users/application/testing/in-memory-user-admin-gateway';
import { createContainer } from '../container';
import { Providers } from '../providers';
import { routes } from '../routes';

export const STUDENT: User = {
  id: 'student-1',
  email: 'ana@example.com',
  displayName: 'Ana',
  role: 'student',
  mustChangePassword: false,
};
export const TEACHER: User = {
  id: 'teacher-1',
  email: 'melissa@example.com',
  displayName: 'Melissa',
  role: 'teacher',
  mustChangePassword: false,
};
export const ADMIN: User = {
  id: 'admin-1',
  email: 'ian@example.com',
  displayName: 'Ian',
  role: 'admin',
  mustChangePassword: false,
};
export const PASSWORD = 'secret123';

export function createTestBackend() {
  const auth = new InMemoryAuthGateway();
  auth.addAccount(STUDENT, PASSWORD);
  auth.addAccount(TEACHER, PASSWORD);
  auth.addAccount(ADMIN, PASSWORD);

  const userAdmin = new InMemoryUserAdminGateway();
  userAdmin.users.push(
    ...[STUDENT, TEACHER, ADMIN].map(({ id, email, displayName, role }) => ({
      id,
      email,
      displayName,
      role,
      createdAt: new Date('2026-09-01T00:00:00Z'),
      accessStatus: 'active' as const,
      lastSeenAt: null,
    })),
  );

  const writing = new InMemoryWritingStore();
  writing.exercises.push(
    buildExercise({ id: 'teil1-1', position: 1 }),
    buildExercise({ id: 'teil1-2', position: 2, title: 'Konsumverhalten' }),
    buildExercise({
      id: 'teil2-1',
      title: 'Museumsführung absagen',
      taskType: 'formal_email',
      recipient: 'Herrn Groth (Museum)',
      wordRange: { min: 100, max: 120 },
    }),
  );
  writing.phrases.push(
    { id: 'p1', taskType: 'forum_post', category: 'Meinung äußern', text: 'Meines Erachtens …', position: 1 },
    {
      id: 'p2',
      taskType: 'formal_email',
      category: 'Bitten',
      text: 'Ich wäre Ihnen sehr dankbar, wenn …',
      position: 1,
    },
  );

  const speaking = new InMemorySpeakingStore();
  speaking.names.set(STUDENT.id, STUDENT.displayName).set(TEACHER.id, TEACHER.displayName);
  speaking.topics.push(
    buildSpeakingTopic({ id: 'sprechen-1', title: 'Homeoffice' }),
    buildSpeakingTopic({
      id: 'sprechen-2',
      position: 2,
      title: 'Urlaub',
      prompt: 'Wie verbringt man den Urlaub am besten?',
    }),
    buildSpeakingTopic({
      id: 'sprechen-3',
      taskType: 'discussion',
      title: 'Handyverbot an Schulen',
      prompt: 'Sollten Handys an Schulen verboten werden?',
    }),
  );

  return { auth, writing, reviews: new InMemoryReviewRepository(), speaking, userAdmin };
}

export type TestBackend = ReturnType<typeof createTestBackend>;

export function renderApp(path: string, backend: TestBackend = createTestBackend()) {
  const container = createContainer({
    authGateway: backend.auth,
    exercises: backend.writing.exerciseRepository,
    phrases: backend.writing.phraseRepository,
    submissions: backend.writing.submissionRepository,
    drafts: backend.writing.draftRepository,
    reviews: backend.reviews,
    speakingTopics: backend.speaking.topicRepository,
    speakingPractices: backend.speaking.practiceRepository,
    speakingAssessments: backend.speaking.assessmentRepository,
    userAdmin: backend.userAdmin,
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(
    <Providers container={container} queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { ...view, router, backend };
}
