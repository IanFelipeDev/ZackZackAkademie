import type { CefrLevel } from '@/shared/domain';
import type { SpeakingTaskType } from './task-type';

/** A Sprechen exam topic. The prompt is the question the student talks about. */
export interface SpeakingTopic {
  readonly id: string;
  readonly level: CefrLevel;
  readonly taskType: SpeakingTaskType;
  readonly position: number;
  readonly title: string;
  readonly prompt: string;
  /** Points the presentation or discussion should cover, like the Leitpunkte in Schreiben. */
  readonly guidingPoints: readonly string[];
}

export type TopicStatus = 'pending' | 'practiced';

/** A topic counts as practised once the student has recorded at least one practice for it. */
export function topicStatus(practiceCount: number): TopicStatus {
  return practiceCount > 0 ? 'practiced' : 'pending';
}
