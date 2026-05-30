import prisma from "@/infrastructure/database";
import type { ReviewItemRecord } from "@/modules/interview/types/review-item-record";
import type { ReviewPriority } from "@/modules/interview/validations/interview-schemas";
import type { ReviewItem as PrismaReviewItem } from "../../../../prisma/generated/client";

export type UpsertReviewItemParams = {
  userId: number;
  sessionId: string;
  topic: string;
  description: string;
  priority: ReviewPriority;
};

function normalizeTopic(topic: string): string {
  return topic.toLowerCase();
}

function toReviewItemRecord(row: PrismaReviewItem): ReviewItemRecord {
  return {
    id: row.id,
    userId: row.userId,
    sessionId: row.sessionId,
    topic: row.topic,
    description: row.description,
    priority: row.priority as ReviewPriority,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const TOPIC_SIMILARITY_THRESHOLD = 0.7;

export class ReviewRepository {
  async listByUserId(userId: number): Promise<ReviewItemRecord[]> {
    const rows = await prisma.reviewItem.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(toReviewItemRecord);
  }

  async findByUserIdAndTopicCaseInsensitive(
    userId: number,
    topic: string,
  ): Promise<ReviewItemRecord | null> {
    const row = await prisma.reviewItem.findFirst({
      where: {
        userId,
        topic: normalizeTopic(topic),
      },
    });
    return row ? toReviewItemRecord(row) : null;
  }

  async findSimilarByUserIdAndTopic(
    userId: number,
    topic: string,
    threshold: number = TOPIC_SIMILARITY_THRESHOLD,
  ): Promise<ReviewItemRecord | null> {
    const normalizedTopic = normalizeTopic(topic);
    const matches = await prisma.$queryRaw<PrismaReviewItem[]>`
      SELECT *
      FROM "review_items"
      WHERE "user_id" = ${userId}
        AND similarity("topic", ${normalizedTopic}) >= ${threshold}
      ORDER BY similarity("topic", ${normalizedTopic}) DESC
      LIMIT 1
    `;

    const row = matches[0];
    return row ? toReviewItemRecord(row) : null;
  }

  async upsert(params: UpsertReviewItemParams): Promise<ReviewItemRecord> {
    const { userId, sessionId, description, priority } = params;
    const topic = normalizeTopic(params.topic);

    const row = await prisma.reviewItem.upsert({
      where: {
        userId_topic: { userId, topic },
      },
      create: {
        userId,
        sessionId,
        topic,
        description,
        priority,
      },
      update: {
        sessionId,
        description,
        priority,
      },
    });
    return toReviewItemRecord(row);
  }
}
