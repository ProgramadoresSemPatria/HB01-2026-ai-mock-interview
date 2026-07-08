import { ReviewSessionsController } from "@/modules/review-sessions/controller/review-sessions-controller";

import { makeReviewSessionStreamService } from "./review-session-stream-service-factory";
import { makeReviewSessionsService } from "./review-sessions-service-factory";

export function makeReviewSessionsController(): ReviewSessionsController {
  return new ReviewSessionsController(
    makeReviewSessionsService(),
    makeReviewSessionStreamService(),
  );
}
