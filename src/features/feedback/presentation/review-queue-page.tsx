import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useContainer } from '@/app/context/container-context';
import { Alert, Badge, EmptyState, formatDateTime, Icon, PageHeader, Spinner } from '@/shared/ui';
import { feedbackErrorMessage } from './feedback-error-message';
import { feedbackQueryKeys } from './feedback-query-keys';
import { REVIEW_TASK_LABELS } from './task-type-label';

export function ReviewQueuePage() {
  const { feedback } = useContainer();
  const pending = useQuery({
    queryKey: feedbackQueryKeys.pending,
    queryFn: () => feedback.listPending.execute(),
  });

  return (
    <div>
      <PageHeader
        eyebrow="Área da professora"
        title="Correções pendentes"
        description="Textos enviados pelos alunos que ainda aguardam feedback, do mais antigo para o mais recente."
      />
      {pending.isPending ? <Spinner /> : null}
      {pending.isError ? <Alert tone="error">{feedbackErrorMessage(pending.error)}</Alert> : null}
      {pending.isSuccess && pending.data.length === 0 ? (
        <EmptyState icon="task_alt" title="Tudo corrigido!">
          Nenhum texto aguardando correção no momento.
        </EmptyState>
      ) : null}
      {pending.isSuccess && pending.data.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {pending.data.map((item) => (
            <li key={item.id}>
              <Link
                to={`/revisoes/${item.id}`}
                className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface-lowest p-4 shadow-paper transition-colors hover:border-primary-container sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="mb-1 flex flex-wrap gap-2">
                    <Badge tone="primary">{REVIEW_TASK_LABELS[item.taskType]}</Badge>
                    <Badge>Tentativa {item.attemptNumber}</Badge>
                  </div>
                  <p className="font-serif text-xl text-primary">{item.exerciseTitle}</p>
                  <p className="text-sm text-ink-soft">
                    {item.studentName} · {item.wordCount} palavras · enviado em{' '}
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Corrigir <Icon name="arrow_forward" className="text-[18px]" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
