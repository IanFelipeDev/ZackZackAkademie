const DEFAULT_EXCERPT_LENGTH = 260;

export function excerpt(text: string, length = DEFAULT_EXCERPT_LENGTH): string {
  return text.length <= length ? text : `${text.slice(0, length).trimEnd()} …`;
}
