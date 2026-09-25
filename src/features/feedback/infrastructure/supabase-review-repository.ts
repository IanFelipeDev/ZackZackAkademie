import { countWords } from '@/shared/domain';
import { RepositoryError } from '@/shared/infrastructure/repository-error';
import type { AppSupabaseClient } from '@/shared/infrastructure/supabase/client';
import type { Database } from '@/shared/infrastructure/supabase/database.types';
import type { ReviewRepository } from '../application/ports/review-repository';
import type { PendingSubmission, SubmissionForReview } from '../application/read-models';
import { SubmissionAlreadyReviewedError } from '../domain/errors';
import type { Feedback } from '../domain/feedback';

type Tables = Database['public']['Tables'];

const UNIQUE_VIOLATION = '23505';

const REVIEW_COLUMNS = `id, attempt_number, content, created_at, duration_seconds, guiding_points_checked,
  profiles!writing_submissions_student_id_fkey(display_name),
  exercises!inner(prompt, task_type, guiding_points, recipient, min_words, max_words, lessons!inner(title)),
  feedback(comment, score, created_at)`;

type ReviewRow = Pick<
  Tables['writing_submissions']['Row'],
  'id' | 'attempt_number' | 'content' | 'created_at' | 'duration_seconds' | 'guiding_points_checked'
> & {
  profiles: { display_name: string } | null;
  exercises: Pick<
    Tables['exercises']['Row'],
    'prompt' | 'task_type' | 'guiding_points' | 'recipient' | 'min_words' | 'max_words'
  > & { lessons: { title: string } };
  feedback: Pick<Tables['feedback']['Row'], 'comment' | 'score' | 'created_at'> | null;
};

function toPending(row: ReviewRow): PendingSubmission {
  return {
    id: row.id,
    studentName: row.profiles?.display_name ?? '—',
    exerciseTitle: row.exercises.lessons.title,
    taskType: row.exercises.task_type,
    attemptNumber: row.attempt_number,
    wordCount: countWords(row.content),
    createdAt: new Date(row.created_at),
  };
}

function toForReview(row: ReviewRow): SubmissionForReview {
  const { exercises: exercise, feedback } = row;
  return {
    ...toPending(row),
    content: row.content,
    prompt: exercise.prompt,
    guidingPoints: exercise.guiding_points,
    recipient: exercise.recipient,
    minWords: exercise.min_words,
    maxWords: exercise.max_words,
    durationSeconds: row.duration_seconds,
    guidingPointsChecked: row.guiding_points_checked,
    feedback: feedback
      ? { comment: feedback.comment, score: feedback.score, createdAt: new Date(feedback.created_at) }
      : null,
  };
}

export class SupabaseReviewRepository implements ReviewRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async listPending(): Promise<PendingSubmission[]> {
    const { data, error } = await this.client
      .from('writing_submissions')
      .select(REVIEW_COLUMNS)
      .is('feedback', null)
      .order('created_at', { ascending: true })
      .overrideTypes<ReviewRow[], { merge: false }>();
    if (error) throw new RepositoryError('Failed to list pending submissions', { cause: error });
    return data.map(toPending);
  }

  async findForReview(submissionId: string): Promise<SubmissionForReview | null> {
    const { data, error } = await this.client
      .from('writing_submissions')
      .select(REVIEW_COLUMNS)
      .eq('id', submissionId)
      .overrideTypes<ReviewRow[], { merge: false }>();
    if (error) throw new RepositoryError('Failed to load submission for review', { cause: error });
    const row = data[0];
    return row ? toForReview(row) : null;
  }

  async saveFeedback(feedback: Feedback): Promise<void> {
    const { error } = await this.client.from('feedback').insert({
      id: feedback.id,
      submission_id: feedback.submissionId,
      teacher_id: feedback.teacherId,
      comment: feedback.comment,
      score: feedback.score,
      created_at: feedback.createdAt.toISOString(),
    });
    if (error?.code === UNIQUE_VIOLATION) throw new SubmissionAlreadyReviewedError(feedback.submissionId);
    if (error) throw new RepositoryError('Failed to save feedback', { cause: error });
  }
}
