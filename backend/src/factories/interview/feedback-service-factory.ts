import { FeedbackRepository } from "@/modules/interview/repository/feedback-repository";
import { SessionRepository } from "@/modules/interview/repository/session-repository";
import { FeedbackService } from "@/modules/interview/service/feedback-service";

export function makeFeedbackService(): FeedbackService {
  return new FeedbackService(new SessionRepository(), new FeedbackRepository());
}
