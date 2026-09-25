import { RepositoryError } from '@/shared/infrastructure/repository-error';
import type { AppSupabaseClient } from '@/shared/infrastructure/supabase/client';
import type { DraftRepository } from '../application/ports/draft-repository';
import type { DraftSummary } from '../application/read-models';
import { WritingDraft } from '../domain/writing-draft';
import { DRAFT_COLUMNS, toDraftSummary, type DraftWithContextRow } from './writing-mappers';

export class SupabaseDraftRepository implements DraftRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async save(draft: WritingDraft): Promise<void> {
    const { error } = await this.client
      .from('writing_drafts')
      .upsert(
        { exercise_id: draft.exerciseId, student_id: draft.studentId, content: draft.content },
        { onConflict: 'student_id,exercise_id' },
      );
    if (error) throw new RepositoryError('Failed to save draft', { cause: error });
  }

  async find(exerciseId: string, studentId: string): Promise<WritingDraft | null> {
    const { data, error } = await this.client
      .from('writing_drafts')
      .select('exercise_id, student_id, content')
      .eq('exercise_id', exerciseId)
      .eq('student_id', studentId)
      .maybeSingle();
    if (error) throw new RepositoryError('Failed to load draft', { cause: error });
    if (!data) return null;
    return WritingDraft.create({
      exerciseId: data.exercise_id,
      studentId: data.student_id,
      content: data.content,
    });
  }

  async delete(exerciseId: string, studentId: string): Promise<void> {
    const { error } = await this.client
      .from('writing_drafts')
      .delete()
      .eq('exercise_id', exerciseId)
      .eq('student_id', studentId);
    if (error) throw new RepositoryError('Failed to delete draft', { cause: error });
  }

  async listByStudent(studentId: string): Promise<DraftSummary[]> {
    const { data, error } = await this.client
      .from('writing_drafts')
      .select(DRAFT_COLUMNS)
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false })
      .overrideTypes<DraftWithContextRow[], { merge: false }>();
    if (error) throw new RepositoryError('Failed to list drafts', { cause: error });
    return data.map(toDraftSummary);
  }
}
