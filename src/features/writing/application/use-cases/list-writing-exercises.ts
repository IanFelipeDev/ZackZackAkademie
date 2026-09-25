import type { WritingTaskType } from '../../domain/task-type';
import type { WritingExercise } from '../../domain/writing-exercise';
import type { ExerciseRepository } from '../ports/exercise-repository';

export class ListWritingExercises {
  constructor(private readonly exercises: ExerciseRepository) {}

  execute(taskType: WritingTaskType): Promise<WritingExercise[]> {
    return this.exercises.listByTaskType(taskType);
  }
}
