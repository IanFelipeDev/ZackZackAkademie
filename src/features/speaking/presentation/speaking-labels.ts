import type { SpeakingStage } from '../domain/speaking-timer';
import type { TopicStatus } from '../domain/speaking-topic';
import type { SpeakingTaskType } from '../domain/task-type';

interface TaskTypeLabel {
  readonly part: string;
  readonly name: string;
  readonly icon: string;
  /** Short value used in the URL (?teil=1). */
  readonly slug: string;
}

export const SPEAKING_TASK_LABELS: Record<SpeakingTaskType, TaskTypeLabel> = {
  presentation: { part: 'Teil 1', name: 'Vortrag', icon: 'co_present', slug: '1' },
  discussion: { part: 'Teil 2', name: 'Diskussion', icon: 'forum', slug: '2' },
};

export function speakingTaskTypeFromSlug(slug: string | null): SpeakingTaskType {
  return slug === SPEAKING_TASK_LABELS.discussion.slug ? 'discussion' : 'presentation';
}

interface StageLabel {
  readonly name: string;
  readonly hint: string;
  /** Tailwind background class from the design tokens. */
  readonly color: string;
  readonly text: string;
}

export const STAGE_LABELS: Record<SpeakingStage, StageLabel> = {
  introduction: {
    name: 'Introdução',
    hint: 'Apresente o tema e a estrutura da sua fala.',
    color: 'bg-tertiary',
    text: 'text-tertiary',
  },
  development: {
    name: 'Desenvolvimento',
    hint: 'Desenvolva os pontos com exemplos, vantagens e desvantagens.',
    color: 'bg-primary-container',
    text: 'text-primary-container',
  },
  conclusion: {
    name: 'Conclusão',
    hint: 'Resuma, dê sua opinião e encerre.',
    color: 'bg-success',
    text: 'text-success',
  },
};

/** "4 minutos", "2 minutos e 30 segundos". */
export function durationLabel(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const minutesText = `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  return seconds === 0 ? minutesText : `${minutesText} e ${seconds} segundos`;
}

export const TOPIC_STATUS_LABELS: Record<TopicStatus, string> = {
  pending: 'Pendente',
  practiced: 'Já praticado',
};
