import {
  createSessionSchema,
  streamMessageSchema,
} from "@/modules/interview/validations/interview-schemas";
import { asyncHandler, validate } from "@/shared";
import type { Router } from "express";

import { makeInterviewController } from "@/factories/interview/interview-controller-factory";

export default function interviewRoutes(router: Router): void {
  const controller = makeInterviewController();

  router.post(
    "/sessions",
    validate(createSessionSchema),
    asyncHandler(controller.createSession),
  );
  router.get("/sessions", asyncHandler(controller.listSessions));
  router.post(
    "/sessions/:sessionId/stream",
    validate(streamMessageSchema),
    asyncHandler(controller.stream),
  );
  router.get(
    "/sessions/:sessionId/messages",
    asyncHandler(controller.getMessages),
  );
}
