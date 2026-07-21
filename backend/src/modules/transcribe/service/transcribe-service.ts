import type {
  ISpeechToText,
  SpeechToTextResult,
} from "@/modules/transcribe/protocols/speech-to-text";
import { BadGatewayError, BadRequestError } from "@/shared";

type AudioFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

export class TranscribeService {
  constructor(private readonly speechToText: ISpeechToText) {}

  async transcribe(
    file: AudioFile | undefined | null,
  ): Promise<SpeechToTextResult> {
    this.validateAudioFile(file);

    const result = await this.speechToText.transcribe({
      audio: file.buffer,
      mimeType: file.mimetype,
    });

    if (!result.text.trim()) {
      throw new BadGatewayError("Transcription returned empty text");
    }

    return result;
  }

  private validateAudioFile(file: AudioFile | undefined | null): asserts file is AudioFile {
    if (!file) {
      throw new BadRequestError("Audio file is required");
    }

    if (!file.mimetype.startsWith("audio/") && file.mimetype !== "video/webm") {
      throw new BadRequestError("Only audio files are allowed");
    }
  }
}
