import { Queue } from "bullmq";

import { redisConnection } from "./resume-queue";

export type WeakAnswerJobData = {
  sessionId: string;
};

export const WEAK_ANSWER_QUEUE_NAME = "weak-answer-generation";
const WEAK_ANSWER_JOB_NAME = "generate";

const connection = redisConnection;

const weakAnswerQueue = new Queue<
  WeakAnswerJobData,
  void,
  typeof WEAK_ANSWER_JOB_NAME
>(WEAK_ANSWER_QUEUE_NAME, { connection });

export async function add({
  sessionId,
}: {
  sessionId: string;
}): Promise<void> {
  await weakAnswerQueue.add(
    WEAK_ANSWER_JOB_NAME,
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
