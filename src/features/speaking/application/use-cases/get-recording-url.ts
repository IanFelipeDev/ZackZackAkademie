import type { SpeakingRecordingStorage } from '../ports/speaking-recording-storage';

/** A playable URL for a practice recording; storage policies decide who may get one (the student and staff). */
export class GetRecordingUrl {
  constructor(private readonly recordings: SpeakingRecordingStorage) {}

  execute(recordingPath: string): Promise<string> {
    return this.recordings.playbackUrl(recordingPath);
  }
}
