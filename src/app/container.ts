import type { AuthGateway } from '@/features/auth/application/ports/auth-gateway';
import { GetCurrentUser } from '@/features/auth/application/use-cases/get-current-user';
import { RequestPasswordReset } from '@/features/auth/application/use-cases/request-password-reset';
import { SignIn } from '@/features/auth/application/use-cases/sign-in';
import { SignOut } from '@/features/auth/application/use-cases/sign-out';
import { SignUp } from '@/features/auth/application/use-cases/sign-up';
import { UpdatePassword } from '@/features/auth/application/use-cases/update-password';
import { SupabaseAuthGateway } from '@/features/auth/infrastructure/supabase-auth-gateway';
import type { ReviewRepository } from '@/features/feedback/application/ports/review-repository';
import { GetSubmissionForReview } from '@/features/feedback/application/use-cases/get-submission-for-review';
import { GiveFeedback } from '@/features/feedback/application/use-cases/give-feedback';
import { ListPendingSubmissions } from '@/features/feedback/application/use-cases/list-pending-submissions';
import { SupabaseReviewRepository } from '@/features/feedback/infrastructure/supabase-review-repository';
import type { DraftRepository } from '@/features/writing/application/ports/draft-repository';
import type { ExerciseRepository } from '@/features/writing/application/ports/exercise-repository';
import type { PhraseRepository } from '@/features/writing/application/ports/phrase-repository';
import type { SubmissionRepository } from '@/features/writing/application/ports/submission-repository';
import { DeleteDraft } from '@/features/writing/application/use-cases/delete-draft';
import { GetDraft } from '@/features/writing/application/use-cases/get-draft';
import { GetSubmission } from '@/features/writing/application/use-cases/get-submission';
import { GetWritingExercise } from '@/features/writing/application/use-cases/get-writing-exercise';
import { ListMyDrafts } from '@/features/writing/application/use-cases/list-my-drafts';
import { ListMySubmissions } from '@/features/writing/application/use-cases/list-my-submissions';
import { ListUsefulPhrases } from '@/features/writing/application/use-cases/list-useful-phrases';
import { ListWritingExercises } from '@/features/writing/application/use-cases/list-writing-exercises';
import { SaveDraft } from '@/features/writing/application/use-cases/save-draft';
import { SubmitWritingAttempt } from '@/features/writing/application/use-cases/submit-writing-attempt';
import { SupabaseDraftRepository } from '@/features/writing/infrastructure/supabase-draft-repository';
import { SupabaseExerciseRepository } from '@/features/writing/infrastructure/supabase-exercise-repository';
import { SupabasePhraseRepository } from '@/features/writing/infrastructure/supabase-phrase-repository';
import { SupabaseSubmissionRepository } from '@/features/writing/infrastructure/supabase-submission-repository';
import type { UserAdminGateway } from '@/features/users/application/ports/user-admin-gateway';
import { ChangeUserRole } from '@/features/users/application/use-cases/change-user-role';
import { InviteUser } from '@/features/users/application/use-cases/invite-user';
import { ListUsers } from '@/features/users/application/use-cases/list-users';
import { SupabaseUserAdminGateway } from '@/features/users/infrastructure/supabase-user-admin-gateway';
import type { AppSupabaseClient } from '@/shared/infrastructure/supabase/client';

/** Every port the app needs. Tests pass in-memory implementations instead of Supabase ones. */
export interface Adapters {
  readonly authGateway: AuthGateway;
  readonly exercises: ExerciseRepository;
  readonly phrases: PhraseRepository;
  readonly submissions: SubmissionRepository;
  readonly drafts: DraftRepository;
  readonly reviews: ReviewRepository;
  readonly userAdmin: UserAdminGateway;
}

export function createSupabaseAdapters(client: AppSupabaseClient): Adapters {
  return {
    authGateway: new SupabaseAuthGateway(client),
    exercises: new SupabaseExerciseRepository(client),
    phrases: new SupabasePhraseRepository(client),
    submissions: new SupabaseSubmissionRepository(client),
    drafts: new SupabaseDraftRepository(client),
    reviews: new SupabaseReviewRepository(client),
    userAdmin: new SupabaseUserAdminGateway(client),
  };
}

/** Composition root (ARCHITECTURE §4.6): wires adapters into use cases. */
export function createContainer(adapters: Adapters) {
  const { authGateway, exercises, phrases, submissions, drafts, reviews, userAdmin } = adapters;
  return {
    auth: {
      gateway: authGateway,
      signIn: new SignIn(authGateway),
      signUp: new SignUp(authGateway),
      signOut: new SignOut(authGateway),
      getCurrentUser: new GetCurrentUser(authGateway),
      requestPasswordReset: new RequestPasswordReset(authGateway),
      updatePassword: new UpdatePassword(authGateway),
    },
    writing: {
      listExercises: new ListWritingExercises(exercises),
      getExercise: new GetWritingExercise(exercises),
      listUsefulPhrases: new ListUsefulPhrases(phrases),
      submitAttempt: new SubmitWritingAttempt(submissions, drafts),
      saveDraft: new SaveDraft(drafts),
      getDraft: new GetDraft(drafts),
      deleteDraft: new DeleteDraft(drafts),
      listMyDrafts: new ListMyDrafts(drafts),
      listMySubmissions: new ListMySubmissions(submissions),
      getSubmission: new GetSubmission(submissions),
    },
    feedback: {
      listPending: new ListPendingSubmissions(reviews),
      getForReview: new GetSubmissionForReview(reviews),
      giveFeedback: new GiveFeedback(reviews),
    },
    users: {
      listUsers: new ListUsers(userAdmin),
      inviteUser: new InviteUser(userAdmin),
      changeUserRole: new ChangeUserRole(userAdmin),
    },
  } as const;
}

export type Container = ReturnType<typeof createContainer>;
