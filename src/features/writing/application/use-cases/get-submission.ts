import { SubmissionNotFoundError } from '../../domain/errors';
import type { SubmissionRepository } from '../ports/submission-repository';
import type { SubmissionDetail } from '../read-models';

export class GetSubmission {
  constructor(private readonly submissions: SubmissionRepository) {}

  /** @throws {SubmissionNotFoundError} when missing or not visible to the current user (RLS) */
  async execute(submissionId: string): Promise<SubmissionDetail> {
    const submission = await this.submissions.findDetailById(submissionId);
    if (!submission) throw new SubmissionNotFoundError(submissionId);
    return submission;
  }
}
