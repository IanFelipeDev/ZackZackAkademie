import { Link } from 'react-router';
import { Badge, formatDate, formatMinutes, Icon } from '@/shared/ui';
import type { SubmissionSummary } from '../../application/read-models';
import { excerpt } from '../excerpt';
import { TASK_TYPE_LABELS } from '../task-type-labels';

export function SubmissionCard({ submission }: { submission: SubmissionSummary }) {
  const label = TASK_TYPE_LABELS[submission.taskType];
  const { feedback } = submission;
  const practiceLink = `/treino?teil=${label.slug}&tema=${submission.exerciseId}`;

  return (
    <article className="relative flex flex-col gap-4 overflow-hidden rounded-xl border border-hairline bg-surface-lowest p-5 pl-6 shadow-paper">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-primary-container" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Badge tone="primary">
            {label.part} · {label.name}
          </Badge>
          {feedback ? (
            <Badge tone="success" icon="verified">
              Corrigido{feedback.score !== null ? ` · Nota ${feedback.score}/100` : ''}
            </Badge>
          ) : (
            <Badge tone="warning" icon="hourglass_top">
              Aguardando correção
            </Badge>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-ink-soft">
          <Icon name="calendar_today" className="text-[14px]" />
          {formatDate(submission.createdAt)}
        </span>
      </div>

      <div>
        <h2 className="text-2xl text-primary">{submission.exerciseTitle}</h2>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
          <span>{submission.wordCount} palavras</span>
          {submission.durationSeconds !== null ? (
            <span>Tempo: {formatMinutes(submission.durationSeconds)}</span>
          ) : null}
          <span>Tentativa {submission.attemptNumber}</span>
          {submission.guidingPointsChecked !== null ? (
            <span>
              Leitpunkte: {submission.guidingPointsChecked} de {submission.guidingPointsTotal}
            </span>
          ) : null}
        </p>
      </div>

      <p lang="de" className="rounded-lg bg-inset px-4 py-3 text-sm leading-relaxed text-ink italic">
        „{excerpt(submission.content)}“
      </p>

      {feedback ? (
        <div className="flex gap-3 rounded-lg border border-hairline bg-surface-low px-4 py-3">
          <Icon name="school" className="text-[20px] text-primary" />
          <div>
            <p className="rubric text-secondary">Comentário da Melissa</p>
            <p className="text-sm text-ink">{excerpt(feedback.comment, 200)}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          to={`/meus-textos/${submission.id}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-container px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary"
        >
          <Icon name="visibility" className="text-[16px]" />
          {feedback ? 'Ver correção completa' : 'Ver texto completo'}
        </Link>
        <Link
          to={practiceLink}
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-low px-4 py-1.5 text-xs font-semibold text-primary hover:bg-surface-container"
        >
          <Icon name="edit" className="text-[16px]" />
          Reescrever texto
        </Link>
      </div>
    </article>
  );
}
