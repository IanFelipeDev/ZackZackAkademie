import { useState } from 'react';
import { formatClock } from '@/shared/ui';
import { speakingShare } from '../../domain/speaking-timer';
import type { TimerState } from './speaking-timer-dialog';

interface SpeakingChecklistProps {
  readonly title: string;
  readonly items: readonly string[];
  /** Language of the items, for screen readers. */
  readonly lang?: string;
}

/** Points the student ticks off while speaking; nothing is saved. */
export function SpeakingChecklist({ title, items, lang }: SpeakingChecklistProps) {
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());

  function toggle(item: string) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }

  return (
    <fieldset className="flex flex-col gap-1 rounded-xl bg-surface-low p-4">
      <legend className="rubric float-left mb-1 text-ink-soft">
        {title} · {checked.size}/{items.length}
      </legend>
      {items.map((item) => (
        <label key={item} className="flex min-h-11 cursor-pointer items-center gap-3 text-ink">
          <input
            type="checkbox"
            checked={checked.has(item)}
            onChange={() => toggle(item)}
            className="h-5 w-5 shrink-0 accent-primary-container"
          />
          <span lang={lang} className={checked.has(item) ? 'text-ink-soft line-through' : undefined}>
            {item}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

type Speaker = 'own' | 'partner';

const SPEAKERS: readonly { readonly id: Speaker; readonly label: string }[] = [
  { id: 'own', label: 'Eu' },
  { id: 'partner', label: 'Parceiro(a)' },
];

/** From this point of the timer on, `speaker` is talking. */
interface SpeakerTurn {
  readonly at: number;
  readonly speaker: Speaker;
}

function talkTime(turns: readonly SpeakerTurn[], elapsedSeconds: number): Record<Speaker, number> {
  const time: Record<Speaker, number> = { own: 0, partner: 0 };
  turns.forEach((turn, index) => {
    const end = Math.min(turns[index + 1]?.at ?? elapsedSeconds, elapsedSeconds);
    time[turn.speaker] += Math.max(0, end - turn.at);
  });
  return time;
}

/**
 * telc Teil 2: the student marks who is talking and sees how the time is split, since both partners should
 * speak about equally. Only timer time counts, so pauses add nothing; the timer remounts this on reset.
 */
export function SpeakingShareTracker({ seconds }: TimerState) {
  const [turns, setTurns] = useState<readonly SpeakerTurn[]>([{ at: 0, speaker: 'own' }]);
  const speaker = turns[turns.length - 1]?.speaker ?? 'own';
  const time = talkTime(turns, seconds);

  function select(next: Speaker) {
    if (next !== speaker) setTurns((current) => [...current, { at: seconds, speaker: next }]);
  }

  const share = speakingShare(time.own, time.partner);
  const percent: Record<Speaker, number> = { own: share.ownPercent, partner: share.partnerPercent };

  return (
    <section
      aria-labelledby="speaking-share-title"
      className="flex flex-col gap-3 rounded-xl bg-surface-low p-4"
    >
      <h3 id="speaking-share-title" className="rubric text-ink-soft">
        Quem está falando?
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {SPEAKERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={speaker === id}
            onClick={() => select(id)}
            className={`flex min-h-11 flex-col items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              speaker === id
                ? 'bg-primary-container text-white'
                : 'bg-surface-lowest text-ink hover:text-primary'
            }`}
          >
            {label}
            <span className="font-mono text-xs font-normal tabular-nums opacity-90">
              {formatClock(time[id])}
            </span>
          </button>
        ))}
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-highest" aria-hidden>
        <span className="h-full bg-primary-container" style={{ width: `${percent.own}%` }} />
        <span className="h-full bg-tertiary" style={{ width: `${percent.partner}%` }} />
      </div>
      <p className={`text-sm ${share.isBalanced ? 'text-success' : 'text-error'}`}>
        Você {percent.own}% · parceiro(a) {percent.partner}% —{' '}
        {share.isBalanced ? 'fala equilibrada.' : 'tente equilibrar o tempo de fala.'}
      </p>
    </section>
  );
}
