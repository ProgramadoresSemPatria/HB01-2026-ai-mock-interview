import { Worker } from "bullmq";

import {
  RESUME_QUEUE_NAME,
  redisConnection,
} from "@/infrastructure/queue/resume-queue";
import type { ResumeJobData } from "@/infrastructure/queue/resume-queue";
import { WEAK_ANSWER_QUEUE_NAME } from "@/infrastructure/queue/weak-answer-queue";
import type { WeakAnswerJobData } from "@/infrastructure/queue/weak-answer-queue";
import { makeResumeService } from "@/factories/resumes/resume-service-factory";
import { makeWeakAnswerGenerationService } from "@/factories/interview/weak-answer-generation-service-factory";
import type { WeakAnswerGenerationResult } from "@/modules/interview/service/weak-answer-generation-service";
import type {
  ResumeProcessResult,
  ResumeService,
} from "@/modules/resumes/service/resume-service";
import { logger } from "@/shared";

export async function processResumeJob(
  resumeId: string,
  resumeService: Pick<ResumeService, "process">,
): Promise<ResumeProcessResult> {
  return resumeService.process(resumeId);
}

export async function processWeakAnswerJob(
  sessionId: string,
  weakAnswerGenerationService: {
    process(sessionId: string): Promise<WeakAnswerGenerationResult>;
  },
): Promise<WeakAnswerGenerationResult> {
  return weakAnswerGenerationService.process(sessionId);
}

export function logResumeJobResult(
  jobId: string | number | undefined,
  result: ResumeProcessResult,
): void {
  const jobLabel = jobId ?? "unknown";

  switch (result.status) {
    case "ready":
      logger.info(
        `Resume job ${jobLabel} succeeded (resume ${result.resumeId})`,
      );
      break;
    case "failed": {
      const meta: Record<string, string> = {
        resumeId: result.resumeId,
        error: result.error,
      };

      if (result.cause instanceof Error && result.cause.stack) {
        meta.stack = result.cause.stack;
      }

      logger.error(
        `Resume job ${jobLabel} failed (resume ${result.resumeId}): ${result.error}`,
        meta,
      );
      break;
    }
    case "skipped":
      logger.warn(
        `Resume job ${jobLabel} skipped: resume ${result.resumeId} not found`,
      );
      break;
  }
}

export function logWeakAnswerJobResult(
  jobId: string | number | undefined,
  result: WeakAnswerGenerationResult,
): void {
  const jobLabel = jobId ?? "unknown";

  switch (result.status) {
    case "ready":
      logger.info(
        `Weak answer job ${jobLabel} succeeded (session ${result.sessionId})`,
      );
      break;
    case "skipped":
      logger.warn(
        `Weak answer job ${jobLabel} skipped (session ${result.sessionId}): ${result.reason}`,
      );
      break;
  }
}

const connection = redisConnection;

const resumeService = makeResumeService();

const worker = new Worker<ResumeJobData>(
  RESUME_QUEUE_NAME,
  async (job) => {
    logger.info("Processing resume job", { jobId: job.id });
    const result = await processResumeJob(job.data.resumeId, resumeService);
    logResumeJobResult(job.id, result);
  },
  {
    connection,
    concurrency: 1,
  },
);

worker.on("failed", (job, error) => {
  const meta: Record<string, string> = { error: error.message };

  if (error.stack) {
    meta.stack = error.stack;
  }

  logger.error(
    `Resume job ${job?.id ?? "unknown"} crashed unexpectedly: ${error.message}`,
    meta,
  );
});

logger.info("Resume worker started");

const weakAnswerGenerationService = makeWeakAnswerGenerationService();

const weakAnswerWorker = new Worker<WeakAnswerJobData>(
  WEAK_ANSWER_QUEUE_NAME,
  async (job) => {
    logger.info("Processing weak answer job", { jobId: job.id });
    const result = await processWeakAnswerJob(
      job.data.sessionId,
      weakAnswerGenerationService,
    );
    logWeakAnswerJobResult(job.id, result);
  },
  {
    connection,
    concurrency: 1,
  },
);

weakAnswerWorker.on("failed", (job, error) => {
  const meta: Record<string, string> = { error: error.message };

  if (error.stack) {
    meta.stack = error.stack;
  }

  logger.error(
    `Weak answer job ${job?.id ?? "unknown"} crashed unexpectedly: ${error.message}`,
    meta,
  );
});

logger.info("Weak answer worker started");
