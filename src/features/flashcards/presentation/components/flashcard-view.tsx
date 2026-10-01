import { Icon } from '@/shared/ui';
import { splitArticle, type Flashcard } from '../../domain/flashcard';
import { CATEGORY_LABELS } from '../flashcard-labels';

interface FlashcardViewProps {
  readonly card: Flashcard;
  readonly isFlipped: boolean;
  readonly onFlip: () => void;
}

const FACE_CLASS =
  'absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto rounded-2xl border border-hairline p-6 text-center shadow-lift backface-hidden';

/** The card itself: German term on the front, translation and synonyms on the back. Click to flip. */
export function FlashcardView({ card, isFlipped, onFlip }: FlashcardViewProps) {
  const { article, rest } = splitArticle(card.term);
  const category = CATEGORY_LABELS[card.category];
  return (
    <button type="button" onClick={onFlip} className="block h-72 w-full perspective-[1600px] sm:h-80">
      {/* Rotating the inner box, not the button, keeps the focus ring flat. */}
      <span
        className={`relative block h-full w-full transition-transform duration-500 ease-(--ease-strong-in-out) transform-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        <span className={`${FACE_CLASS} bg-surface-lowest`} aria-hidden={isFlipped}>
          <CategoryTag name={category.name} icon={category.icon} />
          <span lang="de" className="font-serif text-4xl leading-tight text-primary sm:text-5xl">
            {article ? (
              <span className="mr-2 rounded-lg bg-surface-high px-2 align-middle text-[0.6em] text-secondary">
                {article}
              </span>
            ) : null}
            {rest}
          </span>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-ink-soft">
            <Icon name="touch_app" className="text-[16px]" />
            Toque ou clique para virar
          </span>
        </span>

        <span className={`${FACE_CLASS} rotate-y-180 bg-surface-low`} aria-hidden={!isFlipped}>
          <CategoryTag name={category.name} icon={category.icon} />
          <span lang="de" className="font-serif text-lg text-ink-soft">
            {card.term}
          </span>
          <span className="text-2xl font-semibold text-primary sm:text-3xl">{card.translation}</span>
          {card.synonyms.length > 0 ? (
            <span className="mt-1 flex flex-col items-center gap-1">
              <span className="rubric text-ink-soft">Sinônimos e paráfrases</span>
              <span lang="de" className="text-ink">
                {card.synonyms.join(' · ')}
              </span>
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

function CategoryTag({ name, icon }: { name: string; icon: string }) {
  return (
    <span className="rubric absolute top-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-surface-high px-2.5 py-0.5 whitespace-nowrap text-primary">
      <Icon name={icon} className="text-[14px]" />
      {name}
    </span>
  );
}
