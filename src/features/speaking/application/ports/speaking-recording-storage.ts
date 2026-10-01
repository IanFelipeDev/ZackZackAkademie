/** Where students' practice recordings live. Paths come from recordingPathFor. */
export interface SpeakingRecordingStorage {
  upload(path: string, data: Blob, contentType: string): Promise<void>;
  /** A short-lived URL an <audio> element can play. */
  playbackUrl(path: string): Promise<string>;
}
