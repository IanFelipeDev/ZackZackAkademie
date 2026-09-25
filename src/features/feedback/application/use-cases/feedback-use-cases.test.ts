import { beforeEach, describe, expect, it } from 'vitest';
import {
  EmptyFeedbackError,
  FeedbackTooLongError,
  InvalidScoreError,
  ReviewSubmissionNotFoundError,
  SubmissionAlreadyReviewedError,
} from '../../domain/errors';
import { Feedback, MAX_COMMENT_LENGTH } from '../../domain/feedback';
import { buildSubmissionForReview, InMemoryReviewRepository } from '../testing/in-memory-review-repository';
import { GetSubmissionForReview } from './get-submission-for-review';
import { GiveFeedback } from './give-feedback';
import { ListPendingSubmissions } from './list-pending-submissions';

const input = { submissionId: 'submission-1', teacherId: 'teacher-1', comment: ' Sehr gut! ', score: 85 };

describe('Feedback', () => {
  it('trims the comment and accepts a missing score', () => {
    const feedback = Feedback.create({ ...input, score: null });
    expect(feedback.comment).toBe('Sehr gut!');
    expect(feedback.score).toBeNull();
  });

  it('rejects a blank comment', () => {
    expect(() => Feedback.create({ ...input, comment: '  ' })).toThrow(EmptyFeedbackError);
  });

  it('rejects an overly long comment', () => {
    expect(() => Feedback.create({ ...input, comment: 'a'.repeat(MAX_COMMENT_LENGTH + 1) })).toThrow(
      FeedbackTooLongError,
    );
  });

  it.each([-1, 101, 50.5])('rejects score %s', (score) => {
    expect(() => Feedback.create({ ...input, score })).toThrow(InvalidScoreError);
  });
});

describe('review use cases', () => {
  let reviews: InMemoryReviewRepository;

  beforeEach(() => {
    reviews = new InMemoryReviewRepository();
    reviews.submissions.push(
      buildSubmissionForReview({ id: 'submission-2', createdAt: new Date('2026-09-02T10:00:00Z') }),
      buildSubmissionForReview(),
      buildSubmissionForReview({
        id: 'submission-3',
        feedback: { comment: 'ok', score: 60, createdAt: new Date() },
      }),
    );
  });

  it('lists submissions without feedback, oldest first', async () => {
    const pending = await new ListPendingSubmissions(reviews).execute();
    expect(pending.map((p) => p.id)).toEqual(['submission-1', 'submission-2']);
  });

  it('loads a submission for review or fails when it is not visible', async () => {
    const getForReview = new GetSubmissionForReview(reviews);
    await expect(getForReview.execute('submission-1')).resolves.toMatchObject({ studentName: 'Ana' });
    await expect(getForReview.execute('missing')).rejects.toBeInstanceOf(ReviewSubmissionNotFoundError);
  });

  it('records feedback and removes the submission from the queue', async () => {
    await new GiveFeedback(reviews).execute(input);

    expect(reviews.saved).toHaveLength(1);
    const pending = await new ListPendingSubmissions(reviews).execute();
    expect(pending.map((p) => p.id)).toEqual(['submission-2']);
  });

  it('refuses to review the same submission twice', async () => {
    await expect(
      new GiveFeedback(reviews).execute({ ...input, submissionId: 'submission-3' }),
    ).rejects.toBeInstanceOf(SubmissionAlreadyReviewedError);
    expect(reviews.saved).toHaveLength(0);
  });
});
