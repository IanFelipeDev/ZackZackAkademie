import { Card } from '@/shared/ui';
import type { SpeakingTaskType } from '../../domain/task-type';

/** The teacher's four steps for every Teil 2 discussion, with a short pt-BR hint each. */
const DISCUSSION_STEPS: readonly { readonly step: string; readonly hint: string }[] = [
  {
    step: 'Wählen Sie eine Möglichkeit aus und begründen Sie Ihre Wahl.',
    hint: 'Escolha uma proposta e justifique a escolha.',
  },
  { step: 'Beziehen Sie Stellung.', hint: 'Posicione-se claramente sobre o tema.' },
  {
    step: 'Gehen Sie auf Ihren Partner ein.',
    hint: 'Reaja às ideias do parceiro: concorde, discorde ou peça esclarecimento.',
  },
  {
    step: 'Treffen Sie eine Entscheidung oder finden Sie einen Kompromiss.',
    hint: 'Cheguem juntos a uma conclusão no final.',
  },
];

interface TaskCardProps {
  readonly taskType: SpeakingTaskType;
  readonly prompt: string;
  /** Leitpunkte for a presentation; discussion aspects for Teil 2 (may be empty). */
  readonly guidingPoints: readonly string[];
}

export function TaskCard({ taskType, prompt, guidingPoints }: TaskCardProps) {
  const isDiscussion = taskType === 'discussion';
  return (
    <Card tone="inset" className="flex flex-col gap-4">
      <div>
        <h2 className="mb-2 text-xl text-primary">Aufgabe</h2>
        <p lang="de" className="font-serif text-lg text-primary italic">
          „{prompt}“
        </p>
      </div>
      {guidingPoints.length > 0 ? (
        <div>
          <h3 className="rubric mb-1.5 text-ink-soft">{isDiscussion ? 'Gesichtspunkte' : 'Leitpunkte'}</h3>
          <ol lang="de" className="list-decimal space-y-1 pl-5 text-sm text-ink">
            {guidingPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ol>
        </div>
      ) : null}
      {isDiscussion ? (
        <div>
          <h3 className="rubric mb-1.5 text-ink-soft">Como conduzir a discussão</h3>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink">
            {DISCUSSION_STEPS.map(({ step, hint }) => (
              <li key={step}>
                <span lang="de">{step}</span> <span className="text-ink-soft">{hint}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </Card>
  );
}
