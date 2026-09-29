import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { useContainer } from '@/app/context/container-context';
import { Alert, Badge, EmptyState, formatDateTime, Icon, PageHeader, Spinner, TextField } from '@/shared/ui';
import type { ReviewedSubmission } from '../application/read-models';
import { feedbackErrorMessage } from './feedback-error-message';
import { feedbackQueryKeys } from './feedback-query-keys';
import { REVIEW_TASK_LABELS } from './task-type-label';

function matchesStudent(item: ReviewedSubmission, search: string): boolean {
  const term = search.trim().toLocaleLowerCase('pt-BR');
  return !term || item.studentName.toLocaleLowerCase('pt-BR').includes(term);
}

export function ReviewHistoryPage() {
  const { feedback } = useContainer();
  const [search, setSearch] = useState('');
  const reviewed = useQuery({
    queryKey: feedbackQueryKeys.reviewed,
    queryFn: () => feedback.listReviewed.execute(),
  });
  const visible = (reviewed.data ?? []).filter((item) => matchesStudent(item, search));

  return (
    <div>
      <PageHeader
        eyebrow="Área da professora"
        title="Histórico de correções"
        description="Textos já corrigidos, dos mais recentes para os mais antigos. Abra uma correção para alterar a nota ou o comentário."
      />
      {reviewed.isPending ? <Spinner /> : null}
      {reviewed.isError ? <Alert tone="error">{feedbackErrorMessage(reviewed.error)}</Alert> : null}
      {reviewed.isSuccess && reviewed.data.length === 0 ? (
        <EmptyState icon="history" title="Nenhuma correção ainda">
          As correções enviadas aparecem aqui.
        </EmptyState>
      ) : null}
      {reviewed.isSuccess && reviewed.data.length > 0 ? (
        <>
          <TextField
            label="Buscar aluno"
            icon="search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mb-4 max-w-sm"
          />
          {visible.length === 0 ? (
            <p className="text-sm text-ink-soft">Nenhuma correção para “{search.trim()}”.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {visible.map((item) => (
                <li key={item.id}>
                  <ReviewedItem item={item} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}

function ReviewedItem({ item }: { item: ReviewedSubmission }) {
  const { feedback } = item;
  return (
    <Link
      to={`/revisoes/${item.id}`}
      className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface-lowest p-4 shadow-paper transition-colors hover:border-primary-container sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <div className="mb-1 flex flex-wrap gap-2">
          <Badge tone="primary">{REVIEW_TASK_LABELS[item.taskType]}</Badge>
          <Badge>Tentativa {item.attemptNumber}</Badge>
          {feedback.updatedAt ? <Badge icon="edit">Editada</Badge> : null}
        </div>
        <p className="font-serif text-xl text-primary">{item.exerciseTitle}</p>
        <p className="text-sm text-ink-soft">
          {item.studentName} · corrigido por {feedback.teacherName} em {formatDateTime(feedback.createdAt)}
          {feedback.updatedAt ? ` · editada em ${formatDateTime(feedback.updatedAt)}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-2xl font-bold text-primary">
          {feedback.score !== null ? `${feedback.score}/100` : '—'}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold whitespace-nowrap text-primary">
          Ver correção <Icon name="arrow_forward" className="text-[18px]" />
        </span>
      </div>
    </Link>
  );
}
