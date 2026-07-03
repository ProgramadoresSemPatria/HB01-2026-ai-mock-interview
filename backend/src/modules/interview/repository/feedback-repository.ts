import prisma from "@/infrastructure/database";
import type {
  FeedbackRating,
  InterviewFeedback,
} from "../../../../prisma/generated/client";

export type UpsertFeedbackParams = {
  sessionId: string;
  userId: number;
  rating: FeedbackRating;
  comment?: string | null;
};

export class FeedbackRepository {
  async upsert(params: UpsertFeedbackParams): Promise<InterviewFeedback> {
    const { sessionId, userId, rating, comment } = params;

    return prisma.interviewFeedback.upsert({
      where: {
        sessionId_userId: { sessionId, userId },
      },
      create: {
        sessionId,
        userId,
        rating,
        comment,
      },
      update: {
        rating,
        comment,
      },
    });
  }
}
