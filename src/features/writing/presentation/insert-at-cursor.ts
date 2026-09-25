export interface TextInsertion {
  readonly value: string;
  readonly cursor: number;
}

/** Inserts a phrase at the selection, adding a separating space when the previous character is not whitespace. */
export function insertAtCursor(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  phrase: string,
): TextInsertion {
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  const needsSpace = before.length > 0 && !/\s$/.test(before);
  const inserted = `${needsSpace ? ' ' : ''}${phrase}`;
  return { value: before + inserted + after, cursor: before.length + inserted.length };
}
