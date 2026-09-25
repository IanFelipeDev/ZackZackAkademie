import { RepositoryError } from '@/shared/infrastructure/repository-error';
import type { AppSupabaseClient } from '@/shared/infrastructure/supabase/client';
import type { PhraseRepository } from '../application/ports/phrase-repository';
import type { WritingTaskType } from '../domain/task-type';
import type { UsefulPhrase } from '../domain/useful-phrase';
import { toPhrase } from './writing-mappers';

export class SupabasePhraseRepository implements PhraseRepository {
  constructor(private readonly client: AppSupabaseClient) {}

  async listByTaskType(taskType: WritingTaskType): Promise<UsefulPhrase[]> {
    const { data, error } = await this.client
      .from('useful_phrases')
      .select('*')
      .eq('task_type', taskType)
      .order('position');
    if (error) throw new RepositoryError('Failed to list useful phrases', { cause: error });
    return data.map(toPhrase);
  }
}
