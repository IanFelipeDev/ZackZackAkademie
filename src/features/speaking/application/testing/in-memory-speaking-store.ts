import { AssessmentNotFoundError, PracticeAlreadyAssessedError } from '../../domain/errors';
import type { SpeakingPractice } from '../../domain/speaking-practice';
import type { SpeakingTopic } from '../../domain/speaking-topic';
import type { SpeakingAssessmentRepository } from '../ports/speaking-assessment-repository';
import type { SpeakingPracticeRepository } from '../ports/speaking-practice-repository';
import type { SpeakingRecordingStorage } from '../ports/speaking-recording-storage';
import type { SpeakingTopicRepository } from '../ports/speaking-topic-repository';
import type { PracticeAssessment, PracticeForAssessment } from '../read-models';

/** In-memory backend for the speaking ports, used by use-case and component tests. */
export class InMemorySpeakingStore {
  readonly topics: SpeakingTopic[] = [];
  readonly practices: SpeakingPractice[] = [];
  /** Assessments by practice id. */
  readonly assessments = new Map<string, PracticeAssessment>();
  /** Display names by profile id, for students and teachers. */
  readonly names = new Map<string, string>();
  /** Uploaded recordings by storage path. */
  readonly recordings = new Map<string, { data: Blob; contentType: string }>();
  /** Set to make the next uploads fail, like a dropped connection. */
  failUploads = false;

  readonly recordingStorage: SpeakingRecordingStorage = {
    upload: (path, data, contentType) => {
      if (this.failUploads) return Promise.reject(new Error('upload failed'));
      this.recordings.set(path, { data, contentType });
      return Promise.resolve();
    },
    playbackUrl: (path) =>
      this.recordings.has(path)
        ? Promise.resolve(`memory://recordings/${path}`)
        : Promise.reject(new Error(`No recording at ${path}`)),
  };

  readonly topicRepository: SpeakingTopicRepository = {
    listByPart: (exam, taskType) =>
      Promise.resolve(
        this.topics
          .filter((t) => t.exam === exam && t.taskType === taskType)
          .sort((a, b) => a.position - b.position),
      ),
    findById: (id) => Promise.resolve(this.topics.find((t) => t.id === id) ?? null),
  };

  readonly practiceRepository: SpeakingPracticeRepository = {
    save: (practice) => {
      this.practices.push(practice);
      return Promise.resolve();
    },
    listByStudent: (studentId) =>
      Promise.resolve(
        this.practices
          .filter((p) => p.studentId === studentId)
          .map((p) => this.toForAssessment(p))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      ),
  };

  readonly assessmentRepository: SpeakingAssessmentRepository = {
    listPractices: () => Promise.resolve(this.practices.map((p) => this.toForAssessment(p))),
    findPractice: (practiceId) => {
      const practice = this.practices.find((p) => p.id === practiceId);
      return Promise.resolve(practice ? this.toForAssessment(practice) : null);
    },
    save: (assessment) => {
      if (this.assessments.has(assessment.practiceId)) {
        return Promise.reject(new PracticeAlreadyAssessedError(assessment.practiceId));
      }
      this.assessments.set(assessment.practiceId, {
        score: assessment.score,
        comment: assessment.comment,
        teacherName: this.nameOf(assessment.teacherId),
        createdAt: assessment.createdAt,
        updatedAt: null,
      });
      return Promise.resolve();
    },
    update: (practiceId, content) => {
      const existing = this.assessments.get(practiceId);
      if (!existing) return Promise.reject(new AssessmentNotFoundError(practiceId));
      this.assessments.set(practiceId, { ...existing, ...content, updatedAt: new Date() });
      return Promise.resolve();
    },
  };

  private toForAssessment(practice: SpeakingPractice): PracticeForAssessment {
    const topic = this.topics.find((t) => t.id === practice.topicId);
    if (!topic) throw new Error(`Unknown speaking topic ${practice.topicId}`);
    return {
      id: practice.id,
      topicId: topic.id,
      topicTitle: topic.title,
      exam: topic.exam,
      taskType: topic.taskType,
      durationSeconds: practice.durationSeconds,
      createdAt: practice.createdAt,
      recordingPath: practice.recordingPath,
      assessment: this.assessments.get(practice.id) ?? null,
      studentName: this.nameOf(practice.studentId),
      prompt: topic.prompt,
      guidingPoints: topic.guidingPoints,
      sourceText: topic.sourceText,
    };
  }

  private nameOf(profileId: string): string {
    return this.names.get(profileId) ?? '—';
  }
}

export function buildSpeakingTopic(overrides: Partial<SpeakingTopic> = {}): SpeakingTopic {
  return {
    id: 'topic-1',
    exam: 'goethe',
    level: 'B2',
    taskType: 'presentation',
    position: 1,
    title: 'Homeoffice',
    prompt: 'Arbeiten von zu Hause – ein Modell für alle?',
    guidingPoints: ['Modelle beschreiben', 'Ein Modell genauer erklären', 'Vor- und Nachteile nennen'],
    sourceText: null,
    followUpQuestions: [],
    ...overrides,
  };
}
