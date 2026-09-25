import { describe, expect, it } from 'vitest';
import { formatClock, formatMinutes } from './format';

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
