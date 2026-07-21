export type SpeechToTextInput = {
  audio: Buffer;
  mimeType: string;
};

export type SpeechToTextResult = {
  text: string;
  languageCode: string;
  languageConfidence: number; // 0..1
};

export interface ISpeechToText {
  /**
   * Upload + create job + poll until completed/error or timeout.
   * Implementations MUST NOT leak provider-specific errors/stack to callers;
   * throw mapped HttpError subclasses (or a small SpeectToTextError mapped by the service).
   */
  transcribe(input: SpeechToTextInput): Promise<SpeechToTextResult>;
}
