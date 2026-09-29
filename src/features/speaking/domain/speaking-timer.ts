import type { SpeakingTaskType } from './task-type';

export const SPEAKING_STAGES = ['introduction', 'development', 'conclusion'] as const;

export type SpeakingStage = (typeof SPEAKING_STAGES)[number];

export interface StagePlan {
  readonly stage: SpeakingStage;
  readonly seconds: number;
}

/**
 * Suggested timing per exam part: Teil 1 is a presentation of about 4 minutes, Teil 2 a discussion of about
 * 5 minutes. The split into introduction, development and conclusion is a practice aid, not an exam rule.
 */
export const SPEAKING_STAGE_PLANS: Record<SpeakingTaskType, readonly StagePlan[]> = {
  presentation: [
    { stage: 'introduction', seconds: 45 },
    { stage: 'development', seconds: 150 },
    { stage: 'conclusion', seconds: 45 },
  ],
  discussion: [
    { stage: 'introduction', seconds: 60 },
    { stage: 'development', seconds: 180 },
    { stage: 'conclusion', seconds: 60 },
  ],
};

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
