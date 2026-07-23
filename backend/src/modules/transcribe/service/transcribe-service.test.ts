import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ISpeechToText,
  SpeechToTextResult,
} from "@/modules/transcribe/protocols/speech-to-text";
import { BadGatewayError, BadRequestError } from "@/shared";

import { TranscribeService } from "./transcribe-service";

type AudioFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

function createAudioFile(overrides: Partial<AudioFile> = {}): AudioFile {
  return {
    buffer: Buffer.from("audio-bytes"),
    mimetype: "audio/webm",
    size: 1_024,
    ...overrides,
  };
}

describe("TranscribeService", () => {
  let speechToText: ISpeechToText;
  let service: TranscribeService;

  const transcription: SpeechToTextResult = {
    text: "Hello, world",
    languageCode: "en",
    languageConfidence: 0.99,
  };

  beforeEach(() => {
    speechToText = {
      transcribe: vi.fn().mockResolvedValue(transcription),
    };
    service = new TranscribeService(speechToText);
  });

  it("delegates a valid audio file and returns the port result", async () => {
    const file = createAudioFile();

    await expect(service.transcribe(file)).resolves.toEqual(transcription);
    expect(speechToText.transcribe).toHaveBeenCalledWith({
      audio: file.buffer,
      mimeType: file.mimetype,
    });
  });

  it("throws BadRequestError when file is missing", async () => {
    await expect(service.transcribe(undefined)).rejects.toThrow(BadRequestError);
    expect(speechToText.transcribe).not.toHaveBeenCalled();
  });

  it("throws BadRequestError for an unsupported mimetype", async () => {
    await expect(
      service.transcribe(createAudioFile({ mimetype: "text/plain" })),
    ).rejects.toThrow(BadRequestError);
    expect(speechToText.transcribe).not.toHaveBeenCalled();
  });

  it("throws BadGatewayError when transcription text is empty after trimming", async () => {
    vi.mocked(speechToText.transcribe).mockResolvedValue({
      ...transcription,
      text: " \n ",
    });

    await expect(service.transcribe(createAudioFile())).rejects.toThrow(
      new BadGatewayError("Transcription returned empty text"),
    );
  });
});
