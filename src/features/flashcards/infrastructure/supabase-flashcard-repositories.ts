import { RepositoryError } from '@/shared/infrastructure/repository-error';
import type { AppSupabaseClient } from '@/shared/infrastructure/supabase/client';
import type { FlashcardMark, FlashcardMarkRepository } from '../application/ports/flashcard-mark-repository';
import type { FlashcardRepository } from '../application/ports/flashcard-repository';
import type { Flashcard } from '../domain/flashcard';
import {
  FLASHCARD_COLUMNS,
  MARK_COLUMNS,
  toFlashcard,
  toMark,
  type FlashcardRow,
  type MarkRow,
} from './flashcard-mappers';

/** PostgREST returns at most this many rows per request (the hosted default), so larger reads are paged. */
const PAGE_SIZE = 1000;

/** Reads every page of a query; `fetchPage` loads the rows in [from, to]. */
async function readAllPages<Row>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: unknown }>,
  failure: string,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw new RepositoryError(failure, { cause: error });
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export class SupabaseFlashcardRepository implements FlashcardRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async listAll(): Promise<Flashcard[]> {
    // Unpublished cards are filtered by RLS for students; staff see them too. The id makes paging stable.
    const rows = await readAllPages(
      (from, to) =>
        this.client
          .from('flashcards')
          .select(FLASHCARD_COLUMNS)
          .order('id')
          .range(from, to)
          .overrideTypes<FlashcardRow[], { merge: false }>(),
      'Failed to list flashcards',
    );
    return rows.map(toFlashcard);
  }
}

export class SupabaseFlashcardMarkRepository implements FlashcardMarkRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async listByStudent(studentId: string): Promise<FlashcardMark[]> {
    const rows = await readAllPages(
      (from, to) =>
        this.client
          .from('flashcard_marks')
          .select(MARK_COLUMNS)
          .eq('student_id', studentId)
          .order('flashcard_id')
          .range(from, to)
          .overrideTypes<MarkRow[], { merge: false }>(),
      'Failed to list flashcard marks',
    );
    return rows.map(toMark);
  }

  async save(studentId: string, mark: FlashcardMark): Promise<void> {
    // updated_at is stamped by the database.
    const { error } = await this.client
      .from('flashcard_marks')
      .upsert(
        { student_id: studentId, flashcard_id: mark.flashcardId, status: mark.status },
        { onConflict: 'student_id,flashcard_id' },
      );
    if (error) throw new RepositoryError('Failed to save flashcard mark', { cause: error });
  }
}
