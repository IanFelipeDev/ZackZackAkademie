import { isCefrLevel, type CefrLevel } from '@/shared/domain';
import { RepositoryError } from '@/shared/infrastructure/repository-error';
import type { Database } from '@/shared/infrastructure/supabase/database.types';
import type { FlashcardMark } from '../application/ports/flashcard-mark-repository';
import { isMarkStatus } from '../domain/card-status';
import { isFlashcardCategory, type Flashcard, type FlashcardCategory } from '../domain/flashcard';

type Tables = Database['public']['Tables'];

export const FLASHCARD_COLUMNS = 'id, level, category, position, term, translation, synonyms';

export type FlashcardRow = Pick<
  Tables['flashcards']['Row'],
  'id' | 'level' | 'category' | 'position' | 'term' | 'translation' | 'synonyms'
>;

export const MARK_COLUMNS = 'flashcard_id, status';

export type MarkRow = Pick<Tables['flashcard_marks']['Row'], 'flashcard_id' | 'status'>;

function toLevel(value: string): CefrLevel {
  if (!isCefrLevel(value)) throw new RepositoryError(`Unknown CEFR level: ${value}`);
  return value;
}

function toCategory(value: string): FlashcardCategory {
  if (!isFlashcardCategory(value)) throw new RepositoryError(`Unknown flashcard category: ${value}`);
  return value;
}

export function toFlashcard(row: FlashcardRow): Flashcard {
  return {
    id: row.id,
    level: toLevel(row.level),
    category: toCategory(row.category),
    position: row.position,
    term: row.term,
    translation: row.translation,
    synonyms: row.synonyms,
  };
}

export function toMark(row: MarkRow): FlashcardMark {
  if (!isMarkStatus(row.status)) throw new RepositoryError(`Unknown flashcard mark status: ${row.status}`);
  return { flashcardId: row.flashcard_id, status: row.status };
}
