import { RepositoryError } from '@/shared/infrastructure/repository-error';
import type { AppSupabaseClient } from '@/shared/infrastructure/supabase/client';
import type { SubmissionRepository } from '../application/ports/submission-repository';
import type { SubmissionDetail, SubmissionSummary } from '../application/read-models';
import type { WritingSubmission } from '../domain/writing-submission';
import {
  SUBMISSION_COLUMNS,
  toSubmissionDetail,
  toSubmissionInsert,
  type SubmissionWithContextRow,
} from './writing-mappers';

export class SupabaseSubmissionRepository implements SubmissionRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async save(submission: WritingSubmission): Promise<void> {
    const { error } = await this.client.from('writing_submissions').insert(toSubmissionInsert(submission));
    if (error) throw new RepositoryError('Failed to save submission', { cause: error });
  }

  async countAttempts(exerciseId: string, studentId: string): Promise<number> {
    const { count, error } = await this.client
      .from('writing_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('exercise_id', exerciseId)
      .eq('student_id', studentId);
    if (error) throw new RepositoryError('Failed to count attempts', { cause: error });
    return count ?? 0;
  }

  async listSummariesByStudent(studentId: string): Promise<SubmissionSummary[]> {
    const { data, error } = await this.client
      .from('writing_submissions')
      .select(SUBMISSION_COLUMNS)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .overrideTypes<SubmissionWithContextRow[], { merge: false }>();
    if (error) throw new RepositoryError('Failed to list submissions', { cause: error });
    return data.map(toSubmissionDetail);
  }

  async findDetailById(id: string): Promise<SubmissionDetail | null> {
    const { data, error } = await this.client
      .from('writing_submissions')
      .select(SUBMISSION_COLUMNS)
      .eq('id', id)
      .overrideTypes<SubmissionWithContextRow[], { merge: false }>();
    if (error) throw new RepositoryError('Failed to load submission', { cause: error });
    const row = data[0];
    return row ? toSubmissionDetail(row) : null;
  }
}
