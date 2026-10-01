import { useEffect, useState } from 'react';
import { Badge, Button, EmptyState, Icon } from '@/shared/ui';
import type { CardStatus, MarkStatus } from '../../domain/card-status';
import { filterDeck, shuffle, type DeckCard, type DeckFilter } from '../../domain/deck';
import { STATUS_LABELS } from '../flashcard-labels';
import { FlashcardView } from './flashcard-view';
import { PronunciationRecorder } from './pronunciation-recorder';

const EMPTY_MESSAGES: Record<CardStatus | 'all', { title: string; body: string }> = {
  all: { title: 'Nenhum cartão nesta categoria', body: 'Escolha outra categoria acima.' },
  new: {
    title: 'Você já passou por todos estes cartões',
    body: 'Todos os cartões desta categoria já estão marcados como “A revisar” ou “Realizado”.',
  },
  review: {
    title: 'Nenhum cartão para revisar',
    body: 'Quando você marcar um cartão como “A revisar”, ele aparece aqui.',
  },
  known: {
    title: 'Nenhum cartão realizado ainda',
    body: 'Os cartões que você marcar como “Já sei” aparecem aqui.',
  },
};

interface FlashcardSessionProps {
  /** Every card with its live status; statuses change as the student marks cards. */
  readonly cards: readonly DeckCard[];
  readonly filter: DeckFilter;
  readonly onMark: (flashcardId: string, status: MarkStatus) => void;
}

/**
 * One pass through the cards matching the filter. The order is fixed when the session starts, so a card does
 * not vanish from the pass when marking changes its status; the parent remounts the session when the filter changes.
 */
export function FlashcardSession({ cards, filter, onMark }: FlashcardSessionProps) {
  const [order, setOrder] = useState(() => filterDeck(cards, filter));
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const current = cards.find((entry) => entry.card.id === order[index]);

  function go(step: number) {
    if (order.length === 0) return;
    setIndex((i) => (i + step + order.length) % order.length);
    setIsFlipped(false);
  }

  function reshuffle() {
    setOrder((ids) => shuffle(ids));
    setIndex(0);
    setIsFlipped(false);
  }

  function mark(status: MarkStatus) {
    if (!current) return;
    onMark(current.card.id, status);
    go(1);
  }

  // Arrow keys move through the deck unless the student is typing somewhere.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!current) {
    const message = EMPTY_MESSAGES[filter.status];
    return (
      <EmptyState icon="style" title={message.title}>
        {message.body}
      </EmptyState>
    );
  }

  const status = STATUS_LABELS[current.status];
  return (
    <section aria-label="Cartão atual" className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex items-center justify-between gap-2 text-sm text-ink-soft">
        <span className="flex items-center gap-1">
          <span aria-live="polite">
            Cartão {index + 1} de {order.length}
          </span>
          <Button variant="ghost" size="sm" icon="shuffle" onClick={reshuffle}>
            Embaralhar
          </Button>
        </span>
        <Badge tone={status.tone} icon={status.icon}>
          {status.one}
        </Badge>
      </div>

      {/* Keyed by card so the next card starts on its front without playing the flip back. */}
      <FlashcardView
        key={current.card.id}
        card={current.card}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped((flipped) => !flipped)}
      />
      <PronunciationRecorder key={`recorder:${current.card.id}`} term={current.card.term} />

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" size="lg" icon="replay" onClick={() => mark('review')}>
          A revisar
        </Button>
        <Button size="lg" icon="check" onClick={() => mark('known')}>
          Já sei
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="soft" icon="arrow_back" onClick={() => go(-1)}>
          Anterior
        </Button>
        <Button variant="soft" onClick={() => go(1)}>
          Próximo
          <Icon name="arrow_forward" className="text-[18px]" />
        </Button>
      </div>
      <p className="hidden text-center text-xs text-ink-soft sm:block">
        Use as setas ← → do teclado para navegar. Espaço ou Enter vira o cartão selecionado.
      </p>
    </section>
  );
}
