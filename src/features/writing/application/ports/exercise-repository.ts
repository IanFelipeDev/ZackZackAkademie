import type { WritingTaskType } from '../../domain/task-type';
import type { WritingExercise } from '../../domain/writing-exercise';

export interface ExerciseRepository {
  /** Published exercises of a task type, ordered by position. */
  listByTaskType(taskType: WritingTaskType): Promise<WritingExercise[]>;
  findById(id: string): Promise<WritingExercise | null>;
}
