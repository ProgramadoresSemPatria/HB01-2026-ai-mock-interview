import { asyncHandler } from "@/shared";
import type { Router } from "express";

import { makeWeakAnswersController } from "@/factories/weak-answers/weak-answers-controller-factory";

export default function weakAnswersRoutes(router: Router): void {
  const controller = makeWeakAnswersController();

  router.get("/", asyncHandler(controller.list));
  router.delete("/:id", asyncHandler(controller.remove));
}
