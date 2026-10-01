import { Button, Icon, MAX_RECORDING_MS, useAudioRecorder } from '@/shared/ui';

const MAX_SECONDS = MAX_RECORDING_MS / 1000;

/**
 * Lets the student record their own pronunciation of the card and listen back. The recording stays on the device and
 * is discarded with the card (the session remounts this per card).
 */
export function PronunciationRecorder({ term }: { term: string }) {
  const recorder = useAudioRecorder();
  if (!recorder.isSupported) {
    return (
      <p className="text-center text-xs text-ink-soft">
        Este navegador não permite gravar áudio, então a gravação da pronúncia não está disponível aqui.
      </p>
    );
  }

  const isRecording = recorder.status === 'recording';
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-surface-low/70 p-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {isRecording ? (
          <>
            <span role="status" className="inline-flex items-center gap-1.5 text-sm font-semibold text-error">
              <Icon name="radio_button_checked" className="text-[18px]" />
              Gravando… (até {MAX_SECONDS} s)
            </span>
            <Button variant="danger" size="sm" icon="stop" onClick={() => void recorder.stop()}>
              Parar
            </Button>
          </>
        ) : (
          <Button
            variant="soft"
            size="sm"
            icon="mic"
            isLoading={recorder.status === 'requesting'}
            onClick={() => void recorder.start()}
            aria-label={`${recorder.recording ? 'Gravar de novo' : 'Gravar minha pronúncia'} de ${term}`}
          >
            {recorder.recording ? 'Gravar de novo' : 'Gravar minha pronúncia'}
          </Button>
        )}
      </div>
      {recorder.recording && !isRecording ? (
        <audio
          controls
          src={recorder.recording.url}
          aria-label="Sua gravação"
          className="h-10 w-full max-w-xs"
        />
      ) : null}
      {recorder.status === 'denied' ? (
        <p role="alert" className="text-center text-xs text-error">
          O microfone está bloqueado. Permita o uso do microfone nas configurações do navegador e tente de
          novo.
        </p>
      ) : null}
      {recorder.status === 'failed' ? (
        <p role="alert" className="text-center text-xs text-error">
          Não foi possível usar o microfone. Verifique se ele está conectado e tente de novo.
        </p>
      ) : null}
    </div>
  );
}
