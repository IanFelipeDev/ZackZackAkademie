import { RepositoryError } from '@/shared/infrastructure/repository-error';
import type { AppSupabaseClient } from '@/shared/infrastructure/supabase/client';
import type { ExerciseRepository } from '../application/ports/exercise-repository';
import type { WritingTaskType } from '../domain/task-type';
import type { WritingExercise } from '../domain/writing-exercise';
import { EXERCISE_COLUMNS, toExercise, type ExerciseWithLessonRow } from './writing-mappers';

export class SupabaseExerciseRepository implements ExerciseRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async listByTaskType(taskType: WritingTaskType): Promise<WritingExercise[]> {
    // Unpublished lessons are filtered by RLS for students; staff see them too.
    const { data, error } = await this.client
      .from('exercises')
      .select(EXERCISE_COLUMNS)
      .eq('task_type', taskType)
      .overrideTypes<ExerciseWithLessonRow[], { merge: false }>();
    if (error) throw new RepositoryError('Failed to list exercises', { cause: error });
    return data.map(toExercise).sort((a, b) => a.position - b.position);
  }

  async findById(id: string): Promise<WritingExercise | null> {
    const { data, error } = await this.client
      .from('exercises')
      .select(EXERCISE_COLUMNS)
      .eq('id', id)
      .overrideTypes<ExerciseWithLessonRow[], { merge: false }>();
    if (error) throw new RepositoryError('Failed to load exercise', { cause: error });
    const row = data[0];
    return row ? toExercise(row) : null;
  }
}
