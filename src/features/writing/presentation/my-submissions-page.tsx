import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { useContainer } from '@/app/context/container-context';
import { useSignedInUser } from '@/features/auth';
import { Alert, EmptyState, Icon, PageHeader, Spinner } from '@/shared/ui';
import type { SubmissionSummary } from '../application/read-models';
import { computeWritingStats } from '../application/use-cases/compute-writing-stats';
import { DraftCard } from './components/draft-card';
import { SubmissionCard } from './components/submission-card';
import { MelissaTip, WritingStatsPanel } from './components/writing-stats-panel';
import { writingErrorMessage } from './writing-error-message';
import { writingQueryKeys } from './writing-query-keys';

const PAGE_SIZE = 10;

type Filter = 'all' | 'forum_post' | 'formal_email' | 'reviewed';

const FILTERS: readonly { value: Filter; label: string; matches: (s: SubmissionSummary) => boolean }[] = [
  { value: 'all', label: 'Todos os textos', matches: () => true },
  { value: 'forum_post', label: 'Teil 1 (Forumsbeitrag)', matches: (s) => s.taskType === 'forum_post' },
  { value: 'formal_email', label: 'Teil 2 (E-Mail formal)', matches: (s) => s.taskType === 'formal_email' },
  { value: 'reviewed', label: 'Com feedback da Melissa', matches: (s) => s.feedback !== null },
];

function matchesSearch(submission: SubmissionSummary, search: string): boolean {
  const term = search.trim().toLocaleLowerCase('de');
  if (!term) return true;
  return `${submission.exerciseTitle} ${submission.content}`.toLocaleLowerCase('de').includes(term);
}

export function MySubmissionsPage() {
  const { writing } = useContainer();
  const user = useSignedInUser();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const submissions = useQuery({
    queryKey: writingQueryKeys.submissions(user.id),
    queryFn: () => writing.listMySubmissions.execute(user.id),
  });
  const drafts = useQuery({
    queryKey: writingQueryKeys.drafts(user.id),
    queryFn: () => writing.listMyDrafts.execute(user.id),
  });
  const deleteDraft = useMutation({
    mutationFn: (exerciseId: string) => writing.deleteDraft.execute(exerciseId, user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: writingQueryKeys.drafts(user.id) }),
  });

  const all = submissions.data ?? [];
  const activeFilter = FILTERS.find((f) => f.value === filter) ?? FILTERS[0];
  const filtered = all.filter((s) => (activeFilter?.matches(s) ?? true) && matchesSearch(s, search));
  const visible = filtered.slice(0, visibleCount);

  return (
    <div>
      <PageHeader
        eyebrow="Arquivo pessoal do estudante"
        title="Meus Textos Salvos"
        description="Acompanhe seu histórico de treinos para o Goethe-Zertifikat B2: palavras escritas, tempo dedicado e o feedback das correções com a Melissa."
        actions={
          <Link
            to="/treino"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lift hover:bg-primary-container"
          >
            <Icon name="edit_note" className="text-[18px]" />
            Iniciar novo treino
          </Link>
        }
      />

      <div className="mb-6 flex flex-col gap-3 rounded-xl bg-surface-low/70 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="radiogroup" aria-label="Filtrar textos" className="flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const isActive = item.value === filter;
            return (
              <button
                key={item.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => {
                  setFilter(item.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  isActive
                    ? 'bg-primary-container text-white'
                    : 'bg-surface-lowest text-ink hover:text-primary'
                }`}
              >
                {item.label} <span className="opacity-70">({all.filter(item.matches).length})</span>
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 rounded-full bg-surface-lowest px-3 py-1.5 text-sm lg:w-72">
          <Icon name="search" className="text-[18px] text-outline" />
          <span className="sr-only">Buscar</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar tema ou vocabulário…"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-outline/70"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-8">
          {drafts.isError || submissions.isError ? (
            <Alert tone="error">{writingErrorMessage(submissions.error ?? drafts.error)}</Alert>
          ) : null}
          {deleteDraft.isError ? <Alert tone="error">{writingErrorMessage(deleteDraft.error)}</Alert> : null}

          {filter === 'all' && !search
            ? drafts.data?.map((draft) => (
                <DraftCard
                  key={draft.exerciseId}
                  draft={draft}
                  isDeleting={deleteDraft.isPending && deleteDraft.variables === draft.exerciseId}
                  onDelete={() => deleteDraft.mutate(draft.exerciseId)}
                />
              ))
            : null}

          {submissions.isPending ? <Spinner label="Carregando seus textos…" /> : null}
          {submissions.isSuccess && filtered.length === 0 ? (
            <EmptyState
              icon="history_edu"
              title={all.length === 0 ? 'Nenhum texto enviado ainda' : 'Nada encontrado'}
            >
              {all.length === 0 ? (
                <>
                  Escolha um tema na{' '}
                  <Link to="/treino" className="font-semibold text-primary underline">
                    Área de Treino
                  </Link>{' '}
                  e envie sua primeira redação.
                </>
              ) : (
                'Tente outro filtro ou termo de busca.'
              )}
            </EmptyState>
          ) : null}

          {visible.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}

          {filtered.length > visible.length ? (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className="mx-auto inline-flex items-center gap-1 rounded-full bg-surface-low px-5 py-2 text-sm font-semibold text-primary hover:bg-surface-container"
            >
              <Icon name="expand_more" className="text-[18px]" />
              Carregar redações anteriores ({filtered.length - visible.length} restantes)
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-5 lg:sticky lg:top-24 lg:col-span-4">
          {submissions.isSuccess ? <WritingStatsPanel stats={computeWritingStats(all)} /> : null}
          <MelissaTip />
        </div>
      </div>
    </div>
  );
}
