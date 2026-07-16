import type { Response } from "express";

import { createUsageCaptureCallback } from "@/modules/token-usage/callbacks/token-usage-callback";
import type { TokenUsageService } from "@/modules/token-usage/service/token-usage-service";
import type { LlmUsage } from "@/modules/token-usage/types/llm-usage";
import type { IInterviewGraph } from "@/modules/interview/protocols/interview-graph";
import type { IReviewItemsGenerator } from "@/modules/interview/protocols/review-items-generator";
import type { IWeakAnswerQueue } from "@/modules/interview/protocols/weak-answer-queue";
import type { MessageRepository } from "@/modules/interview/repository/message-repository";
import type { SessionRepository } from "@/modules/interview/repository/session-repository";
import type { ReviewMergeService } from "@/modules/interview/service/review-merge-service";
import type { ResumeRepository } from "@/modules/resumes/repository/resume-repository";
import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";
import { ConflictError, NotFoundError } from "@/shared";
import { writeDone, writeEvent } from "@/shared/utils/sse";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;

export class InterviewStreamService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly messageRepository: MessageRepository,
    private readonly resumeRepository: ResumeRepository,
    private readonly graph: IInterviewGraph,
    private readonly reviewMergeService: ReviewMergeService,
    private readonly reviewItemsGenerator: IReviewItemsGenerator,
    private readonly weakAnswerQueue: IWeakAnswerQueue,
    private readonly tokenUsageService: TokenUsageService,
  ) {}

  async streamTurn(
    userId: number,
    sessionId: string,
    content: string,
    res: Response,
  ): Promise<void> {
    const session = await this.sessionRepository.findByIdAndUserId(
      sessionId,
      userId,
    );

    if (!session) {
      throw new NotFoundError();
    }

    if (session.isFinished || session.turnCount >= session.maxTurns) {
      throw new ConflictError("Interview session is finished");
    }

    const resume = await this.resumeRepository.findByIdAndUserId(
      session.resumeId,
      userId,
    );

    if (!resume?.structuredSummary) {
      throw new NotFoundError();
    }

    const resumeSummary = resume.structuredSummary as StructuredSummary;
    const isFinalTurn = session.turnCount + 1 >= session.maxTurns;

    await this.tokenUsageService.assertWithinLimit(userId);

    const interviewerUsageCapture = createUsageCaptureCallback();

    res.writeHead(200, SSE_HEADERS);
    res.flushHeaders();
    await this.messageRepository.createHuman({
      sessionId,
      userId,
      content,
    });

    let aborted = false;

    const onClose = (): void => {
      aborted = true;
    };

    res.on("close", onClose);

    const stream = this.graph.streamMessages(
      {
        messages: [{ role: "human", content }],
        turnCount: session.turnCount,
        maxTurns: session.maxTurns,
        level: session.level,
        userId,
        resumeSummary,
        jobDescription: session.jobDescription,
        isFinished: session.isFinished,
        runReview: isFinalTurn,
      },
      {
        threadId: sessionId,
        callbacks: [interviewerUsageCapture.callback],
      },
    );
    const iterator = stream[Symbol.asyncIterator]();

    const closeWithError = (message: string): void => {
      if (res.writableEnded) {
        return;
      }
      writeEvent(res, "error", { message });
      writeDone(res);
      res.end();
    };

    try {
      let completedAiMessage:
        | { content: string; usage?: LlmUsage }
        | undefined;

      while (true) {
        if (aborted) {
          return;
        }

        const result = await iterator.next();
        if (aborted) {
          return;
        }
        if (result.done) {
          if (aborted) {
            return;
          }

          completedAiMessage = result.value;
          if (!completedAiMessage?.content) {
            closeWithError("Interview response was not saved");
            return;
          }

          await this.messageRepository.createAi({
            sessionId,
            userId,
            content: completedAiMessage.content,
          });

          break;
        }

        writeEvent(res, "token", { content: result.value.content });
      }

      if (aborted) {
        return;
      }

      await this.tokenUsageService.recordUsage(
        userId,
        interviewerUsageCapture.getUsage() ?? completedAiMessage?.usage,
      );

      const updatedSession =
        await this.sessionRepository.incrementTurnCount(sessionId);

      let isFinished = updatedSession.isFinished;

      if (isFinalTurn) {
        await this.tokenUsageService.assertWithinLimit(userId);

        const messages =
          await this.messageRepository.listBySessionId(sessionId);
        const transcript = messages
          .map((message) => `${message.role}: ${message.content}`)
          .join("\n");

        const reviewUsageCapture = createUsageCaptureCallback();
        const review = await this.reviewItemsGenerator.generate(
          {
            userId,
            sessionId,
            transcript,
            structuredSummary: resumeSummary,
            jobDescription: session.jobDescription,
          },
          { callbacks: [reviewUsageCapture.callback] },
        );

        await this.tokenUsageService.recordUsage(
          userId,
          reviewUsageCapture.getUsage(),
        );

        await this.reviewMergeService.upsertItems(
          userId,
          sessionId,
          review.items,
        );

        await this.sessionRepository.markFinished(sessionId);
        isFinished = true;

        await this.weakAnswerQueue.add({ sessionId });
      }

      writeEvent(res, "meta", {
        turnCount: updatedSession.turnCount,
        maxTurns: session.maxTurns,
        isFinished,
      });
      writeDone(res);
      res.end();
    } catch (err) {
      if (!aborted) {
        const message =
          err instanceof Error ? err.message : "Interview stream failed";
        closeWithError(message);
      }
    } finally {
      res.off("close", onClose);
      await iterator.return?.(undefined);
    }
  }
}
