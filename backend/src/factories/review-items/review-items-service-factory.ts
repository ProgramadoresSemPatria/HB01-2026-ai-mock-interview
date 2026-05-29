import { ReviewRepository } from "@/modules/interview/repository/review-repository";
import { ReviewItemsService } from "@/modules/review-items/service/review-items-service";

export function makeReviewItemsService(): ReviewItemsService {
  return new ReviewItemsService(new ReviewRepository());
}
