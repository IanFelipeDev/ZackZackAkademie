import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useContainer } from '@/app/context/container-context';
import { useSignedInUser } from '@/features/auth';
import { Alert, EmptyState, Icon, PageHeader, Spinner } from '@/shared/ui';
import {
  CARD_STATUSES,
  countStatuses,
  type CardStatus,
  type MarkStatus,
  type StatusCounts,
} from '../domain/card-status';
import type { DeckCard, DeckFilter } from '../domain/deck';
import { FLASHCARD_CATEGORIES, type FlashcardCategory } from '../domain/flashcard';
import { FlashcardSession } from './components/flashcard-session';
import { CATEGORY_LABELS, STATUS_LABELS } from './flashcard-labels';
import { flashcardQueryKeys } from './flashcard-query-keys';

const LOAD_ERROR = 'Não foi possível carregar os cartões. Tente novamente em instantes.';
const SAVE_ERROR = 'Não foi possível salvar a marcação deste cartão. Tente de novo.';

export function FlashcardsPage() {
  const { flashcards } = useContainer();
  const user = useSignedInUser();
  const queryClient = useQueryClient();
  const deckKey = flashcardQueryKeys.deck(user.id);
  const deck = useQuery({
    queryKey: deckKey,
    queryFn: () => flashcards.listMyCards.execute(user.id),
  });
  const [filter, setFilter] = useState<DeckFilter>({ category: 'all', status: 'all' });

  // Optimistic: the card shows its new status at once and rolls back if saving fails.
  const mark = useMutation({
    mutationFn: (input: { flashcardId: string; status: MarkStatus }) =>
      flashcards.markCard.execute({ studentId: user.id, ...input }),
    onMutate: async ({ flashcardId, status }) => {
      await queryClient.cancelQueries({ queryKey: deckKey });
      const previous = queryClient.getQueryData<DeckCard[]>(deckKey);
      queryClient.setQueryData<DeckCard[]>(deckKey, (cards) =>
        cards?.map((entry) => (entry.card.id === flashcardId ? { ...entry, status } : entry)),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(deckKey, context.previous);
    },
  });

  const cards = deck.data ?? [];
  const inCategory =
    filter.category === 'all' ? cards : cards.filter((entry) => entry.card.category === filter.category);
  const known = cards.filter((entry) => entry.status === 'known').length;

  return (
    <div>
      <PageHeader
        eyebrow="Goethe-Zertifikat B2 · Vocabulário"
        title="Flashcards"
        description="Vire o cartão para ver a tradução e marque se você já sabe a palavra ou se quer revisá-la depois. Suas marcações ficam salvas."
      />
      {deck.isPending ? <Spinner label="Carregando cartões…" /> : null}
      {deck.isError ? <Alert tone="error">{LOAD_ERROR}</Alert> : null}
      {deck.isSuccess && cards.length === 0 ? (
        <EmptyState icon="style" title="Nenhum cartão disponível">
          Os cartões de vocabulário ainda não foram publicados.
        </EmptyState>
      ) : null}
      {cards.length > 0 ? (
        <div className="flex flex-col gap-6">
          <OverallProgress known={known} total={cards.length} />
          <FilterChips
            label="Categoria"
            value={filter.category}
            options={categoryOptions(cards)}
            onChange={(category) => setFilter((current) => ({ ...current, category }))}
            scrollOnPhones
          />
          <FilterChips
            label="Situação"
            value={filter.status}
            options={statusOptions(countStatuses(inCategory.map((entry) => entry.status)))}
            onChange={(status) => setFilter((current) => ({ ...current, status }))}
          />
          {mark.isError ? <Alert tone="error">{SAVE_ERROR}</Alert> : null}
          {/* Keyed by the filter: changing it starts a new pass through the matching cards. */}
          <FlashcardSession
            key={`${filter.category}:${filter.status}`}
            cards={cards}
            filter={filter}
            onMark={(flashcardId, status) => mark.mutate({ flashcardId, status })}
          />
        </div>
      ) : null}
    </div>
  );
}

function OverallProgress({ known, total }: { known: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((known / total) * 100);
  const label = `${known} de ${total} palavras realizadas`;
  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={known}
        className="h-2.5 overflow-hidden rounded-full bg-surface-highest"
      >
        <div
          className="h-full rounded-full bg-primary-container transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm text-ink-soft">
        {label} ({percent}%)
      </p>
    </div>
  );
}

interface ChipOption<T extends string> {
  readonly value: T;
  readonly name: string;
  readonly icon: string;
  readonly count: number;
}

interface FilterChipsProps<T extends string> {
  readonly label: string;
  readonly value: T;
  readonly options: readonly ChipOption<T>[];
  readonly onChange: (value: T) => void;
  /** Scroll sideways on phones instead of wrapping into several rows. */
  readonly scrollOnPhones?: boolean;
}

function FilterChips<T extends string>({
  label,
  value,
  options,
  onChange,
  scrollOnPhones,
}: FilterChipsProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex gap-2 ${
        scrollOnPhones
          ? '-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0'
          : 'flex-wrap'
      }`}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${option.name}: ${option.count}`}
            onClick={() => onChange(option.value)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
              isActive
                ? 'border-primary-container bg-primary-container font-semibold text-white'
                : 'border-hairline bg-surface-lowest text-ink-soft hover:border-primary-container hover:text-primary'
            }`}
          >
            <Icon name={option.icon} className="text-[18px]" />
            {option.name}
            <span className="font-mono text-xs opacity-80">{option.count}</span>
          </button>
        );
      })}
    </div>
  );
}

function categoryOptions(cards: readonly DeckCard[]): ChipOption<FlashcardCategory | 'all'>[] {
  const options = FLASHCARD_CATEGORIES.map((category) => ({
    value: category,
    ...CATEGORY_LABELS[category],
    count: cards.filter((entry) => entry.card.category === category).length,
  })).filter((option) => option.count > 0);
  return [{ value: 'all', name: 'Todas', icon: 'select_all', count: cards.length }, ...options];
}

function statusOptions(counts: StatusCounts): ChipOption<CardStatus | 'all'>[] {
  return [
    { value: 'all', name: 'Todos', icon: 'stacks', count: counts.total },
    ...CARD_STATUSES.map((status) => ({
      value: status,
      name: STATUS_LABELS[status].many,
      icon: STATUS_LABELS[status].icon,
      count: counts[status],
    })),
  ];
}
