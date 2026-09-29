import type { AuthGateway } from '@/features/auth/application/ports/auth-gateway';
import { GetCurrentUser } from '@/features/auth/application/use-cases/get-current-user';
import { RecordActivity } from '@/features/auth/application/use-cases/record-activity';
import { RequestPasswordReset } from '@/features/auth/application/use-cases/request-password-reset';
import { SignIn } from '@/features/auth/application/use-cases/sign-in';
import { SignOut } from '@/features/auth/application/use-cases/sign-out';
import { UpdatePassword } from '@/features/auth/application/use-cases/update-password';
import { SupabaseAuthGateway } from '@/features/auth/infrastructure/supabase-auth-gateway';
import type { ReviewRepository } from '@/features/feedback/application/ports/review-repository';
import { GetSubmissionForReview } from '@/features/feedback/application/use-cases/get-submission-for-review';
import { GiveFeedback } from '@/features/feedback/application/use-cases/give-feedback';
import { ListPendingSubmissions } from '@/features/feedback/application/use-cases/list-pending-submissions';
import { ListReviewedSubmissions } from '@/features/feedback/application/use-cases/list-reviewed-submissions';
import { UpdateFeedback } from '@/features/feedback/application/use-cases/update-feedback';
import { SupabaseReviewRepository } from '@/features/feedback/infrastructure/supabase-review-repository';
import type { SpeakingAssessmentRepository } from '@/features/speaking/application/ports/speaking-assessment-repository';
import type { SpeakingPracticeRepository } from '@/features/speaking/application/ports/speaking-practice-repository';
import type { SpeakingTopicRepository } from '@/features/speaking/application/ports/speaking-topic-repository';
import {
  AssessSpeakingPractice,
  GetPracticeForAssessment,
  UpdateSpeakingAssessment,
} from '@/features/speaking/application/use-cases/assess-speaking-practice';
import { GetMySpeakingStats } from '@/features/speaking/application/use-cases/get-my-speaking-stats';
import { GetSpeakingTopic } from '@/features/speaking/application/use-cases/get-speaking-topic';
import { ListMySpeakingPractices } from '@/features/speaking/application/use-cases/list-my-speaking-practices';
import {
  ListAssessedPractices,
  ListPracticesAwaitingAssessment,
} from '@/features/speaking/application/use-cases/list-practices-for-assessment';
import { ListSpeakingTopics } from '@/features/speaking/application/use-cases/list-speaking-topics';
import { RecordSpeakingPractice } from '@/features/speaking/application/use-cases/record-speaking-practice';
import {
  SupabaseSpeakingAssessmentRepository,
  SupabaseSpeakingPracticeRepository,
  SupabaseSpeakingTopicRepository,
} from '@/features/speaking/infrastructure/supabase-speaking-repositories';
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
import {
  DeactivateUser,
  DeleteUser,
  ReactivateUser,
  ResendAccess,
} from '@/features/users/application/use-cases/manage-user-access';
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
  readonly speakingTopics: SpeakingTopicRepository;
  readonly speakingPractices: SpeakingPracticeRepository;
  readonly speakingAssessments: SpeakingAssessmentRepository;
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
    speakingTopics: new SupabaseSpeakingTopicRepository(client),
    speakingPractices: new SupabaseSpeakingPracticeRepository(client),
    speakingAssessments: new SupabaseSpeakingAssessmentRepository(client),
    userAdmin: new SupabaseUserAdminGateway(client),
  };
}

/** Composition root (ARCHITECTURE §4.6): wires adapters into use cases. */
export function createContainer(adapters: Adapters) {
  const {
    authGateway,
    exercises,
    phrases,
    submissions,
    drafts,
    reviews,
    speakingTopics,
    speakingPractices,
    speakingAssessments,
    userAdmin,
  } = adapters;
  return {
    auth: {
      gateway: authGateway,
      signIn: new SignIn(authGateway),
      signOut: new SignOut(authGateway),
      getCurrentUser: new GetCurrentUser(authGateway),
      requestPasswordReset: new RequestPasswordReset(authGateway),
      updatePassword: new UpdatePassword(authGateway),
      recordActivity: new RecordActivity(authGateway),
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
      listReviewed: new ListReviewedSubmissions(reviews),
      updateFeedback: new UpdateFeedback(reviews),
    },
    speaking: {
      listTopics: new ListSpeakingTopics(speakingTopics, speakingPractices),
      getTopic: new GetSpeakingTopic(speakingTopics),
      recordPractice: new RecordSpeakingPractice(speakingPractices),
      listMyPractices: new ListMySpeakingPractices(speakingPractices),
      getMyStats: new GetMySpeakingStats(speakingTopics, speakingPractices),
      listAwaitingAssessment: new ListPracticesAwaitingAssessment(speakingAssessments),
      listAssessed: new ListAssessedPractices(speakingAssessments),
      getPracticeForAssessment: new GetPracticeForAssessment(speakingAssessments),
      assessPractice: new AssessSpeakingPractice(speakingAssessments),
      updateAssessment: new UpdateSpeakingAssessment(speakingAssessments),
    },
    users: {
      listUsers: new ListUsers(userAdmin),
      inviteUser: new InviteUser(userAdmin),
      changeUserRole: new ChangeUserRole(userAdmin),
      resendAccess: new ResendAccess(userAdmin),
      deactivateUser: new DeactivateUser(userAdmin),
      reactivateUser: new ReactivateUser(userAdmin),
      deleteUser: new DeleteUser(userAdmin),
    },
  } as const;
}

export type Container = ReturnType<typeof createContainer>;
