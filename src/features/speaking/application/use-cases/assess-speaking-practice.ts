import {
  AssessmentNotFoundError,
  PracticeAlreadyAssessedError,
  SpeakingPracticeNotFoundError,
} from '../../domain/errors';
import {
  SpeakingAssessment,
  validateAssessmentContent,
  type AssessmentContent,
  type SpeakingAssessmentProps,
} from '../../domain/speaking-assessment';
import type { SpeakingAssessmentRepository } from '../ports/speaking-assessment-repository';
import type { PracticeForAssessment } from '../read-models';

export class GetPracticeForAssessment {
  constructor(private readonly assessments: SpeakingAssessmentRepository) {}

  /** @throws {SpeakingPracticeNotFoundError} when missing or not visible to the current user */
  async execute(practiceId: string): Promise<PracticeForAssessment> {
    const practice = await this.assessments.findPractice(practiceId);
    if (!practice) throw new SpeakingPracticeNotFoundError(practiceId);
    return practice;
  }
}

/**
 * Gives a practice its score. Each practice gets at most one assessment.
 *
 * @throws {InvalidSpeakingScoreError} when the score is outside 0–100
 * @throws {SpeakingPracticeNotFoundError} when the practice does not exist
 * @throws {PracticeAlreadyAssessedError} when the practice was already assessed
 */
export class AssessSpeakingPractice {
  constructor(private readonly assessments: SpeakingAssessmentRepository) {}

  async execute(input: SpeakingAssessmentProps): Promise<SpeakingAssessment> {
    const assessment = SpeakingAssessment.create(input);
    const practice = await this.assessments.findPractice(input.practiceId);
    if (!practice) throw new SpeakingPracticeNotFoundError(input.practiceId);
    if (practice.assessment) throw new PracticeAlreadyAssessedError(input.practiceId);
    await this.assessments.save(assessment);
    return assessment;
  }
}

export interface UpdateSpeakingAssessmentInput extends AssessmentContent {
  readonly practiceId: string;
}

/**
 * Revises the score and comment of an assessment; the new version replaces the old one.
 *
 * @throws {InvalidSpeakingScoreError} when the score is outside 0–100
 * @throws {AssessmentNotFoundError} when the practice has no assessment yet
 */
export class UpdateSpeakingAssessment {
  constructor(private readonly assessments: SpeakingAssessmentRepository) {}

  async execute({ practiceId, ...input }: UpdateSpeakingAssessmentInput): Promise<void> {
    const content = validateAssessmentContent(input);
    const practice = await this.assessments.findPractice(practiceId);
    if (!practice?.assessment) throw new AssessmentNotFoundError(practiceId);
    await this.assessments.update(practiceId, content);
  }
}
