import { useEffect, useRef } from 'react';
import { Alert, Button, formatClock, Icon, useStopwatch } from '@/shared/ui';
import {
  planDuration,
  SPEAKING_STAGE_PLANS,
  stageAt,
  type StagePlan,
  type StageProgress,
} from '../../domain/speaking-timer';
import type { SpeakingTaskType } from '../../domain/task-type';
import { SPEAKING_TASK_LABELS, STAGE_LABELS } from '../speaking-labels';

interface SpeakingTimerDialogProps {
  readonly taskType: SpeakingTaskType;
  readonly topicTitle: string;
  readonly isSaving: boolean;
  readonly errorMessage: string | null;
  /** Called with the spoken time when the student finishes the practice. */
  readonly onFinish: (durationSeconds: number) => void;
  readonly onClose: () => void;
}

/**
 * Pop-up exam timer: counts up through the stages of the plan for the exam part and signals the current stage
 * by colour, a segmented bar and a countdown. Closing it without finishing records nothing.
 */
export function SpeakingTimerDialog({
  taskType,
  topicTitle,
  isSaving,
  errorMessage,
  onFinish,
  onClose,
}: SpeakingTimerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stopwatch = useStopwatch();
  const plan = SPEAKING_STAGE_PLANS[taskType];
  const progress = stageAt(plan, stopwatch.seconds);
  const stage = STAGE_LABELS[progress.stage];
  const isOvertime = progress.overtimeSeconds > 0;
  const hasStarted = stopwatch.seconds > 0 || stopwatch.isRunning;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    // jsdom has no showModal; the open attribute keeps the dialog usable there.
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    return () => {
      if (typeof dialog.close === 'function') dialog.close();
    };
  }, []);

  function finish() {
    stopwatch.pause();
    onFinish(stopwatch.seconds);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="speaking-timer-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSaving) onClose();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-surface p-0 text-ink backdrop:bg-ink/60 sm:m-auto sm:h-fit sm:max-h-[92dvh] sm:max-w-xl sm:rounded-2xl sm:shadow-lift"
    >
      <div className="flex h-full flex-col gap-5 overflow-y-auto p-5 sm:h-auto sm:p-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="rubric text-ink-soft">
              {SPEAKING_TASK_LABELS[taskType].part} · {SPEAKING_TASK_LABELS[taskType].name}
            </p>
            <h2 id="speaking-timer-title" lang="de" className="text-2xl text-primary">
              {topicTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Fechar cronômetro"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-high hover:text-primary"
          >
            <Icon name="close" />
          </button>
        </header>

        <StageBar plan={plan} progress={progress} />

        <div
          className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-6 text-center text-white transition-colors ${
            isOvertime ? 'bg-error' : stage.color
          }`}
        >
          <p className="rubric opacity-90">{isOvertime ? 'Tempo excedido' : 'Etapa atual'}</p>
          <p className="font-serif text-3xl">{stage.name}</p>
          <p
            className={`font-mono text-6xl font-bold tabular-nums ${isOvertime ? 'motion-safe:animate-pulse' : ''}`}
          >
            {isOvertime
              ? `+${formatClock(progress.overtimeSeconds)}`
              : formatClock(progress.secondsLeftInStage)}
          </p>
          <p className="text-sm opacity-90">{isOvertime ? 'Conclua sua fala.' : stage.hint}</p>
        </div>
        <p aria-live="polite" className="sr-only">
          {hasStarted ? `Etapa atual: ${stage.name}${isOvertime ? ', tempo excedido' : ''}` : ''}
        </p>

        <p className="text-center text-sm text-ink-soft">
          Tempo total{' '}
          <span className="font-mono font-semibold text-ink tabular-nums">
            {formatClock(stopwatch.seconds)}
          </span>{' '}
          de {formatClock(planDuration(plan))} previstos
        </p>

        {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

        <div className="mt-auto flex flex-wrap items-center justify-center gap-2">
          <Button
            variant={hasStarted ? 'secondary' : 'primary'}
            size="lg"
            icon={stopwatch.isRunning ? 'pause' : 'play_arrow'}
            onClick={stopwatch.toggle}
            disabled={isSaving}
          >
            {stopwatch.isRunning ? 'Pausar' : hasStarted ? 'Retomar' : 'Começar'}
          </Button>
          {hasStarted ? (
            <>
              <Button variant="ghost" icon="replay" onClick={stopwatch.reset} disabled={isSaving}>
                Reiniciar
              </Button>
              <Button
                size="lg"
                icon="check"
                onClick={finish}
                isLoading={isSaving}
                disabled={stopwatch.seconds === 0}
              >
                Concluir prática
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}

function StageBar({ plan, progress }: { plan: readonly StagePlan[]; progress: StageProgress }) {
  const total = planDuration(plan);
  return (
    <ol className="flex gap-1.5" aria-label="Etapas da fala">
      {plan.map((step, index) => {
        const label = STAGE_LABELS[step.stage];
        const isCurrent = index === progress.index;
        const isDone = index < progress.index || (isCurrent && progress.overtimeSeconds > 0);
        const fill = isDone
          ? 100
          : isCurrent
            ? Math.round(((step.seconds - progress.secondsLeftInStage) / step.seconds) * 100)
            : 0;
        return (
          <li
            key={step.stage}
            style={{ flexGrow: step.seconds / total }}
            aria-current={isCurrent ? 'step' : undefined}
            className="flex min-w-0 basis-0 flex-col gap-1"
          >
            <span className="h-2.5 overflow-hidden rounded-full bg-surface-highest">
              <span
                className={`block h-full rounded-full transition-[width] duration-700 ease-linear ${label.color}`}
                style={{ width: `${fill}%` }}
              />
            </span>
            <span
              className={`text-xs leading-tight ${isCurrent ? `font-semibold ${label.text}` : 'text-ink-soft'}`}
            >
              <span className="flex items-center gap-0.5">
                {isDone ? <Icon name="check" className="text-[14px]" /> : null}
                {label.name}
              </span>
              <span className="font-mono">{formatClock(step.seconds)}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
