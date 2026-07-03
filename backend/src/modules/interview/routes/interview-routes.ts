import {
  createSessionSchema,
  streamMessageSchema,
  submitFeedbackSchema,
} from "@/modules/interview/validations/interview-schemas";
import { asyncHandler, validate } from "@/shared";
import type { Router } from "express";

import { makeAiRateLimiter } from "@/factories/shared/ai-rate-limiter-factory";
import { makeInterviewController } from "@/factories/interview/interview-controller-factory";

export default function interviewRoutes(router: Router): void {
  const controller = makeInterviewController();
  const aiRateLimiter = makeAiRateLimiter();

  router.post(
    "/sessions",
    aiRateLimiter,
    validate(createSessionSchema),
    asyncHandler(controller.createSession),
  );
  router.get("/sessions", asyncHandler(controller.listSessions));
  router.post(
    "/sessions/:sessionId/stream",
    aiRateLimiter,
    validate(streamMessageSchema),
    asyncHandler(controller.stream),
  );
  router.get(
    "/sessions/:sessionId/messages",
    asyncHandler(controller.getMessages),
  );
  router.delete("/sessions/:sessionId", asyncHandler(controller.deleteSession));
  router.post(
    "/sessions/:sessionId/feedback",
    validate(submitFeedbackSchema),
    asyncHandler(controller.submitFeedback),
  );
}
