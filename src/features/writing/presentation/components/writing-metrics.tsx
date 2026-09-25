import { formatClock, Icon } from '@/shared/ui';
import {
  evaluateWordCount,
  wordProgressPercent,
  type WordCountStatus,
  type WordRange,
} from '../../domain/word-count';

interface WritingMetricsProps {
  readonly seconds: number;
  readonly isRunning: boolean;
  readonly onToggleTimer: () => void;
  readonly onResetTimer: () => void;
  readonly wordCount: number;
  readonly wordRange: WordRange | null;
}

const WORD_STATUS_TEXT: Record<WordCountStatus, string> = {
  empty: 'palavras digitadas',
  below: 'abaixo da meta',
  within: 'dentro da meta',
  above: 'acima da meta',
};

const WORD_STATUS_COLOR: Record<WordCountStatus, string> = {
  empty: 'text-primary',
  below: 'text-tertiary',
  within: 'text-success',
  above: 'text-tertiary',
};

export function WritingMetrics({
  seconds,
  isRunning,
  onToggleTimer,
  onResetTimer,
  wordCount,
  wordRange,
}: WritingMetricsProps) {
  const status = evaluateWordCount(wordCount, wordRange);
  return (
    <div className="grid grid-cols-1 items-center gap-4 rounded-xl bg-surface-low/40 p-4 sm:grid-cols-2">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Icon name="schedule" className="text-[20px]" />
        </span>
        <div>
          <p className="rubric text-ink-soft">Tempo de prova</p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-3xl font-bold text-primary tabular-nums" aria-live="off">
              {formatClock(seconds)}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={onToggleTimer}
                aria-label={isRunning ? 'Pausar cronômetro' : 'Iniciar cronômetro'}
                className="grid h-7 w-7 place-items-center rounded-full bg-surface-container text-primary hover:bg-surface-high"
              >
                <Icon name={isRunning ? 'pause' : 'play_arrow'} className="text-[16px]" />
              </button>
              <button
                type="button"
                onClick={onResetTimer}
                aria-label="Zerar cronômetro"
                className="grid h-7 w-7 place-items-center rounded-full bg-surface-container text-ink-soft hover:bg-surface-high hover:text-primary"
              >
                <Icon name="replay" className="text-[16px]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary/10 text-secondary">
          <Icon name="format_shapes" className="text-[20px]" />
        </span>
        <div className="w-full">
          <div className="flex items-baseline justify-between">
            <p className="rubric text-ink-soft">Palavras</p>
            {wordRange ? (
              <span className="text-[11px] font-semibold text-primary">
                Meta ideal: {wordRange.min}–{wordRange.max}
              </span>
            ) : null}
          </div>
          <p className="flex items-baseline gap-2">
            <span className={`font-mono text-3xl font-bold tabular-nums ${WORD_STATUS_COLOR[status]}`}>
              {wordCount}
            </span>
            <span className="text-xs text-ink-soft">{WORD_STATUS_TEXT[status]}</span>
          </p>
          <div
            className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-container"
            role="progressbar"
            aria-label="Progresso até a meta de palavras"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={wordProgressPercent(wordCount, wordRange)}
          >
            <div
              className="h-full rounded-full bg-secondary transition-[width] duration-300"
              style={{ width: `${wordProgressPercent(wordCount, wordRange)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
