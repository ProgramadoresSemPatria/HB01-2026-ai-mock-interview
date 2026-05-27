import { Worker } from "bullmq";

import {
  RESUME_QUEUE_NAME,
  redisConnection,
} from "@/infrastructure/queue/resume-queue";
import type { ResumeJobData } from "@/infrastructure/queue/resume-queue";
import { makeResumeProcessor } from "@/factories/resumes/resume-processor-factory";
import { logger } from "@/shared";

const connection = redisConnection;

const processor = makeResumeProcessor();

const worker = new Worker<ResumeJobData>(
  RESUME_QUEUE_NAME,
  async (job) => {
    await processor.process(job.data.resumeId);
  },
  {
    connection,
    concurrency: 1,
  },
);

worker.on("completed", (job) => {
  logger.info(`Resume job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  logger.warn(
    `Resume job ${job?.id ?? "unknown"} failed: ${error.message}`,
  );
});

logger.info("Resume worker started");
