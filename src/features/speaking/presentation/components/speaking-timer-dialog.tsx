import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Button,
  formatClock,
  Icon,
  useAudioRecorder,
  useStopwatch,
  type AudioRecorder,
  type RecordedAudio,
} from '@/shared/ui';
import { MAX_PRACTICE_RECORDING_MS } from '../../domain/speaking-recording';
import { planDuration, stageAt, type StagePlan, type StageProgress } from '../../domain/speaking-timer';
import { STAGE_LABELS } from '../speaking-labels';

export interface TimerState {
  readonly seconds: number;
  readonly isRunning: boolean;
}

interface SpeakingTimerDialogProps {
  /** Exam part above the title, e.g. "telc · Teil 1 · Über Erfahrungen sprechen". */
  readonly eyebrow: string;
  readonly topicTitle: string;
  readonly plan: readonly StagePlan[];
  /** Minimum speaking time from the start, signalled until reached (telc Teil 1). */
  readonly minimumSeconds?: number;
  /** Practice aids shown below the timer, such as a checklist. */
  readonly tools?: (state: TimerState) => ReactNode;
  readonly finishLabel?: string;
  /** Lets the student finish before the timer has run, e.g. to skip the preparation. */
  readonly canSkip?: boolean;
  /** Offers to record the student's voice for the teacher (the practice itself, not the preparation). */
  readonly allowRecording?: boolean;
  readonly isSaving?: boolean;
  readonly errorMessage?: string | null;
  /** Called with the elapsed time, and the recording if the student chose to record, when they finish. */
  readonly onFinish: (durationSeconds: number, recording: RecordedAudio | null) => void;
  readonly onClose: () => void;
}

/**
 * Pop-up exam timer: counts up through the stages of a plan and signals the current stage by colour, a segmented
 * bar and a countdown. Closing it without finishing records nothing.
 */
