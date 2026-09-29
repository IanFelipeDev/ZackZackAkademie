import { RepositoryError } from '@/shared/infrastructure/repository-error';
import type { AppSupabaseClient } from '@/shared/infrastructure/supabase/client';
import type { SpeakingAssessmentRepository } from '../application/ports/speaking-assessment-repository';
import type { SpeakingPracticeRepository } from '../application/ports/speaking-practice-repository';
import type { SpeakingTopicRepository } from '../application/ports/speaking-topic-repository';
import type { PracticeForAssessment, SpeakingPracticeSummary } from '../application/read-models';
import { AssessmentNotFoundError, PracticeAlreadyAssessedError } from '../domain/errors';
import type { AssessmentContent, SpeakingAssessment } from '../domain/speaking-assessment';
import type { SpeakingPractice } from '../domain/speaking-practice';
import type { SpeakingTopic } from '../domain/speaking-topic';
import type { SpeakingTaskType } from '../domain/task-type';
import {
  PRACTICE_COLUMNS,
  TOPIC_COLUMNS,
  toPractice,
  toTopic,
  type PracticeRow,
  type SpeakingTopicRow,
} from './speaking-mappers';

const UNIQUE_VIOLATION = '23505';

export class SupabaseSpeakingTopicRepository implements SpeakingTopicRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async listByTaskType(taskType: SpeakingTaskType): Promise<SpeakingTopic[]> {
    // Unpublished topics are filtered by RLS for students; staff see them too.
    const { data, error } = await this.client
      .from('speaking_topics')
      .select(TOPIC_COLUMNS)
      .eq('task_type', taskType)
      .order('position')
      .overrideTypes<SpeakingTopicRow[], { merge: false }>();
    if (error) throw new RepositoryError('Failed to list speaking topics', { cause: error });
    return data.map(toTopic);
  }

  async findById(id: string): Promise<SpeakingTopic | null> {
    const { data, error } = await this.client
      .from('speaking_topics')
      .select(TOPIC_COLUMNS)
      .eq('id', id)
      .overrideTypes<SpeakingTopicRow[], { merge: false }>();
    if (error) throw new RepositoryError('Failed to load speaking topic', { cause: error });
    const row = data[0];
    return row ? toTopic(row) : null;
  }
}

export class SupabaseSpeakingPracticeRepository implements SpeakingPracticeRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async save(practice: SpeakingPractice): Promise<void> {
    // created_at is stamped by the database.
    const { error } = await this.client.from('speaking_practices').insert({
      id: practice.id,
      topic_id: practice.topicId,
      student_id: practice.studentId,
      duration_seconds: practice.durationSeconds,
    });
    if (error) throw new RepositoryError('Failed to save speaking practice', { cause: error });
  }

  async listByStudent(studentId: string): Promise<SpeakingPracticeSummary[]> {
    const { data, error } = await this.client
      .from('speaking_practices')
      .select(PRACTICE_COLUMNS)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .overrideTypes<PracticeRow[], { merge: false }>();
    if (error) throw new RepositoryError('Failed to list speaking practices', { cause: error });
    return data.map(toPractice);
  }
}

export class SupabaseSpeakingAssessmentRepository implements SpeakingAssessmentRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async listPractices(): Promise<PracticeForAssessment[]> {
    const { data, error } = await this.client
      .from('speaking_practices')
      .select(PRACTICE_COLUMNS)
      .overrideTypes<PracticeRow[], { merge: false }>();
    if (error) throw new RepositoryError('Failed to list speaking practices', { cause: error });
    return data.map(toPractice);
  }

  async findPractice(practiceId: string): Promise<PracticeForAssessment | null> {
    const { data, error } = await this.client
      .from('speaking_practices')
      .select(PRACTICE_COLUMNS)
      .eq('id', practiceId)
      .overrideTypes<PracticeRow[], { merge: false }>();
    if (error) throw new RepositoryError('Failed to load speaking practice', { cause: error });
    const row = data[0];
    return row ? toPractice(row) : null;
  }

  async save(assessment: SpeakingAssessment): Promise<void> {
    const { error } = await this.client.from('speaking_assessments').insert({
      id: assessment.id,
      practice_id: assessment.practiceId,
      teacher_id: assessment.teacherId,
      score: assessment.score,
      comment: assessment.comment,
    });
    if (error?.code === UNIQUE_VIOLATION) throw new PracticeAlreadyAssessedError(assessment.practiceId);
    if (error) throw new RepositoryError('Failed to save speaking assessment', { cause: error });
  }

  async update(practiceId: string, content: AssessmentContent): Promise<void> {
    const { data, error } = await this.client
      .from('speaking_assessments')
      .update({ score: content.score, comment: content.comment })
      .eq('practice_id', practiceId)
      .select('id');
    if (error) throw new RepositoryError('Failed to update speaking assessment', { cause: error });
    if (data.length === 0) throw new AssessmentNotFoundError(practiceId);
  }
}
