import { describe, expect, it } from 'vitest';
import type { SpeakingPracticeSummary } from '@/features/speaking';
import type { SubmissionSummary } from '@/features/writing';
import { recentActivity } from './recent-activity';

function submission(id: string, feedback: SubmissionSummary['feedback']): SubmissionSummary {
  return {
    id,
    exerciseId: 'e1',
    exerciseTitle: `Text ${id}`,
    taskType: 'forum_post',
    attemptNumber: 1,
    content: 'Hallo',
    wordCount: 1,
    durationSeconds: null,
    guidingPointsChecked: null,
    guidingPointsTotal: 4,
    createdAt: new Date('2026-09-01T10:00:00Z'),
    feedback,
  };
}

function practice(id: string, assessment: SpeakingPracticeSummary['assessment']): SpeakingPracticeSummary {
  return {
    id,
    topicId: `topic-${id}`,
    topicTitle: `Thema ${id}`,
    exam: 'goethe',
    taskType: 'presentation',
    durationSeconds: 240,
    createdAt: new Date('2026-09-01T10:00:00Z'),
    recordingPath: null,
    assessment,
  };
}

const at = (day: number) => new Date(Date.UTC(2026, 8, day));

describe('recentActivity', () => {
  it('merges corrections and assessments, newest (including revisions) first, and skips pending ones', () => {
    const items = recentActivity(
      [
        submission('a', { comment: 'ok', score: 60, createdAt: at(2), updatedAt: at(9) }),
        submission('b', null),
        submission('c', { comment: 'gut', score: null, createdAt: at(5), updatedAt: null }),
      ],
      [
        practice('x', { score: 80, comment: '', teacherName: 'Melissa', createdAt: at(7), updatedAt: null }),
        practice('y', null),
      ],
    );

    expect(items.map((i) => [i.skill, i.title, i.score, i.to])).toEqual([
      ['Schreiben', 'Text a', 60, '/meus-textos/a'],
      ['Sprechen', 'Thema x', 80, '/sprechen/topic-x'],
      ['Schreiben', 'Text c', null, '/meus-textos/c'],
    ]);
  });

  it('keeps only the latest entries', () => {
    const many = Array.from({ length: 8 }, (_, day) =>
      submission(String(day), { comment: 'ok', score: day, createdAt: at(day + 1), updatedAt: null }),
    );
    expect(recentActivity(many, [], 3).map((i) => i.score)).toEqual([7, 6, 5]);
  });
});
