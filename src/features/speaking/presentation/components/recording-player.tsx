import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useContainer } from '@/app/context/container-context';
import { Alert, Button, Spinner } from '@/shared/ui';
import { speakingQueryKeys } from '../speaking-query-keys';

interface RecordingPlayerProps {
  readonly recordingPath: string;
  /** Load the audio straight away (teacher assessing) instead of on request (student history). */
  readonly loadImmediately?: boolean;
  readonly label?: string;
}

/** Plays a practice recording. The signed URL is fetched only when needed, since it expires after an hour. */
export function RecordingPlayer({
  recordingPath,
  loadImmediately = false,
  label = 'Gravação da prática',
}: RecordingPlayerProps) {
  const { speaking } = useContainer();
  const [isRequested, setIsRequested] = useState(loadImmediately);
  const url = useQuery({
    queryKey: speakingQueryKeys.recording(recordingPath),
    queryFn: () => speaking.getRecordingUrl.execute(recordingPath),
    enabled: isRequested,
    // Signed URLs last an hour; refetch well before that instead of serving an expired one.
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (!isRequested) {
    return (
      <Button
        variant="soft"
        size="sm"
        icon="play_circle"
        onClick={() => setIsRequested(true)}
        className="self-start"
      >
        Ouvir gravação
      </Button>
    );
  }
  if (url.isPending) return <Spinner label="Carregando gravação…" />;
  if (url.isError) return <Alert tone="error">Não foi possível carregar a gravação. Tente de novo.</Alert>;
  return <audio controls preload="metadata" src={url.data} aria-label={label} className="h-10 w-full" />;
}
