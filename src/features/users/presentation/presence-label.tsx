import { formatLastSeen } from '@/shared/ui';
import { isOnline } from '../domain/managed-user';

export function PresenceLabel({ lastSeenAt, now }: { lastSeenAt: Date | null; now: Date }) {
  if (isOnline(lastSeenAt, now)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
        <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
        Online agora
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
      <span className="h-2 w-2 rounded-full bg-outline/40" aria-hidden />
      {lastSeenAt ? `Último acesso ${formatLastSeen(lastSeenAt, now)}` : 'Nenhum acesso registrado'}
    </span>
  );
}
