import { Worker } from "bullmq";

import {
  RESUME_QUEUE_NAME,
  redisConnection,
} from "@/infrastructure/queue/resume-queue";
import type { ResumeJobData } from "@/infrastructure/queue/resume-queue";
import { REVIEW_GENERATION_QUEUE_NAME } from "@/infrastructure/queue/review-generation-queue";
import type { ReviewGenerationJobData } from "@/modules/interview/protocols/review-generation-queue";
import { makeResumeService } from "@/factories/resumes/resume-service-factory";
import { makeReviewGenerationService } from "@/factories/interview/review-generation-service-factory";
import { SessionRepository } from "@/modules/interview/repository/session-repository";
import type {
  ReviewGenerationProcessResult,
  ReviewGenerationService,
} from "@/modules/interview/service/review-generation-service";
import type {
  ResumeProcessResult,
  ResumeService,
} from "@/modules/resumes/service/resume-service";
import { logger, setupProcessErrorHandlers } from "@/shared";

setupProcessErrorHandlers();

export async function processResumeJob(
  resumeId: string,
  resumeService: Pick<ResumeService, "process">,
): Promise<ResumeProcessResult> {
  return resumeService.process(resumeId);
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

export async function processReviewJob(
  sessionId: string,
  reviewGenerationService: Pick<ReviewGenerationService, "process">,
): Promise<ReviewGenerationProcessResult> {
  return reviewGenerationService.process(sessionId);
}

export function logReviewJobResult(
  jobId: string | number | undefined,
  result: ReviewGenerationProcessResult,
): void {
  const jobLabel = jobId ?? "unknown";

  switch (result.status) {
    case "ready":
      logger.info(
        `Review job ${jobLabel} succeeded (session ${result.sessionId})`,
      );
      break;
    case "failed": {
      const meta: Record<string, string> = {
        sessionId: result.sessionId,
        error: result.error,
      };

      if (result.cause instanceof Error && result.cause.stack) {
        meta.stack = result.cause.stack;
      }

      logger.error(
        `Review job ${jobLabel} failed (session ${result.sessionId}): ${result.error}`,
        meta,
      );
      break;
    }
    case "skipped":
      logger.warn(
        `Review job ${jobLabel} skipped: session ${result.sessionId} (${result.reason})`,
      );
      break;
  }
}

export async function handleReviewJobExhaustedFailure(
  sessionId: string,
  error: Error,
  sessionRepository: Pick<SessionRepository, "markReviewGenerationFailed">,
): Promise<void> {
  await sessionRepository.markReviewGenerationFailed(sessionId, error.message);
}

const connection = redisConnection;

const resumeService = makeResumeService();
const reviewGenerationService = makeReviewGenerationService();
const sessionRepository = new SessionRepository();

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

const reviewWorker = new Worker<ReviewGenerationJobData>(
  REVIEW_GENERATION_QUEUE_NAME,
  async (job) => {
    logger.info("Processing review-generation job", { jobId: job.id });
    const result = await processReviewJob(
      job.data.sessionId,
      reviewGenerationService,
    );
    logReviewJobResult(job.id, result);
  },
  {
    connection,
    concurrency: 1,
  },
);

reviewWorker.on("failed", async (job, error) => {
  const attempts = job?.opts.attempts ?? 1;
  if (job && job.attemptsMade >= attempts) {
    await handleReviewJobExhaustedFailure(
      job.data.sessionId,
      error,
      sessionRepository,
    );
  }

  const meta: Record<string, string> = { error: error.message };

  if (error.stack) {
    meta.stack = error.stack;
  }

  logger.error(
    `Review job ${job?.id ?? "unknown"} crashed unexpectedly: ${error.message}`,
    meta,
  );
});

logger.info("Resume worker started");
logger.info("Review generation worker started");
