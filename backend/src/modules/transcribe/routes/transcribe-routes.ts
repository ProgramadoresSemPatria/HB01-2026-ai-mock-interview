import { makeTranscribeController } from "@/factories/transcribe/transcribe-controller-factory";
import { makeAiRateLimiter } from "@/factories/shared/ai-rate-limiter-factory";
import { audioUploadMiddleware } from "@/modules/transcribe/middlewares/audio-upload-middleware";
import { asyncHandler } from "@/shared";
import type { Router } from "express";

const aiRateLimiter = makeAiRateLimiter();

export default function transcribeRoutes(router: Router): void {
  const controller = makeTranscribeController();

  router.post(
    "/",
    aiRateLimiter,
    audioUploadMiddleware.single("audio"),
    asyncHandler(controller.transcribe),
  );
}
