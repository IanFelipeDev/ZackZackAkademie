import type { ReactNode } from 'react';
import { Card, Icon } from '@/shared/ui';
import type { WritingExercise } from '../../domain/writing-exercise';

interface ExerciseBriefProps {
  readonly exercises: readonly WritingExercise[];
  readonly exercise: WritingExercise;
  readonly onSelect: (exerciseId: string) => void;
  readonly onRandom: () => void;
  readonly checkedPoints: ReadonlySet<number>;
  readonly onTogglePoint: (index: number) => void;
  /** Redemittel panel, rendered at the bottom of the card. */
  readonly children?: ReactNode;
}

/** Left pane: topic picker, Aufgabenstellung and the Leitpunkte checklist. */
export function ExerciseBrief({
  exercises,
  exercise,
  onSelect,
  onRandom,
  checkedPoints,
  onTogglePoint,
  children,
}: ExerciseBriefProps) {
  const total = exercise.guidingPoints.length;
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="exercise-select" className="rubric flex items-center gap-1 text-ink-soft">
            <Icon name="topic" className="text-[15px] text-secondary" />
            Thema do simulado
          </label>
          <button
            type="button"
            onClick={onRandom}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-low px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-surface-container"
          >
            <Icon name="shuffle" className="text-[15px]" />
            Zufälliges Thema
          </button>
        </div>
        <div className="relative">
          <select
            id="exercise-select"
            value={exercise.id}
            onChange={(event) => onSelect(event.target.value)}
            className="w-full cursor-pointer appearance-none rounded-lg bg-surface-low py-2.5 pr-10 pl-4 text-sm text-ink outline-none focus:bg-surface-container"
          >
            {exercises.map((item) => (
              <option key={item.id} value={item.id}>
                {item.position}. {item.title}
              </option>
            ))}
          </select>
          <Icon name="expand_more" className="pointer-events-none absolute top-2.5 right-3 text-ink-soft" />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-surface-low/75 p-4">
        <Icon name="article" className="mt-0.5 text-[22px] text-primary" />
        <div className="flex flex-col gap-1">
          <p className="font-serif text-lg leading-snug text-primary italic">„{exercise.prompt}"</p>
          {exercise.recipient ? (
            <p className="text-xs text-ink-soft">
              Destinatário: <strong className="text-ink">{exercise.recipient}</strong>
            </p>
          ) : null}
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 flex w-full items-center justify-between gap-2">
          <span className="rubric flex items-center gap-1.5 text-primary">
            <Icon name="checklist" className="text-[16px]" />
            Leitpunkte (obrigatórios)
          </span>
          <span className="rounded-full bg-surface-high px-2 py-0.5 text-xs font-semibold text-secondary">
            {checkedPoints.size} / {total} cumpridos
          </span>
        </legend>
        {exercise.guidingPoints.map((point, index) => (
          <label
            key={`${index}-${point}`}
            className="group flex cursor-pointer items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-surface-low"
          >
            <input
              type="checkbox"
              checked={checkedPoints.has(index)}
              onChange={() => onTogglePoint(index)}
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-primary-container"
            />
            <span
              className={`text-sm leading-relaxed transition-colors group-hover:text-primary ${
                checkedPoints.has(index) ? 'text-ink-soft line-through' : 'text-ink'
              }`}
            >
              {index + 1}. {point}
            </span>
          </label>
        ))}
      </fieldset>

      {children}
    </Card>
  );
}
