import { TranscribeController } from "@/modules/transcribe/controllers/transcribe-controller";

import { makeTranscribeService } from "./transcribe-service-factory";

export function makeTranscribeController(): TranscribeController {
  return new TranscribeController(makeTranscribeService());
}
