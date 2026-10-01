import { describe, expect, it } from 'vitest';
import {
  AssessmentCommentTooLongError,
  InvalidPracticeDurationError,
  InvalidSpeakingScoreError,
} from './errors';
import { MAX_ASSESSMENT_COMMENT_LENGTH, SpeakingAssessment } from './speaking-assessment';
import { MAX_PRACTICE_SECONDS, SpeakingPractice } from './speaking-practice';
import { isSpeakingExam } from './exam';
import { planDuration, speakingShare, stageAt, stagePlanFor, TELC_PREPARATION_PLAN } from './speaking-timer';
import { topicStatus } from './speaking-topic';
import { isSpeakingTaskType } from './task-type';

describe('stageAt', () => {
  const plan = stagePlanFor('goethe', 'presentation');

  it('plans 5 minutes for Goethe Teil 1 and 2:30 for Goethe Teil 2', () => {
    expect(planDuration(plan)).toBe(300);
    expect(planDuration(stagePlanFor('goethe', 'discussion'))).toBe(150);
  });

  it('plans about 5 minutes for each telc part and 20 minutes of preparation', () => {
    expect(planDuration(stagePlanFor('telc', 'experience'))).toBe(300);
    expect(planDuration(stagePlanFor('telc', 'discussion'))).toBe(300);
    expect(planDuration(stagePlanFor('telc', 'planning'))).toBe(300);
    expect(planDuration(TELC_PREPARATION_PLAN)).toBe(1200);
  });

  it('lets each speaker report for 1:30 in telc Teil 1, then take questions', () => {
    const report = stagePlanFor('telc', 'experience');
    expect(stageAt(report, 89)).toMatchObject({ stage: 'report', secondsLeftInStage: 1 });
    expect(stageAt(report, 90)).toMatchObject({ stage: 'partner_questions' });
    expect(stageAt(report, 150)).toMatchObject({ stage: 'partner_report' });
    expect(stageAt(report, 240)).toMatchObject({ stage: 'own_questions' });
  });

  it('has no plan for a part the exam does not have', () => {
    expect(() => stagePlanFor('goethe', 'planning')).toThrow();
    expect(() => stagePlanFor('telc', 'presentation')).toThrow();
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

describe('speakingShare', () => {
  it('splits the talking time and calls 40–60 % balanced', () => {
    expect(speakingShare(0, 0)).toEqual({ ownPercent: 50, partnerPercent: 50, isBalanced: true });
    expect(speakingShare(120, 80)).toEqual({ ownPercent: 60, partnerPercent: 40, isBalanced: true });
    expect(speakingShare(150, 50)).toEqual({ ownPercent: 75, partnerPercent: 25, isBalanced: false });
    expect(speakingShare(10, 90)).toMatchObject({ ownPercent: 10, isBalanced: false });
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

  it('recognises the exam parts and the exams', () => {
    expect(isSpeakingTaskType('presentation')).toBe(true);
    expect(isSpeakingTaskType('planning')).toBe(true);
    expect(isSpeakingTaskType('forum_post')).toBe(false);
    expect(isSpeakingExam('telc')).toBe(true);
    expect(isSpeakingExam('osd')).toBe(false);
  });
});
