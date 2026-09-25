import { Button } from '@/shared/ui';
import type { WordCountStatus } from '../../domain/word-count';

interface SubmitConfirmationProps {
  readonly wordCount: number;
  readonly wordStatus: WordCountStatus;
  readonly isSubmitting: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/** Submissions are immutable, so the student confirms before sending. */
export function SubmitConfirmation({
  wordCount,
  wordStatus,
  isSubmitting,
  onConfirm,
  onCancel,
}: SubmitConfirmationProps) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="submit-confirm-title"
      className="rounded-xl border border-hairline bg-surface-low p-4"
    >
      <p id="submit-confirm-title" className="font-semibold text-ink">
        Enviar esta tentativa com {wordCount} palavras para a Melissa corrigir?
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Depois de enviado, o texto fica guardado no seu histórico e não pode mais ser editado.
        {wordStatus === 'below' ? ' Atenção: o texto ainda está abaixo da meta de palavras.' : ''}
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button variant="soft" onClick={onCancel} disabled={isSubmitting}>
          Continuar escrevendo
        </Button>
        <Button icon="send" onClick={onConfirm} isLoading={isSubmitting}>
          Confirmar envio
        </Button>
      </div>
    </div>
  );
}
