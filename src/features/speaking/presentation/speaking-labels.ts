import { EXAM_TASK_TYPES, type SpeakingExam } from '../domain/exam';
import type { SpeakingStage } from '../domain/speaking-timer';
import type { TopicStatus } from '../domain/speaking-topic';
import type { SpeakingTaskType } from '../domain/task-type';

interface ExamLabel {
  readonly name: string;
  readonly eyebrow: string;
  readonly description: string;
}

export const EXAM_LABELS: Record<SpeakingExam, ExamLabel> = {
  goethe: {
    name: 'Goethe',
    eyebrow: 'Goethe-Zertifikat B2 · Modul Sprechen',
    description:
      'Escolha um tema, abra o cronômetro e pratique sua fala por etapas: introdução, desenvolvimento e conclusão. Depois a Melissa lança a sua nota.',
  },
  telc: {
    name: 'telc',
    eyebrow: 'telc Deutsch B2 · Mündlicher Ausdruck',
    description:
      'Treine as três partes da prova oral do telc com o comando oficial, a preparação de 20 minutos e um cronômetro para cada etapa. Depois a Melissa lança a sua nota.',
  },
};

interface TaskTypeLabel {
  readonly part: string;
  readonly name: string;
  /** Fits the part tabs. */
  readonly shortName: string;
  readonly icon: string;
  /** Short value used in the URL (?teil=1). */
  readonly slug: string;
}

export const SPEAKING_TASK_LABELS: Record<SpeakingTaskType, TaskTypeLabel> = {
  presentation: { part: 'Teil 1', name: 'Vortrag', shortName: 'Vortrag', icon: 'co_present', slug: '1' },
  experience: {
    part: 'Teil 1',
    name: 'Über Erfahrungen sprechen',
    shortName: 'Erfahrungen',
    icon: 'auto_stories',
    slug: '1',
  },
  discussion: { part: 'Teil 2', name: 'Diskussion', shortName: 'Diskussion', icon: 'forum', slug: '2' },
  planning: {
    part: 'Teil 3',
    name: 'Gemeinsam etwas planen',
    shortName: 'Planen',
    icon: 'event_note',
    slug: '3',
  },
};

const EXAM_PARAM = 'prova';
const PART_PARAM = 'teil';

export interface SpeakingPart {
  readonly exam: SpeakingExam;
  readonly taskType: SpeakingTaskType;
}

/** The exam part named by the catalogue URL (?prova=telc&teil=3); Goethe and the first part by default. */
export function speakingPartFromParams(params: URLSearchParams): SpeakingPart {
  const exam: SpeakingExam = params.get(EXAM_PARAM) === 'telc' ? 'telc' : 'goethe';
  const parts = EXAM_TASK_TYPES[exam];
  const slug = params.get(PART_PARAM);
  const taskType =
    parts.find((part) => SPEAKING_TASK_LABELS[part].slug === slug) ?? parts[0] ?? 'presentation';
  return { exam, taskType };
}

/** Catalogue URL parameters of one exam part; Goethe, the default, carries no exam parameter. */
export function speakingPartParams({ exam, taskType }: SpeakingPart): URLSearchParams {
  const params = new URLSearchParams();
  if (exam === 'telc') params.set(EXAM_PARAM, exam);
  params.set(PART_PARAM, SPEAKING_TASK_LABELS[taskType].slug);
  return params;
}

export function speakingCatalogPath(part: SpeakingPart): string {
  return `/sprechen?${speakingPartParams(part).toString()}`;
}

/** "telc · Teil 3 · Gemeinsam etwas planen". */
export function partLabel(exam: SpeakingExam, taskType: SpeakingTaskType): string {
  const label = SPEAKING_TASK_LABELS[taskType];
  return `${EXAM_LABELS[exam].name} · ${label.part} · ${label.name}`;
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
    hint: 'Desenvolva os pontos com argumentos, exemplos e experiências.',
    color: 'bg-primary-container',
    text: 'text-primary-container',
  },
  conclusion: {
    name: 'Conclusão',
    hint: 'Resuma, chegue a um resultado e encerre.',
    color: 'bg-success',
    text: 'text-success',
  },
  report: {
    name: 'Seu relato',
    hint: 'Conte sua experiência por pelo menos 1:30, sem ser interrompido.',
    color: 'bg-tertiary',
    text: 'text-tertiary',
  },
  partner_questions: {
    name: 'Perguntas do parceiro',
    hint: 'Responda às 1–2 perguntas (Nachfragen) do parceiro.',
    color: 'bg-primary-container',
    text: 'text-primary-container',
  },
  partner_report: {
    name: 'Relato do parceiro',
    hint: 'Ouça sem interromper e pense em perguntas para fazer depois.',
    color: 'bg-secondary',
    text: 'text-secondary',
  },
  own_questions: {
    name: 'Suas perguntas',
    hint: 'Faça 1–2 perguntas sobre o relato do parceiro.',
    color: 'bg-success',
    text: 'text-success',
  },
  preparation: {
    name: 'Preparação',
    hint: 'Leia as tarefas e anote só palavras-chave, não frases inteiras.',
    color: 'bg-primary-container',
    text: 'text-primary-container',
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
