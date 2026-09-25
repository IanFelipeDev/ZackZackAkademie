import { ExerciseNotFoundError } from '../../domain/errors';
import type { WritingExercise } from '../../domain/writing-exercise';
import type { ExerciseRepository } from '../ports/exercise-repository';

export class GetWritingExercise {
  constructor(private readonly exercises: ExerciseRepository) {}

  /** @throws {ExerciseNotFoundError} when the exercise does not exist or is not visible */
  async execute(exerciseId: string): Promise<WritingExercise> {
    const exercise = await this.exercises.findById(exerciseId);
    if (!exercise) throw new ExerciseNotFoundError(exerciseId);
    return exercise;
  }
}