export function SpeakingTimerDialog({
  eyebrow,
  topicTitle,
  plan,
  minimumSeconds,
  tools,
  finishLabel = 'Concluir prática',
  canSkip = false,
  allowRecording = false,
  isSaving = false,
  errorMessage = null,
  onFinish,
  onClose,
}: SpeakingTimerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stopwatch = useStopwatch();
  // 32 kbit/s keeps a 5-minute practice around 1.2 MB, plenty for speech.
  const recorder = useAudioRecorder({ maxMs: MAX_PRACTICE_RECORDING_MS, audioBitsPerSecond: 32_000 });
  const canRecord = allowRecording && recorder.isSupported;
  const [wantsRecording, setWantsRecording] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const isBusy = isSaving || isFinishing;
  // Bumped on every reset so the practice tools start over too.
  const [round, setRound] = useState(0);
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

  // The recording follows the timer: it starts with it, pauses with it and starts over with it.
  function toggle() {
    if (stopwatch.isRunning) {
      stopwatch.pause();
      recorder.pause();
      return;
    }
    stopwatch.start();
    if (!canRecord || !wantsRecording) return;
    if (recorder.status === 'paused') recorder.resume();
    else if (recorder.status === 'idle') void recorder.start();
  }

  function restart() {
    stopwatch.reset();
    recorder.discard();
    setRound((current) => current + 1);
  }

  async function finish() {
    stopwatch.pause();
    let recording: RecordedAudio | null = null;
    if (canRecord && wantsRecording) {
      setIsFinishing(true);
      // A recording that hit its time limit has already stopped; keep that one.
      recording = (await recorder.stop()) ?? recorder.recording;
      setIsFinishing(false);
    }
    onFinish(stopwatch.seconds, recording);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="speaking-timer-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!isBusy) onClose();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-surface p-0 text-ink backdrop:bg-ink/60 sm:m-auto sm:h-fit sm:max-h-[92dvh] sm:max-w-xl sm:rounded-2xl sm:shadow-lift"
    >
      <div className="flex h-full flex-col gap-5 overflow-y-auto p-5 sm:h-auto sm:p-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="rubric text-ink-soft">{eyebrow}</p>
            <h2 id="speaking-timer-title" lang="de" className="text-2xl text-primary">
              {topicTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
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

        {minimumSeconds !== undefined && hasStarted ? (
          <MinimumTime minimumSeconds={minimumSeconds} elapsedSeconds={stopwatch.seconds} />
        ) : null}

        <Fragment key={round}>
          {tools?.({ seconds: stopwatch.seconds, isRunning: stopwatch.isRunning })}
        </Fragment>

        {canRecord ? (
          <RecordingControl
            recorder={recorder}
            wantsRecording={wantsRecording}
            onChange={setWantsRecording}
            isLocked={hasStarted}
          />
        ) : null}

        {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

        <div className="mt-auto flex flex-wrap items-center justify-center gap-2">
          <Button
            variant={hasStarted ? 'secondary' : 'primary'}
            size="lg"
            icon={stopwatch.isRunning ? 'pause' : 'play_arrow'}
            onClick={toggle}
            disabled={isBusy}
          >
            {stopwatch.isRunning ? 'Pausar' : hasStarted ? 'Retomar' : 'Começar'}
          </Button>
          {hasStarted ? (
            <Button variant="ghost" icon="replay" onClick={restart} disabled={isBusy}>
              Reiniciar
            </Button>
          ) : null}
          {hasStarted || canSkip ? (
            <Button
              size="lg"
              icon="check"
              onClick={() => void finish()}
              isLoading={isBusy}
              disabled={!canSkip && stopwatch.seconds === 0}
            >
              {finishLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}

interface RecordingControlProps {
  readonly recorder: AudioRecorder;
  readonly wantsRecording: boolean;
  readonly onChange: (wantsRecording: boolean) => void;
  /** The choice is made before starting; afterwards only the recording state is shown. */
  readonly isLocked: boolean;
}

function RecordingControl({ recorder, wantsRecording, onChange, isLocked }: RecordingControlProps) {
  if (recorder.status === 'denied' || recorder.status === 'failed') {
    return (
      <Alert tone="error">
        {recorder.status === 'denied'
          ? 'O microfone está bloqueado no navegador, então esta prática segue sem gravação.'
          : 'Não foi possível usar o microfone, então esta prática segue sem gravação.'}
      </Alert>
    );
  }
  if (isLocked && wantsRecording) {
    const isPaused = recorder.status === 'paused';
    return (
      <p
        role="status"
        className={`flex items-center justify-center gap-1.5 text-sm font-semibold ${
          isPaused ? 'text-ink-soft' : 'text-error'
        }`}
      >
        <Icon name={isPaused ? 'pause_circle' : 'radio_button_checked'} className="text-[18px]" />
        {isPaused
          ? 'Gravação pausada'
          : recorder.status === 'recorded'
            ? 'Gravação concluída'
            : 'Gravando sua fala'}
      </p>
    );
  }
  if (isLocked) return null;
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-hairline bg-surface-low p-3 text-sm">
      <input
        type="checkbox"
        checked={wantsRecording}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-5 w-5 accent-primary-container"
      />
      <span>
        <span className="flex items-center gap-1 font-semibold text-primary">
          <Icon name="mic" className="text-[18px]" />
          Gravar minha fala
        </span>
        <span className="text-ink-soft">
          A gravação acompanha o cronômetro e é enviada ao concluir, para a Melissa ouvir antes de dar a nota.
        </span>
      </span>
    </label>
  );
}

function MinimumTime({ minimumSeconds, elapsedSeconds }: { minimumSeconds: number; elapsedSeconds: number }) {
  const isReached = elapsedSeconds >= minimumSeconds;
  return (
    <p
      className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
        isReached ? 'bg-success-container text-success' : 'bg-surface-high text-ink-soft'
      }`}
    >
      <Icon name={isReached ? 'check_circle' : 'hourglass_top'} className="text-[18px]" />
      {isReached
        ? `Tempo mínimo de fala (${formatClock(minimumSeconds)}) atingido`
        : `Tempo mínimo de fala: faltam ${formatClock(minimumSeconds - elapsedSeconds)}`}
    </p>
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
