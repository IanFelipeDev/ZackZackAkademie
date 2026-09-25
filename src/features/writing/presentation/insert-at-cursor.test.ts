import { describe, expect, it } from 'vitest';
import { insertAtCursor } from './insert-at-cursor';

describe('insertAtCursor', () => {
  it('inserts into an empty text without a leading space', () => {
    expect(insertAtCursor('', 0, 0, 'Meines Erachtens …')).toEqual({
      value: 'Meines Erachtens …',
      cursor: 18,
    });
  });

  it('adds a space after a word and keeps the rest of the text', () => {
    expect(insertAtCursor('Hallo Welt', 5, 5, 'liebe')).toEqual({ value: 'Hallo liebe Welt', cursor: 11 });
  });

  it('replaces the selected text', () => {
    expect(insertAtCursor('Ich denke, dass', 0, 9, 'Ich bin der Ansicht')).toEqual({
      value: 'Ich bin der Ansicht, dass',
      cursor: 19,
    });
  });
});
