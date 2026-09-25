import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useContainer } from '@/app/context/container-context';
import { writingQueryKeys } from './writing-query-keys';

export const AUTOSAVE_DELAY_MS = 1500;

export type DraftSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface DraftAutosaveOptions {
  readonly exerciseId: string;
  readonly studentId: string;
  readonly content: string;
  /** Content already stored in the backend when the session started. */
  readonly initialContent: string;
}

interface DraftAutosave {
  readonly status: DraftSaveStatus;
  readonly lastSavedAt: Date | null;
  /** Saves immediately (the "Entwurf speichern" button). */
  readonly saveNow: () => void;
  /** Declares what the backend now holds, e.g. an empty draft after submitting. */
  readonly markPersisted: (content: string) => void;
}

/** Debounced draft saving while the student types. */
export function useDraftAutosave({
  exerciseId,
  studentId,
  content,
  initialContent,
}: DraftAutosaveOptions): DraftAutosave {
  const { writing } = useContainer();
  const queryClient = useQueryClient();
  const [persisted, setPersisted] = useState(initialContent);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const save = useMutation({
    mutationFn: (value: string) => writing.saveDraft.execute({ exerciseId, studentId, content: value }),
    onSuccess: (_, value) => {
      setPersisted(value);
      setLastSavedAt(new Date());
      void queryClient.invalidateQueries({ queryKey: writingQueryKeys.drafts(studentId) });
    },
  });
  const { mutate } = save;
  const isDirty = persisted !== content;

  useEffect(() => {
    if (!isDirty) return undefined;
    const timeout = window.setTimeout(() => mutate(content), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [isDirty, content, mutate]);

  const saveNow = useCallback(() => mutate(content), [content, mutate]);

  const markPersisted = useCallback((value: string) => {
    setPersisted(value);
    setLastSavedAt(null);
  }, []);

  let status: DraftSaveStatus = 'idle';
  if (save.isPending) status = 'saving';
  else if (save.isError) status = 'error';
  else if (isDirty) status = 'pending';
  else if (lastSavedAt) status = 'saved';

  return { status, lastSavedAt, saveNow, markPersisted };
}
