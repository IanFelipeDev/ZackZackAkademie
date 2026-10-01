import { Card } from '@/shared/ui';
import type { SpeakingExam } from '../../domain/exam';
import type { SpeakingTaskType } from '../../domain/task-type';

/** The teacher's four steps for every Goethe Teil 2 discussion, with a short pt-BR hint each. */
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

/** Official telc B2 instructions, the same for every topic of the part. */
const TELC_INSTRUCTIONS: Partial<Record<SpeakingTaskType, string>> = {
  experience:
    'Sie sollen Ihrer Partnerin bzw. Ihrem Partner über Ihre Erfahrungen zu einem der folgenden Themen berichten. Die Stichpunkte in den Klammern können als Anregung dienen. Sie haben dazu ca. 1 ½ Minuten Zeit. Im Anschluss sollen Sie die Fragen Ihrer Partnerin bzw. Ihres Partners beantworten. Danach spricht Ihre Partnerin bzw. Ihr Partner ebenfalls über ihr bzw. sein Thema. Folgen Sie aufmerksam dem Redebeitrag und überlegen Sie sich Fragen, die Sie ihr/ihm stellen könnten. Unterbrechen Sie sie/ihn nicht. Stellen Sie einige Fragen zum Thema, wenn sie/er ihren/seinen Redebeitrag beendet hat.',
  discussion:
    'Lesen Sie folgenden Text. Diskutieren Sie mit Ihrer Partnerin bzw. Ihrem Partner über den Inhalt des Textes, bringen Sie Ihre Erfahrungen ein und äußern Sie Ihre Meinung. Begründen Sie Ihre Argumente. Sprechen Sie über mögliche Lösungen.',
};

const GUIDING_POINTS_HEADING: Record<SpeakingTaskType, string> = {
  presentation: 'Leitpunkte',
  discussion: 'Gesichtspunkte',
  experience: 'Stichpunkte',
  planning: 'Das müssen Sie gemeinsam entscheiden',
};

interface TaskCardProps {
  readonly exam: SpeakingExam;
  readonly taskType: SpeakingTaskType;
  readonly prompt: string;
  /** Leitpunkte, discussion aspects, Stichpunkte or the points to decide, depending on the part (may be empty). */
  readonly guidingPoints: readonly string[];
  /** telc Teil 2: the text the discussion starts from. */
  readonly sourceText: string | null;
}

export function TaskCard({ exam, taskType, prompt, guidingPoints, sourceText }: TaskCardProps) {
  const instructions = exam === 'telc' ? TELC_INSTRUCTIONS[taskType] : undefined;
  return (
    <Card tone="inset" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl text-primary">Aufgabe</h2>
        {instructions ? (
          <p lang="de" className="text-sm leading-relaxed text-ink">
            {instructions}
          </p>
        ) : null}
        <p lang="de" className="font-serif text-lg text-primary italic">
          „{prompt}“
        </p>
        {exam === 'telc' && taskType === 'experience' ? (
          <p className="text-sm text-ink-soft">Nesta parte você pode levar sua apresentação já preparada.</p>
        ) : null}
      </div>
      {sourceText ? (
        <figure className="flex flex-col gap-1.5">
          <figcaption className="rubric text-ink-soft">Text</figcaption>
          <blockquote
            lang="de"
            className="rounded-lg border-l-4 border-primary-container bg-surface-lowest p-4 font-serif leading-relaxed text-ink"
          >
            {sourceText}
          </blockquote>
        </figure>
      ) : null}
      {guidingPoints.length > 0 ? (
        <div>
          <h3 lang="de" className="rubric mb-1.5 text-ink-soft">
            {GUIDING_POINTS_HEADING[taskType]}
          </h3>
          <ol lang="de" className="list-decimal space-y-1 pl-5 text-sm text-ink">
            {guidingPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ol>
        </div>
      ) : null}
      {exam === 'goethe' && taskType === 'discussion' ? (
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
