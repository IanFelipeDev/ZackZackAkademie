import { SpeakingPractice, type SpeakingPracticeProps } from '../../domain/speaking-practice';
import type { SpeakingPracticeRepository } from '../ports/speaking-practice-repository';

/**
 * Records that a student practised a topic, which marks the topic as practised and puts the practice in the
 * teachers' assessment queue.
 *
 * @throws {InvalidPracticeDurationError} when the duration is out of range
 */
export class RecordSpeakingPractice {
  constructor(private readonly practices: SpeakingPracticeRepository) {}

  async execute(input: SpeakingPracticeProps): Promise<SpeakingPractice> {
    const practice = SpeakingPractice.create(input);
    await this.practices.save(practice);
    return practice;
  }
}
