import type { SpeakingExam } from './exam';
import type { SpeakingTaskType } from './task-type';

export const SPEAKING_STAGES = [
  'introduction',
  'development',
  'conclusion',
  // telc Teil 1: the student reports, answers the partner's questions, then the roles swap.
  'report',
  'partner_questions',
  'partner_report',
  'own_questions',
  // telc: preparation time before the exam.
  'preparation',
] as const;

export type SpeakingStage = (typeof SPEAKING_STAGES)[number];

export interface StagePlan {
  readonly stage: SpeakingStage;
  readonly seconds: number;
}

/** Teil 1, 2 and 3 of telc B2 take about 5 minutes each. */
const THREE_STAGES_OF_FIVE_MINUTES: readonly StagePlan[] = [
  { stage: 'introduction', seconds: 60 },
  { stage: 'development', seconds: 180 },
  { stage: 'conclusion', seconds: 60 },
];

/**
 * Timing per exam part. Goethe, as set by the teacher: Teil 1 is a presentation of 5 minutes, Teil 2 a
 * discussion of 2:30 minutes. telc: every part takes about 5 minutes; in Teil 1 each speaker reports for about
 * 1:30 and then answers the partner's questions. The stage split is a practice aid, not an exam rule.
 */
const STAGE_PLANS: Record<SpeakingExam, Partial<Record<SpeakingTaskType, readonly StagePlan[]>>> = {
  goethe: {
    presentation: THREE_STAGES_OF_FIVE_MINUTES,
    discussion: [
      { stage: 'introduction', seconds: 30 },
      { stage: 'development', seconds: 90 },
      { stage: 'conclusion', seconds: 30 },
    ],
  },
  telc: {
    experience: [
      { stage: 'report', seconds: 90 },
      { stage: 'partner_questions', seconds: 60 },
      { stage: 'partner_report', seconds: 90 },
      { stage: 'own_questions', seconds: 60 },
    ],
    discussion: THREE_STAGES_OF_FIVE_MINUTES,
    planning: THREE_STAGES_OF_FIVE_MINUTES,
  },
};

/** telc: the 20 minutes of preparation before the exam, as a single stage. */
export const TELC_PREPARATION_PLAN: readonly StagePlan[] = [{ stage: 'preparation', seconds: 20 * 60 }];

/** telc Teil 1: a report shorter than this loses points. */
export const TELC_MINIMUM_REPORT_SECONDS = 90;

/** @throws {Error} when the exam has no such part (the database refuses such topics) */
export function stagePlanFor(exam: SpeakingExam, taskType: SpeakingTaskType): readonly StagePlan[] {
  const plan = STAGE_PLANS[exam][taskType];
  if (!plan) throw new Error(`${exam} has no Sprechen part ${taskType}`);
  return plan;
}

export function planDuration(plan: readonly StagePlan[]): number {
  return plan.reduce((sum, step) => sum + step.seconds, 0);
}

export interface StageProgress {
  readonly stage: SpeakingStage;
  /** Position of the stage in the plan, 0-based. */
  readonly index: number;
  readonly secondsLeftInStage: number;
  /** Seconds spoken beyond the whole plan; 0 while still within it. */
  readonly overtimeSeconds: number;
}

/** Where a speaker is in the plan after `elapsedSeconds`. Past the end, the last stage runs into overtime. */
export function stageAt(plan: readonly StagePlan[], elapsedSeconds: number): StageProgress {
  let stageEnd = 0;
  for (const [index, step] of plan.entries()) {
    stageEnd += step.seconds;
    if (elapsedSeconds < stageEnd) {
      return { stage: step.stage, index, secondsLeftInStage: stageEnd - elapsedSeconds, overtimeSeconds: 0 };
    }
  }
  const lastIndex = plan.length - 1;
  const last = plan[lastIndex];
  if (!last) throw new Error('A stage plan needs at least one stage');
  return {
    stage: last.stage,
    index: lastIndex,
    secondsLeftInStage: 0,
    overtimeSeconds: elapsedSeconds - stageEnd,
  };
}

export interface SpeakingShare {
  /** Share of the talking time used by the student, 0–100; 50 while nobody has spoken. */
  readonly ownPercent: number;
  readonly partnerPercent: number;
  /** Both speakers within 40–60 % of the time, which the telc discussion expects. */
  readonly isBalanced: boolean;
}

const BALANCED_MIN_PERCENT = 40;

/** How the talking time of a two-person discussion is split between the student and the partner. */
export function speakingShare(ownSeconds: number, partnerSeconds: number): SpeakingShare {
  const total = ownSeconds + partnerSeconds;
  const ownPercent = total === 0 ? 50 : Math.round((ownSeconds / total) * 100);
  const partnerPercent = 100 - ownPercent;
  return {
    ownPercent,
    partnerPercent,
    isBalanced: Math.min(ownPercent, partnerPercent) >= BALANCED_MIN_PERCENT,
  };
}
