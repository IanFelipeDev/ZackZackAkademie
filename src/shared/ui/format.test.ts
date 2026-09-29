import { describe, expect, it } from 'vitest';
import { formatClock, formatDateTime, formatLastSeen, formatMinutes } from './format';

describe('formatClock', () => {
  it('formats seconds as mm:ss and adds hours when needed', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(1126)).toBe('18:46');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatClock(-3)).toBe('00:00');
  });
});

describe('formatMinutes', () => {
  it('rounds to whole minutes with a minimum of one', () => {
    expect(formatMinutes(20)).toBe('1 min');
    expect(formatMinutes(2280)).toBe('38 min');
  });
});

describe('formatLastSeen', () => {
  const now = new Date(2026, 8, 29, 15, 0);
  const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000);

  it('describes recent activity relative to now', () => {
    expect(formatLastSeen(minutesAgo(0), now)).toBe('agora há pouco');
    expect(formatLastSeen(minutesAgo(12), now)).toBe('há 12 min');
    expect(formatLastSeen(minutesAgo(185), now)).toBe('há 3 h');
  });

  it('names yesterday and falls back to the date for older activity', () => {
    const yesterday = new Date(2026, 8, 28, 14, 20);
    const older = new Date(2026, 8, 20, 9, 5);
    expect(formatLastSeen(yesterday, now)).toMatch(/^ontem às 14:20$/);
    expect(formatLastSeen(older, now)).toBe(formatDateTime(older));
  });
});
