import { ReviewItemsController } from "@/modules/review-items/controller/review-items-controller";

import { makeReviewItemsService } from "./review-items-service-factory";

export function makeReviewItemsController(): ReviewItemsController {
  return new ReviewItemsController(makeReviewItemsService());
}
