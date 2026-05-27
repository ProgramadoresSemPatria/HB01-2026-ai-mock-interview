import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Response } from "express";

import type { IInterviewGraph } from "@/modules/interview/protocols/interview-graph";
import type { IReviewItemsGenerator } from "@/modules/interview/protocols/review-items-generator";
import type { MessageRepository } from "@/modules/interview/repository/message-repository";
import type { SessionRepository } from "@/modules/interview/repository/session-repository";
import type { ReviewMergeService } from "@/modules/interview/service/review-merge-service";
import type { ResumeRepository } from "@/modules/resumes/repository/resume-repository";
import { ConflictError, NotFoundError } from "@/shared";

import { InterviewStreamService } from "./stream-service";

const structuredSummary = {
  personal_info: {
    name: "Jane Doe",
    title: "Engineer",
  },
  skills: ["TypeScript"],
  experiences: [
    {
      company: "Acme",
      role: "Developer",
      highlights: ["Built APIs"],
    },
  ],
  projects: [{ name: "Portfolio" }],
};

const baseSession = {
  id: "session-1",
  userId: 1,
  resumeId: "resume-1",
  level: "entry" as const,
  turnCount: 0,
  maxTurns: 5,
  isFinished: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

function createMockResponse() {
  const listeners = new Map<string, Set<() => void>>();
  const chunks: string[] = [];

  const res = {
    writeHead: vi.fn(),
    write: vi.fn((chunk: string) => {
      chunks.push(chunk);
    }),
    end: vi.fn(),
    on: vi.fn((event: string, handler: () => void) => {
      const set = listeners.get(event) ?? new Set();
      set.add(handler);
      listeners.set(event, set);
    }),
    off: vi.fn((event: string, handler: () => void) => {
      listeners.get(event)?.delete(handler);
    }),
    emitClose: () => {
      for (const handler of listeners.get("close") ?? []) {
        handler();
      }
    },
    chunks,
  };

  return res as unknown as Response & {
    writeHead: ReturnType<typeof vi.fn>;
    write: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    emitClose: () => void;
    chunks: string[];
  };
}

describe("InterviewStreamService", () => {
  let sessionRepository: SessionRepository;
  let messageRepository: MessageRepository;
  let resumeRepository: ResumeRepository;
  let graph: IInterviewGraph;
  let reviewMergeService: ReviewMergeService;
  let reviewItemsGenerator: IReviewItemsGenerator;
  let service: InterviewStreamService;

  beforeEach(() => {
    sessionRepository = {
      findByIdAndUserId: vi.fn(),
      incrementTurnCount: vi.fn(),
      markFinished: vi.fn(),
    } as unknown as SessionRepository;

    messageRepository = {
      createHuman: vi.fn(),
      createAi: vi.fn(),
      listBySessionId: vi.fn(),
    } as unknown as MessageRepository;

    resumeRepository = {
      findByIdAndUserId: vi.fn(),
    } as unknown as ResumeRepository;

    graph = {
      streamMessages: vi.fn(),
    };

    reviewMergeService = {
      upsertItems: vi.fn(),
    } as unknown as ReviewMergeService;

    reviewItemsGenerator = {
      generate: vi.fn(),
    };

    service = new InterviewStreamService(
      sessionRepository,
      messageRepository,
      resumeRepository,
      graph,
      reviewMergeService,
      reviewItemsGenerator,
    );
  });

  it("throws ConflictError before SSE when session is finished", async () => {
    vi.mocked(sessionRepository.findByIdAndUserId).mockResolvedValue({
      ...baseSession,
      isFinished: true,
    });

    const res = createMockResponse();

    await expect(
      service.streamTurn(1, baseSession.id, "Hello", res),
    ).rejects.toBeInstanceOf(ConflictError);

    expect(res.writeHead).not.toHaveBeenCalled();
  });

  it("throws ConflictError before SSE when turnCount >= maxTurns", async () => {
    vi.mocked(sessionRepository.findByIdAndUserId).mockResolvedValue({
      ...baseSession,
      turnCount: 5,
      maxTurns: 5,
    });

    const res = createMockResponse();

    await expect(
      service.streamTurn(1, baseSession.id, "Hello", res),
    ).rejects.toBeInstanceOf(ConflictError);

    expect(res.writeHead).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when session does not belong to user", async () => {
    vi.mocked(sessionRepository.findByIdAndUserId).mockResolvedValue(null);

    const res = createMockResponse();

    await expect(
      service.streamTurn(1, baseSession.id, "Hello", res),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("streams tokens, meta, and DONE on success", async () => {
    vi.mocked(sessionRepository.findByIdAndUserId).mockResolvedValue(
      baseSession,
    );
    vi.mocked(resumeRepository.findByIdAndUserId).mockResolvedValue({
      id: "resume-1",
      structuredSummary,
    } as unknown as Awaited<ReturnType<ResumeRepository["findByIdAndUserId"]>>);
    vi.mocked(graph.streamMessages).mockReturnValue(
      (async function* () {
        yield { content: "Hi " };
        yield { content: "there" };
      })(),
    );
    vi.mocked(sessionRepository.incrementTurnCount).mockResolvedValue({
      ...baseSession,
      turnCount: 1,
    });
    vi.mocked(messageRepository.createHuman).mockResolvedValue({} as never);
    vi.mocked(messageRepository.createAi).mockResolvedValue({} as never);

    const res = createMockResponse();

    await service.streamTurn(1, baseSession.id, "Hello", res);

    expect(graph.streamMessages).toHaveBeenCalledWith(
      expect.objectContaining({ runReview: false }),
      { threadId: baseSession.id },
    );

    const output = res.chunks.join("");
    expect(output).toContain("event: token");
    expect(output).toContain('"content":"Hi "');
    expect(output).toContain("event: meta");
    expect(output).toContain('"turnCount":1');
    expect(output).toContain("data: [DONE]");
    expect(messageRepository.createAi).toHaveBeenCalledWith({
      sessionId: baseSession.id,
      userId: 1,
      content: "Hi there",
    });
    expect(res.end).toHaveBeenCalled();
  });

  it("runs review merge and marks finished on final turn", async () => {
    vi.mocked(sessionRepository.findByIdAndUserId).mockResolvedValue({
      ...baseSession,
      turnCount: 4,
      maxTurns: 5,
    });
    vi.mocked(resumeRepository.findByIdAndUserId).mockResolvedValue({
      id: "resume-1",
      structuredSummary,
    } as unknown as Awaited<ReturnType<ResumeRepository["findByIdAndUserId"]>>);
    vi.mocked(graph.streamMessages).mockReturnValue(
      (async function* () {
        yield { content: "Final answer" };
      })(),
    );
    vi.mocked(sessionRepository.incrementTurnCount).mockResolvedValue({
      ...baseSession,
      turnCount: 5,
    });
    vi.mocked(messageRepository.listBySessionId).mockResolvedValue([
      {
        id: "m1",
        role: "human",
        content: "Hello",
        createdAt: new Date(),
      },
      {
        id: "m2",
        role: "ai",
        content: "Final answer",
        createdAt: new Date(),
      },
    ] as Awaited<ReturnType<MessageRepository["listBySessionId"]>>);
    vi.mocked(reviewItemsGenerator.generate).mockResolvedValue({
      items: [
        {
          topic: "Communication",
          description: "Be concise",
          priority: "medium",
        },
      ],
    });
    vi.mocked(messageRepository.createHuman).mockResolvedValue({} as never);
    vi.mocked(messageRepository.createAi).mockResolvedValue({} as never);

    const res = createMockResponse();

    await service.streamTurn(1, baseSession.id, "Hello", res);

    expect(graph.streamMessages).toHaveBeenCalledWith(
      expect.objectContaining({ runReview: true }),
      { threadId: baseSession.id },
    );
    expect(reviewItemsGenerator.generate).toHaveBeenCalled();
    expect(reviewMergeService.upsertItems).toHaveBeenCalledWith(
      1,
      baseSession.id,
      [
        {
          topic: "Communication",
          description: "Be concise",
          priority: "medium",
        },
      ],
    );
    expect(sessionRepository.markFinished).toHaveBeenCalledWith(baseSession.id);

    const output = res.chunks.join("");
    expect(output).toContain('"isFinished":true');
  });

  it("does not persist partial AI message when client disconnects", async () => {
    let resumeSecondChunk: () => void = () => undefined;

    vi.mocked(sessionRepository.findByIdAndUserId).mockResolvedValue(
      baseSession,
    );
    vi.mocked(resumeRepository.findByIdAndUserId).mockResolvedValue({
      id: "resume-1",
      structuredSummary,
    } as unknown as Awaited<ReturnType<ResumeRepository["findByIdAndUserId"]>>);
    vi.mocked(graph.streamMessages).mockReturnValue(
      (async function* () {
        yield { content: "Partial" };
        await new Promise<void>((resolve) => {
          resumeSecondChunk = resolve;
        });
        yield { content: "More" };
      })(),
    );
    vi.mocked(messageRepository.createHuman).mockResolvedValue({} as never);

    const res = createMockResponse();

    const streamPromise = service.streamTurn(
      1,
      baseSession.id,
      "Hello",
      res,
    );

    await vi.waitFor(() => {
      expect(res.chunks.join("")).toContain("Partial");
    });
    res.emitClose();
    resumeSecondChunk();
    await streamPromise;

    expect(messageRepository.createAi).not.toHaveBeenCalled();
    expect(sessionRepository.incrementTurnCount).not.toHaveBeenCalled();
  });

  it("emits error SSE event and DONE when graph stream fails", async () => {
    vi.mocked(sessionRepository.findByIdAndUserId).mockResolvedValue(
      baseSession,
    );
    vi.mocked(resumeRepository.findByIdAndUserId).mockResolvedValue({
      id: "resume-1",
      structuredSummary,
    } as unknown as Awaited<ReturnType<ResumeRepository["findByIdAndUserId"]>>);
    vi.mocked(graph.streamMessages).mockReturnValue(
      (async function* () {
        yield { content: "Partial" };
        throw new Error("OpenAI rate limit");
      })(),
    );
    vi.mocked(messageRepository.createHuman).mockResolvedValue({} as never);

    const res = createMockResponse();

    await service.streamTurn(1, baseSession.id, "Hello", res);

    const output = res.chunks.join("");
    expect(output).toContain("event: token");
    expect(output).toContain("event: error");
    expect(output).toContain('"message":"OpenAI rate limit"');
    expect(output).toContain("data: [DONE]");
    expect(messageRepository.createAi).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalled();
  });

  it("emits error SSE event when review generation fails on final turn", async () => {
    vi.mocked(sessionRepository.findByIdAndUserId).mockResolvedValue({
      ...baseSession,
      turnCount: 4,
      maxTurns: 5,
    });
    vi.mocked(resumeRepository.findByIdAndUserId).mockResolvedValue({
      id: "resume-1",
      structuredSummary,
    } as unknown as Awaited<ReturnType<ResumeRepository["findByIdAndUserId"]>>);
    vi.mocked(graph.streamMessages).mockReturnValue(
      (async function* () {
        yield { content: "Final answer" };
      })(),
    );
    vi.mocked(sessionRepository.incrementTurnCount).mockResolvedValue({
      ...baseSession,
      turnCount: 5,
    });
    vi.mocked(messageRepository.listBySessionId).mockResolvedValue([]);
    vi.mocked(reviewItemsGenerator.generate).mockRejectedValue(
      new Error("Review model unavailable"),
    );
    vi.mocked(messageRepository.createHuman).mockResolvedValue({} as never);
    vi.mocked(messageRepository.createAi).mockResolvedValue({} as never);

    const res = createMockResponse();

    await service.streamTurn(1, baseSession.id, "Hello", res);

    const output = res.chunks.join("");
    expect(output).toContain("event: error");
    expect(output).toContain('"message":"Review model unavailable"');
    expect(output).toContain("data: [DONE]");
    expect(output).not.toContain("event: meta");
    expect(sessionRepository.markFinished).not.toHaveBeenCalled();
  });
});
