import type { CefrLevel } from '@/shared/domain';
import type { SpeakingExam } from './exam';
import type { SpeakingTaskType } from './task-type';

/** A Sprechen exam topic. The prompt is the question the student talks about. */
export interface SpeakingTopic {
  readonly id: string;
  readonly exam: SpeakingExam;
  readonly level: CefrLevel;
  readonly taskType: SpeakingTaskType;
  readonly position: number;
  readonly title: string;
  readonly prompt: string;
  /** Points the presentation or discussion should cover, like the Leitpunkte in Schreiben. */
  readonly guidingPoints: readonly string[];
  /** telc Teil 2: the text the discussion starts from; null elsewhere. */
  readonly sourceText: string | null;
  /** telc Teil 1: questions the partner can ask after the report (Nachfragen); empty elsewhere. */
  readonly followUpQuestions: readonly string[];
}

export type TopicStatus = 'pending' | 'practiced';

/** A topic counts as practised once the student has recorded at least one practice for it. */
export function topicStatus(practiceCount: number): TopicStatus {
  return practiceCount > 0 ? 'practiced' : 'pending';
}
