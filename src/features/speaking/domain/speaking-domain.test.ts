import { describe, expect, it } from 'vitest';
import {
  AssessmentCommentTooLongError,
  InvalidPracticeDurationError,
  InvalidSpeakingScoreError,
} from './errors';
import { MAX_ASSESSMENT_COMMENT_LENGTH, SpeakingAssessment } from './speaking-assessment';
import { MAX_PRACTICE_SECONDS, SpeakingPractice } from './speaking-practice';
import { SPEAKING_STAGE_PLANS, planDuration, stageAt } from './speaking-timer';
import { topicStatus } from './speaking-topic';
import { isSpeakingTaskType } from './task-type';

describe('stageAt', () => {
  const plan = SPEAKING_STAGE_PLANS.presentation;

  it('plans 5 minutes for Teil 1 and 2:30 for Teil 2', () => {
    expect(planDuration(SPEAKING_STAGE_PLANS.presentation)).toBe(300);
    expect(planDuration(SPEAKING_STAGE_PLANS.discussion)).toBe(150);
  });

  it.each([
    [0, 'introduction', 0, 60],
    [59, 'introduction', 0, 1],
    [60, 'development', 1, 180],
    [239, 'development', 1, 1],
    [240, 'conclusion', 2, 60],
    [299, 'conclusion', 2, 1],
  ] as const)('after %is is in the %s', (elapsed, stage, index, left) => {
    expect(stageAt(plan, elapsed)).toEqual({ stage, index, secondsLeftInStage: left, overtimeSeconds: 0 });
  });

  it('runs into overtime in the last stage once the plan is over', () => {
    expect(stageAt(plan, 300)).toEqual({
      stage: 'conclusion',
      index: 2,
      secondsLeftInStage: 0,
      overtimeSeconds: 0,
    });
    expect(stageAt(plan, 322)).toMatchObject({ stage: 'conclusion', overtimeSeconds: 22 });
  });

  it('needs at least one stage', () => {
    expect(() => stageAt([], 10)).toThrow();
  });
});

describe('SpeakingPractice', () => {
  it('records a practice with its duration', () => {
    const practice = SpeakingPractice.create({ topicId: 't1', studentId: 's1', durationSeconds: 250 });
    expect(practice).toMatchObject({ topicId: 't1', studentId: 's1', durationSeconds: 250 });
    expect(practice.id).toBeTruthy();
  });

  it.each([-1, 2.5, MAX_PRACTICE_SECONDS + 1])('rejects a duration of %s seconds', (durationSeconds) => {
    expect(() => SpeakingPractice.create({ topicId: 't1', studentId: 's1', durationSeconds })).toThrow(
      InvalidPracticeDurationError,
    );
  });
});

describe('SpeakingAssessment', () => {
  const input = { practiceId: 'p1', teacherId: 'teacher-1', score: 80, comment: '  Flüssig gesprochen. ' };

  it('trims the comment and allows leaving it empty', () => {
    expect(SpeakingAssessment.create(input).comment).toBe('Flüssig gesprochen.');
    expect(SpeakingAssessment.create({ ...input, comment: '   ' }).comment).toBe('');
  });

  it.each([-1, 101, 70.5])('rejects score %s', (score) => {
    expect(() => SpeakingAssessment.create({ ...input, score })).toThrow(InvalidSpeakingScoreError);
  });

  it('rejects an overly long comment', () => {
    expect(() =>
      SpeakingAssessment.create({ ...input, comment: 'a'.repeat(MAX_ASSESSMENT_COMMENT_LENGTH + 1) }),
    ).toThrow(AssessmentCommentTooLongError);
  });
});

describe('topics', () => {
  it('is pending until practised at least once', () => {
    expect(topicStatus(0)).toBe('pending');
    expect(topicStatus(2)).toBe('practiced');
  });

  it('recognises the two exam parts', () => {
    expect(isSpeakingTaskType('presentation')).toBe(true);
    expect(isSpeakingTaskType('forum_post')).toBe(false);
  });
});
