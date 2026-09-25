import { describe, expect, it } from 'vitest';
import {
  DraftTooLongError,
  EmptySubmissionError,
  InvalidAttemptNumberError,
  SubmissionTooLongError,
} from './errors';
import { isWritingTaskType } from './task-type';
import { groupPhrasesByCategory, type UsefulPhrase } from './useful-phrase';
import { countWords, evaluateWordCount, wordProgressPercent } from './word-count';
import { WritingDraft } from './writing-draft';
import { pickRandomExercise } from './writing-exercise';
import { WritingSubmission } from './writing-submission';

const baseSubmission = {
  exerciseId: 'exercise-1',
  studentId: 'student-1',
  content: 'Ich bin der Ansicht, dass …',
  attemptNumber: 1,
  durationSeconds: 125,
  guidingPointsChecked: 3,
};

describe('WritingSubmission', () => {
  it('trims the content and keeps the attempt metadata', () => {
    const submission = WritingSubmission.create({ ...baseSubmission, content: '  Hallo Welt  ' });

    expect(submission.content).toBe('Hallo Welt');
    expect(submission.attemptNumber).toBe(1);
    expect(submission.durationSeconds).toBe(125);
    expect(submission.id).toMatch(/[0-9a-f-]{36}/);
  });

  it('rejects an empty submission', () => {
    expect(() => WritingSubmission.create({ ...baseSubmission, content: '   ' })).toThrow(
      EmptySubmissionError,
    );
  });

  it('rejects a submission longer than the maximum', () => {
    const content = 'a'.repeat(WritingSubmission.MAX_LENGTH + 1);
    expect(() => WritingSubmission.create({ ...baseSubmission, content })).toThrow(SubmissionTooLongError);
  });

  it('rejects attempt numbers below one', () => {
    expect(() => WritingSubmission.create({ ...baseSubmission, attemptNumber: 0 })).toThrow(
      InvalidAttemptNumberError,
    );
  });

  it('drops invalid counters instead of storing garbage', () => {
    const submission = WritingSubmission.create({
      ...baseSubmission,
      durationSeconds: -5,
      guidingPointsChecked: Number.NaN,
    });

    expect(submission.durationSeconds).toBeNull();
    expect(submission.guidingPointsChecked).toBeNull();
  });
});

describe('WritingDraft', () => {
  it('accepts blank content and reports it as blank', () => {
    const draft = WritingDraft.create({ exerciseId: 'e', studentId: 's', content: '  ' });
    expect(draft.isBlank).toBe(true);
  });

  it('rejects drafts longer than the submission limit', () => {
    const content = 'a'.repeat(WritingSubmission.MAX_LENGTH + 1);
    expect(() => WritingDraft.create({ exerciseId: 'e', studentId: 's', content })).toThrow(
      DraftTooLongError,
    );
  });
});

describe('word counting', () => {
  it('counts words separated by any whitespace', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('  Ich  bin\nhier\tjetzt ')).toBe(4);
  });

  it('classifies counts against the range with tolerance above the maximum', () => {
    const range = { min: 150, max: 180 };
    expect(evaluateWordCount(0, range)).toBe('empty');
    expect(evaluateWordCount(149, range)).toBe('below');
    expect(evaluateWordCount(150, range)).toBe('within');
    expect(evaluateWordCount(220, range)).toBe('within');
    expect(evaluateWordCount(221, range)).toBe('above');
    expect(evaluateWordCount(10, null)).toBe('within');
  });

  it('reports progress towards the minimum, capped at 100', () => {
    expect(wordProgressPercent(75, { min: 150, max: 180 })).toBe(50);
    expect(wordProgressPercent(300, { min: 150, max: 180 })).toBe(100);
    expect(wordProgressPercent(0, null)).toBe(0);
    expect(wordProgressPercent(3, null)).toBe(100);
  });
});

describe('useful phrases', () => {
  const phrase = (position: number, category: string): UsefulPhrase => ({
    id: `p${position}`,
    taskType: 'forum_post',
    category,
    text: `phrase ${position}`,
    position,
  });

  it('groups phrases by category in position order', () => {
    const groups = groupPhrasesByCategory([
      phrase(3, 'Schluss'),
      phrase(1, 'Einleitung'),
      phrase(2, 'Einleitung'),
    ]);

    expect(groups.map((g) => g.category)).toEqual(['Einleitung', 'Schluss']);
    expect(groups[0]?.phrases.map((p) => p.id)).toEqual(['p1', 'p2']);
  });
});

describe('helpers', () => {
  it('picks a random item using the given random source', () => {
    expect(pickRandomExercise(['a', 'b', 'c'], () => 0.99)).toBe('c');
    expect(pickRandomExercise([], () => 0.5)).toBeUndefined();
  });

  it('validates task types', () => {
    expect(isWritingTaskType('formal_email')).toBe(true);
    expect(isWritingTaskType('essay')).toBe(false);
  });
});
