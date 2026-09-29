const LOCALE = 'pt-BR';

/** "mm:ss", or "h:mm:ss" past one hour. */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const mmss = `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
}

/** Rounded minutes for summaries, e.g. "38 min". */
export function formatMinutes(totalSeconds: number): string {
  return `${Math.max(1, Math.round(totalSeconds / 60))} min`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
}

/** "agora há pouco", "há 12 min", "há 3 h", "ontem às 14:20" or a full date for older moments. */
export function formatLastSeen(date: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return 'agora há pouco';
  if (minutes < 60) return `há ${minutes} min`;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date >= startOfToday) return `há ${Math.floor(minutes / 60)} h`;
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60_000);
  if (date >= startOfYesterday) return `ontem às ${formatTime(date)}`;
  return formatDateTime(date);
}
