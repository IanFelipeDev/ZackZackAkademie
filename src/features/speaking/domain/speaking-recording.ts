/** Recordings above this size are not uploaded (also the storage bucket's limit). */
export const MAX_RECORDING_BYTES = 25 * 1024 * 1024;

/** Longest recording the timer keeps; far above the exam timing, like MAX_PRACTICE_SECONDS. */
export const MAX_PRACTICE_RECORDING_MS = 20 * 60 * 1000;

/** File extensions for the formats browsers record in. Mirrors the check constraint on recording_path. */
const EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
};

/** "audio/webm;codecs=opus" → "audio/webm". */
export function baseMimeType(mimeType: string): string {
  return (mimeType.split(';')[0] ?? '').trim().toLowerCase();
}

/**
 * Where a practice's recording is stored: `<student id>/<practice id>.<ext>`, so storage policies can tell whose it
 * is from the first folder. Null when the format is not one we accept or the file is empty or too large.
 */
export function recordingPathFor(
  studentId: string,
  practiceId: string,
  mimeType: string,
  sizeBytes: number,
): string | null {
  const extension = EXTENSIONS[baseMimeType(mimeType)];
  if (!extension || sizeBytes <= 0 || sizeBytes > MAX_RECORDING_BYTES) return null;
  return `${studentId}/${practiceId}.${extension}`;
}
