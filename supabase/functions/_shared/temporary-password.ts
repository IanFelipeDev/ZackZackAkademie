// Pure module (no Deno APIs) so Vitest can test it.

/** Letters and digits without look-alikes (0/O, 1/l/I) so the password is easy to type from an email. */
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const ALPHABET = LOWER + UPPER + DIGITS;

export const TEMPORARY_PASSWORD_LENGTH = 14;

type FillRandom = (bytes: Uint32Array<ArrayBuffer>) => Uint32Array<ArrayBuffer>;

const defaultFillRandom: FillRandom = (bytes) => crypto.getRandomValues(bytes);

function pick(chars: string, random: number): string {
  return chars.charAt(random % chars.length);
}

/**
 * A random password with at least one lowercase letter, uppercase letter and digit.
 * Uses the platform CSPRNG; `fillRandom` exists only for deterministic tests.
 */
export function generateTemporaryPassword(fillRandom: FillRandom = defaultFillRandom): string {
  // One random value per character, plus one per shuffle step.
  const random = fillRandom(new Uint32Array(TEMPORARY_PASSWORD_LENGTH * 2));
  const at = (index: number) => random[index] ?? 0;
  const chars = [pick(LOWER, at(0)), pick(UPPER, at(1)), pick(DIGITS, at(2))];
  for (let index = 3; index < TEMPORARY_PASSWORD_LENGTH; index++) chars.push(pick(ALPHABET, at(index)));

  // Shuffle so the guaranteed character classes are not always at the start (Fisher–Yates).
  for (let index = chars.length - 1; index > 0; index--) {
    const swap = at(TEMPORARY_PASSWORD_LENGTH + index) % (index + 1);
    [chars[index], chars[swap]] = [chars[swap] ?? '', chars[index] ?? ''];
  }
  return chars.join('');
}
