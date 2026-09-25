import type { SubmissionRepository } from '../ports/submission-repository';
import type { SubmissionSummary } from '../read-models';

export class ListMySubmissions {
  constructor(private readonly submissions: SubmissionRepository) {}

  execute(studentId: string): Promise<SubmissionSummary[]> {
    return this.submissions.listSummariesByStudent(studentId);
  }
}
