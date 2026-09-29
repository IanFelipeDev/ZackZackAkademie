import { SpeakingTopicNotFoundError } from '../../domain/errors';
import type { SpeakingTopic } from '../../domain/speaking-topic';
import type { SpeakingTopicRepository } from '../ports/speaking-topic-repository';

export class GetSpeakingTopic {
  constructor(private readonly topics: SpeakingTopicRepository) {}

  /** @throws {SpeakingTopicNotFoundError} when missing or not visible to the current user */
  async execute(topicId: string): Promise<SpeakingTopic> {
    const topic = await this.topics.findById(topicId);
    if (!topic) throw new SpeakingTopicNotFoundError(topicId);
    return topic;
  }
}
