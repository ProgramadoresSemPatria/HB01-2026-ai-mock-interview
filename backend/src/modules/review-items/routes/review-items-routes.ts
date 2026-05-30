import { asyncHandler } from "@/shared";
import type { Router } from "express";

import { makeReviewItemsController } from "@/factories/review-items/review-items-controller-factory";

export default function reviewItemsRoutes(router: Router): void {
  const controller = makeReviewItemsController();

  router.get("/", asyncHandler(controller.list));
}
