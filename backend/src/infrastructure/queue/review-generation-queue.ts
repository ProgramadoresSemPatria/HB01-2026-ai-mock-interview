import { Queue } from "bullmq";

import type { ReviewGenerationJobData } from "@/modules/interview/protocols/review-generation-queue";

import { redisConnection } from "./resume-queue";

export type { ReviewGenerationJobData };

export const REVIEW_GENERATION_QUEUE_NAME = "review-generation";
const REVIEW_GENERATION_JOB_NAME = "generate";

const connection = redisConnection;

const reviewGenerationQueue = new Queue<
  ReviewGenerationJobData,
  void,
  typeof REVIEW_GENERATION_JOB_NAME
>(REVIEW_GENERATION_QUEUE_NAME, { connection });

export async function add({
  sessionId,
}: {
  sessionId: string;
}): Promise<void> {
  await reviewGenerationQueue.add(
    REVIEW_GENERATION_JOB_NAME,
    { sessionId },
    {
      jobId: sessionId,
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}

export async function remove(sessionId: string): Promise<void> {
  await reviewGenerationQueue.remove(sessionId);
}
