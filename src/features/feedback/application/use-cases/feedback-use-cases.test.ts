import { beforeEach, describe, expect, it } from 'vitest';
import {
  EmptyFeedbackError,
  FeedbackNotFoundError,
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
import { ListReviewedSubmissions } from './list-reviewed-submissions';
import { UpdateFeedback } from './update-feedback';

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
        feedback: {
          comment: 'ok',
          score: 60,
          teacherName: 'Melissa',
          createdAt: new Date('2026-09-05T10:00:00Z'),
          updatedAt: null,
        },
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

  it('lists reviewed submissions, most recently corrected or revised first', async () => {
    reviews.submissions.push(
      buildSubmissionForReview({
        id: 'submission-4',
        feedback: {
          comment: 'gut',
          score: 70,
          teacherName: 'Melissa',
          createdAt: new Date('2026-09-03T10:00:00Z'),
          updatedAt: new Date('2026-09-10T10:00:00Z'),
        },
      }),
      buildSubmissionForReview({
        id: 'submission-5',
        feedback: {
          comment: 'naja',
          score: null,
          teacherName: 'Melissa',
          createdAt: new Date('2026-09-04T10:00:00Z'),
          updatedAt: null,
        },
      }),
    );
    const reviewed = await new ListReviewedSubmissions(reviews).execute();
    expect(reviewed.map((r) => r.id)).toEqual(['submission-4', 'submission-3', 'submission-5']);
  });

  it('revises existing feedback and records when', async () => {
    await new UpdateFeedback(reviews).execute({
      submissionId: 'submission-3',
      comment: ' Besser! ',
      score: 75,
    });
    const revised = await reviews.findForReview('submission-3');
    expect(revised?.feedback).toMatchObject({ comment: 'Besser!', score: 75, teacherName: 'Melissa' });
    expect(revised?.feedback?.updatedAt).toBeInstanceOf(Date);
    expect(revised?.feedback?.createdAt).toEqual(new Date('2026-09-05T10:00:00Z'));
  });

  it('validates a revision like new feedback', async () => {
    const update = new UpdateFeedback(reviews);
    await expect(
      update.execute({ submissionId: 'submission-3', comment: ' ', score: 75 }),
    ).rejects.toBeInstanceOf(EmptyFeedbackError);
    await expect(
      update.execute({ submissionId: 'submission-3', comment: 'ok', score: 101 }),
    ).rejects.toBeInstanceOf(InvalidScoreError);
  });

  it('refuses to revise feedback that does not exist', async () => {
    const update = new UpdateFeedback(reviews);
    await expect(
      update.execute({ submissionId: 'submission-1', comment: 'ok', score: null }),
    ).rejects.toBeInstanceOf(FeedbackNotFoundError);
    await expect(
      update.execute({ submissionId: 'missing', comment: 'ok', score: null }),
    ).rejects.toBeInstanceOf(FeedbackNotFoundError);
  });
});
