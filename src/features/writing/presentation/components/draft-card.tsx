import { useState } from 'react';
import { Link } from 'react-router';
import { Badge, Button, formatDateTime, Icon } from '@/shared/ui';
import type { DraftSummary } from '../../application/read-models';
import { wordProgressPercent } from '../../domain/word-count';
import { TASK_TYPE_LABELS } from '../task-type-labels';
import { excerpt } from '../excerpt';

interface DraftCardProps {
  readonly draft: DraftSummary;
  readonly isDeleting: boolean;
  readonly onDelete: () => void;
}

export function DraftCard({ draft, isDeleting, onDelete }: DraftCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const label = TASK_TYPE_LABELS[draft.taskType];
  const progress = wordProgressPercent(draft.wordCount, draft.wordRange);

  return (
    <article className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-hairline bg-surface-lowest p-5 pl-6 shadow-paper">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-tertiary" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Badge tone="warning">
            {label.part} · {label.name}
          </Badge>
          <Badge icon="edit">Rascunho salvo</Badge>
        </div>
        <span className="text-xs text-ink-soft">Salvo em {formatDateTime(draft.updatedAt)}</span>
      </div>

      <h2 className="text-2xl text-primary">{draft.exerciseTitle}</h2>
      <p lang="de" className="rounded-lg bg-inset px-4 py-3 text-sm leading-relaxed text-ink italic">
        „{excerpt(draft.content)}“
      </p>
      <p className="flex justify-between rounded-lg bg-surface-low px-4 py-2 text-xs text-ink-soft">
        <span>
          {draft.wordCount} palavras
          {draft.wordRange ? ` (meta: ${draft.wordRange.min}–${draft.wordRange.max})` : ''}
        </span>
        <span className="font-semibold">{progress}% da extensão</span>
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to={`/treino?teil=${label.slug}&tema=${draft.exerciseId}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-container px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary"
        >
          <Icon name="play_arrow" className="text-[16px]" />
          Continuar escrevendo
        </Link>
        {isConfirmingDelete ? (
          <span className="flex items-center gap-2 text-xs text-ink-soft">
            Excluir este rascunho?
            <Button size="sm" variant="soft" onClick={() => setIsConfirmingDelete(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={onDelete} isLoading={isDeleting}>
              Excluir
            </Button>
          </span>
        ) : (
          <Button size="sm" variant="ghost" icon="delete" onClick={() => setIsConfirmingDelete(true)}>
            Excluir rascunho
          </Button>
        )}
      </div>
    </article>
  );
}
