import { RepositoryError } from '@/shared/infrastructure/repository-error';
import type { Database } from '@/shared/infrastructure/supabase/database.types';
import type { DraftSummary, SubmissionDetail, SubmissionFeedback } from '../application/read-models';
import { isWritingTaskType, type WritingTaskType } from '../domain/task-type';
import type { UsefulPhrase } from '../domain/useful-phrase';
import { countWords, type WordRange } from '../domain/word-count';
import type { WritingExercise } from '../domain/writing-exercise';
import type { WritingSubmission } from '../domain/writing-submission';

type Tables = Database['public']['Tables'];
type ExerciseRow = Tables['exercises']['Row'];

/** Columns needed to build a WritingExercise, including the parent lesson (title + order). */
export const EXERCISE_COLUMNS =
  'id, prompt, min_words, max_words, task_type, guiding_points, recipient, lessons!inner(title, position)';

export type ExerciseWithLessonRow = Pick<
  ExerciseRow,
  'id' | 'prompt' | 'min_words' | 'max_words' | 'task_type' | 'guiding_points' | 'recipient'
> & { lessons: { title: string; position: number } };

export const SUBMISSION_COLUMNS = `id, exercise_id, attempt_number, content, duration_seconds, guiding_points_checked, created_at,
  exercises!inner(prompt, task_type, guiding_points, min_words, max_words, lessons!inner(title)),
  feedback(comment, score, created_at, updated_at)`;

export type SubmissionWithContextRow = Pick<
  Tables['writing_submissions']['Row'],
  | 'id'
  | 'exercise_id'
  | 'attempt_number'
  | 'content'
  | 'duration_seconds'
  | 'guiding_points_checked'
  | 'created_at'
> & {
  exercises: Pick<ExerciseRow, 'prompt' | 'task_type' | 'guiding_points' | 'min_words' | 'max_words'> & {
    lessons: { title: string };
  };
  feedback: Pick<Tables['feedback']['Row'], 'comment' | 'score' | 'created_at' | 'updated_at'> | null;
};

export const DRAFT_COLUMNS = `exercise_id, content, updated_at,
  exercises!inner(task_type, min_words, max_words, lessons!inner(title))`;

export type DraftWithContextRow = Pick<
  Tables['writing_drafts']['Row'],
  'exercise_id' | 'content' | 'updated_at'
> & {
  exercises: Pick<ExerciseRow, 'task_type' | 'min_words' | 'max_words'> & { lessons: { title: string } };
};

function toTaskType(value: string): WritingTaskType {
  if (!isWritingTaskType(value)) throw new RepositoryError(`Unknown writing task type: ${value}`);
  return value;
}

function toWordRange(min: number | null, max: number | null): WordRange | null {
  if (min === null || max === null) return null;
  return { min, max };
}

export function toExercise(row: ExerciseWithLessonRow): WritingExercise {
  return {
    id: row.id,
    title: row.lessons.title,
    position: row.lessons.position,
    prompt: row.prompt,
    taskType: toTaskType(row.task_type),
    guidingPoints: row.guiding_points,
    recipient: row.recipient,
    wordRange: toWordRange(row.min_words, row.max_words),
  };
}

export function toPhrase(row: Tables['useful_phrases']['Row']): UsefulPhrase {
  return {
    id: row.id,
    taskType: toTaskType(row.task_type),
    category: row.category,
    text: row.text,
    position: row.position,
  };
}

function toFeedback(row: SubmissionWithContextRow['feedback']): SubmissionFeedback | null {
  if (!row) return null;
  return {
    comment: row.comment,
    score: row.score,
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : null,
  };
}

export function toSubmissionDetail(row: SubmissionWithContextRow): SubmissionDetail {
  const exercise = row.exercises;
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    exerciseTitle: exercise.lessons.title,
    taskType: toTaskType(exercise.task_type),
    attemptNumber: row.attempt_number,
    content: row.content,
    wordCount: countWords(row.content),
    durationSeconds: row.duration_seconds,
    guidingPointsChecked: row.guiding_points_checked,
    guidingPointsTotal: exercise.guiding_points.length,
    createdAt: new Date(row.created_at),
    feedback: toFeedback(row.feedback),
    prompt: exercise.prompt,
    guidingPoints: exercise.guiding_points,
    wordRange: toWordRange(exercise.min_words, exercise.max_words),
  };
}

export function toSubmissionInsert(submission: WritingSubmission): Tables['writing_submissions']['Insert'] {
  return {
    id: submission.id,
    exercise_id: submission.exerciseId,
    student_id: submission.studentId,
    attempt_number: submission.attemptNumber,
    content: submission.content,
    duration_seconds: submission.durationSeconds,
    guiding_points_checked: submission.guidingPointsChecked,
    created_at: submission.createdAt.toISOString(),
  };
}

export function toDraftSummary(row: DraftWithContextRow): DraftSummary {
  return {
    exerciseId: row.exercise_id,
    exerciseTitle: row.exercises.lessons.title,
    taskType: toTaskType(row.exercises.task_type),
    content: row.content,
    wordCount: countWords(row.content),
    wordRange: toWordRange(row.exercises.min_words, row.exercises.max_words),
    updatedAt: new Date(row.updated_at),
  };
}
