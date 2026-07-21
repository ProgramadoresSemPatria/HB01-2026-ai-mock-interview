import { TranscribeService } from "@/modules/transcribe/service/transcribe-service";

import { createAssemblyAiSpeechToText } from "./speech-to-text-factory";

export function makeTranscribeService(): TranscribeService {
  return new TranscribeService(createAssemblyAiSpeechToText());
}
