import { formatTime } from '@/shared/ui';
import type { DraftSaveStatus } from '../use-draft-autosave';

export function SaveStatus({ status, lastSavedAt }: { status: DraftSaveStatus; lastSavedAt: Date | null }) {
  let text = '';
  if (status === 'pending') text = 'Digitando…';
  if (status === 'saving') text = 'Salvando rascunho…';
  if (status === 'error') text = 'Não foi possível salvar o rascunho.';
  if (status === 'saved' && lastSavedAt) text = `Rascunho salvo às ${formatTime(lastSavedAt)}`;

  return (
    <span
      role="status"
      className={`text-center text-xs italic sm:text-right ${status === 'error' ? 'text-error' : 'text-ink-soft/80'}`}
    >
      {text}
    </span>
  );
}
