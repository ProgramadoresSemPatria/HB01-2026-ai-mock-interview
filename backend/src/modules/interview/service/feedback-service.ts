import type { FeedbackRepository } from "@/modules/interview/repository/feedback-repository";
import type { SessionRepository } from "@/modules/interview/repository/session-repository";
import type { SubmitFeedbackInput } from "@/modules/interview/validations/interview-schemas";
import { NotFoundError } from "@/shared";
import type { InterviewFeedback } from "../../../../prisma/generated/client";

export class FeedbackService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly feedbackRepository: FeedbackRepository,
  ) {}

  async submit(
    userId: number,
    sessionId: string,
    input: SubmitFeedbackInput,
  ): Promise<InterviewFeedback> {
    const session = await this.sessionRepository.findByIdAndUserId(
      sessionId,
      userId,
    );

    if (!session) {
      throw new NotFoundError();
    }

    return this.feedbackRepository.upsert({
      sessionId,
      userId,
      rating: input.rating,
      comment: input.comment,
    });
  }
}
