import { isCefrLevel, type CefrLevel } from '@/shared/domain';
import { RepositoryError } from '@/shared/infrastructure/repository-error';
import type { Database } from '@/shared/infrastructure/supabase/database.types';
import type { PracticeAssessment, PracticeForAssessment } from '../application/read-models';
import { isSpeakingExam, type SpeakingExam } from '../domain/exam';
import type { SpeakingTopic } from '../domain/speaking-topic';
import { isSpeakingTaskType, type SpeakingTaskType } from '../domain/task-type';

type Tables = Database['public']['Tables'];
type TopicRow = Tables['speaking_topics']['Row'];

export const TOPIC_COLUMNS =
  'id, exam, level, task_type, position, title, prompt, guiding_points, source_text, follow_up_questions';

export type SpeakingTopicRow = Pick<
  TopicRow,
  | 'id'
  | 'exam'
  | 'level'
  | 'task_type'
  | 'position'
  | 'title'
  | 'prompt'
  | 'guiding_points'
  | 'source_text'
  | 'follow_up_questions'
>;

/** A practice with its topic, student and assessment (one-to-one, so an object or null). */
export const PRACTICE_COLUMNS = `id, topic_id, duration_seconds, created_at, recording_path,
  speaking_topics!inner(title, exam, task_type, prompt, guiding_points, source_text),
  profiles(display_name),
  speaking_assessments(score, comment, created_at, updated_at, profiles(display_name))`;

export type PracticeRow = Pick<
  Tables['speaking_practices']['Row'],
  'id' | 'topic_id' | 'duration_seconds' | 'created_at' | 'recording_path'
> & {
  speaking_topics: Pick<
    TopicRow,
    'title' | 'exam' | 'task_type' | 'prompt' | 'guiding_points' | 'source_text'
  >;
  profiles: { display_name: string } | null;
  speaking_assessments:
    | (Pick<Tables['speaking_assessments']['Row'], 'score' | 'comment' | 'created_at' | 'updated_at'> & {
        profiles: { display_name: string } | null;
      })
    | null;
};

function toTaskType(value: string): SpeakingTaskType {
  if (!isSpeakingTaskType(value)) throw new RepositoryError(`Unknown speaking task type: ${value}`);
  return value;
}

function toExam(value: string): SpeakingExam {
  if (!isSpeakingExam(value)) throw new RepositoryError(`Unknown speaking exam: ${value}`);
  return value;
}

function toLevel(value: string): CefrLevel {
  if (!isCefrLevel(value)) throw new RepositoryError(`Unknown CEFR level: ${value}`);
  return value;
}

export function toTopic(row: SpeakingTopicRow): SpeakingTopic {
  return {
    id: row.id,
    exam: toExam(row.exam),
    level: toLevel(row.level),
    taskType: toTaskType(row.task_type),
    position: row.position,
    title: row.title,
    prompt: row.prompt,
    guidingPoints: row.guiding_points,
    sourceText: row.source_text,
    followUpQuestions: row.follow_up_questions,
  };
}

function toAssessment(row: NonNullable<PracticeRow['speaking_assessments']>): PracticeAssessment {
  return {
    score: row.score,
    comment: row.comment,
    teacherName: row.profiles?.display_name ?? '—',
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : null,
  };
}

export function toPractice(row: PracticeRow): PracticeForAssessment {
  const topic = row.speaking_topics;
  return {
    id: row.id,
    topicId: row.topic_id,
    topicTitle: topic.title,
    exam: toExam(topic.exam),
    taskType: toTaskType(topic.task_type),
    durationSeconds: row.duration_seconds,
    createdAt: new Date(row.created_at),
    recordingPath: row.recording_path,
    assessment: row.speaking_assessments ? toAssessment(row.speaking_assessments) : null,
    studentName: row.profiles?.display_name ?? '—',
    prompt: topic.prompt,
    guidingPoints: topic.guiding_points,
    sourceText: topic.source_text,
  };
}
