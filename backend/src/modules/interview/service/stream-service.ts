import type { Response } from "express";

import type { IInterviewGraph } from "@/modules/interview/protocols/interview-graph";
import type { IReviewItemsGenerator } from "@/modules/interview/protocols/review-items-generator";
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
        isFinished: session.isFinished,
        runReview: isFinalTurn,
      },
      { threadId: sessionId },
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

          const completedAiMessage = result.value;
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

      const updatedSession =
        await this.sessionRepository.incrementTurnCount(sessionId);

      let isFinished = updatedSession.isFinished;

      if (isFinalTurn) {
        const messages =
          await this.messageRepository.listBySessionId(sessionId);
        const transcript = messages
          .map((message) => `${message.role}: ${message.content}`)
          .join("\n");

        const review = await this.reviewItemsGenerator.generate({
          userId,
          sessionId,
          transcript,
          structuredSummary: resumeSummary,
        });

        await this.reviewMergeService.upsertItems(
          userId,
          sessionId,
          review.items,
        );
        await this.sessionRepository.markFinished(sessionId);
        isFinished = true;
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
