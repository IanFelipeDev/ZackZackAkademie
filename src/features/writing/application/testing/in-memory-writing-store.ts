import type { UsefulPhrase } from '../../domain/useful-phrase';
import { countWords } from '../../domain/word-count';
import type { WritingDraft } from '../../domain/writing-draft';
import type { WritingExercise } from '../../domain/writing-exercise';
import type { WritingSubmission } from '../../domain/writing-submission';
import type { DraftRepository } from '../ports/draft-repository';
import type { ExerciseRepository } from '../ports/exercise-repository';
import type { PhraseRepository } from '../ports/phrase-repository';
import type { SubmissionRepository } from '../ports/submission-repository';
import type { SubmissionDetail, SubmissionFeedback } from '../read-models';

interface StoredDraft {
  readonly draft: WritingDraft;
  readonly updatedAt: Date;
}

/** In-memory backend for the writing ports, used by use-case and component tests. */
export class InMemoryWritingStore {
  readonly exercises: WritingExercise[] = [];
  readonly phrases: UsefulPhrase[] = [];
  readonly submissions: WritingSubmission[] = [];
  readonly feedback = new Map<string, SubmissionFeedback>();
  private readonly drafts = new Map<string, StoredDraft>();
  private clock = 0;

  readonly exerciseRepository: ExerciseRepository = {
    listByTaskType: (taskType) =>
      Promise.resolve(
        this.exercises.filter((e) => e.taskType === taskType).sort((a, b) => a.position - b.position),
      ),
    findById: (id) => Promise.resolve(this.exercises.find((e) => e.id === id) ?? null),
  };

  readonly phraseRepository: PhraseRepository = {
    listByTaskType: (taskType) => Promise.resolve(this.phrases.filter((p) => p.taskType === taskType)),
  };

  readonly submissionRepository: SubmissionRepository = {
    save: (submission) => {
      this.submissions.push(submission);
      return Promise.resolve();
    },
    countAttempts: (exerciseId, studentId) =>
      Promise.resolve(
        this.submissions.filter((s) => s.exerciseId === exerciseId && s.studentId === studentId).length,
      ),
    listSummariesByStudent: (studentId) =>
      Promise.resolve(
        this.submissions
          .filter((s) => s.studentId === studentId)
          .map((s) => this.toDetail(s))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      ),
    findDetailById: (id) => {
      const submission = this.submissions.find((s) => s.id === id);
      return Promise.resolve(submission ? this.toDetail(submission) : null);
    },
  };

  readonly draftRepository: DraftRepository = {
    save: (draft) => {
      this.drafts.set(draftKey(draft.exerciseId, draft.studentId), { draft, updatedAt: this.tick() });
      return Promise.resolve();
    },
    find: (exerciseId, studentId) =>
      Promise.resolve(this.drafts.get(draftKey(exerciseId, studentId))?.draft ?? null),
    delete: (exerciseId, studentId) => {
      this.drafts.delete(draftKey(exerciseId, studentId));
      return Promise.resolve();
    },
    listByStudent: (studentId) =>
      Promise.resolve(
        [...this.drafts.values()]
          .filter(({ draft }) => draft.studentId === studentId)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .map(({ draft, updatedAt }) => {
            const exercise = this.requireExercise(draft.exerciseId);
            return {
              exerciseId: draft.exerciseId,
              exerciseTitle: exercise.title,
              taskType: exercise.taskType,
              content: draft.content,
              wordCount: countWords(draft.content),
              wordRange: exercise.wordRange,
              updatedAt,
            };
          }),
      ),
  };

  private toDetail(submission: WritingSubmission): SubmissionDetail {
    const exercise = this.requireExercise(submission.exerciseId);
    return {
      id: submission.id,
      exerciseId: exercise.id,
      exerciseTitle: exercise.title,
      taskType: exercise.taskType,
      attemptNumber: submission.attemptNumber,
      content: submission.content,
      wordCount: countWords(submission.content),
      durationSeconds: submission.durationSeconds,
      guidingPointsChecked: submission.guidingPointsChecked,
      guidingPointsTotal: exercise.guidingPoints.length,
      createdAt: submission.createdAt,
      feedback: this.feedback.get(submission.id) ?? null,
      prompt: exercise.prompt,
      guidingPoints: exercise.guidingPoints,
      wordRange: exercise.wordRange,
    };
  }

  private requireExercise(id: string): WritingExercise {
    const exercise = this.exercises.find((e) => e.id === id);
    if (!exercise) throw new Error(`Unknown exercise ${id}`);
    return exercise;
  }

  private tick(): Date {
    this.clock += 1;
    return new Date(Date.UTC(2026, 0, 1, 0, 0, this.clock));
  }
}

function draftKey(exerciseId: string, studentId: string): string {
  return `${exerciseId}:${studentId}`;
}

export function buildExercise(overrides: Partial<WritingExercise> = {}): WritingExercise {
  return {
    id: 'exercise-1',
    title: 'Auto als umweltfreundliches Verkehrsmittel',
    position: 1,
    prompt: 'Sie schreiben einen Forumsbeitrag zum Thema „Auto als umweltfreundliches Verkehrsmittel".',
    taskType: 'forum_post',
    guidingPoints: ['Meinung äußern', 'Gründe nennen', 'Alternativen nennen', 'Vorteile nennen'],
    recipient: null,
    wordRange: { min: 150, max: 180 },
    ...overrides,
  };
}
