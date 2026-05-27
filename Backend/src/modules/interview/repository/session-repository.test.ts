import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  interviewSession: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
}));

vi.mock("@/infrastructure/database", () => ({
  default: mockPrisma,
}));

import {
  MAX_TURNS_BY_LEVEL,
  SessionRepository,
} from "./session-repository";

const sampleSession = {
  id: "session-id",
  userId: 1,
  resumeId: "resume-id",
  level: "entry" as const,
  turnCount: 0,
  maxTurns: 5,
  isFinished: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("SessionRepository", () => {
  const repository = new SessionRepository();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["entry", 5],
    ["mid", 7],
    ["senior", 8],
  ] as const)("create sets maxTurns to %i for level %s", async (level, maxTurns) => {
    const params = {
      userId: sampleSession.userId,
      resumeId: sampleSession.resumeId,
      level,
    };
    mockPrisma.interviewSession.create.mockResolvedValue({
      ...sampleSession,
      level,
      maxTurns,
    });

    const result = await repository.create(params);

    expect(mockPrisma.interviewSession.create).toHaveBeenCalledWith({
      data: {
        ...params,
        maxTurns: MAX_TURNS_BY_LEVEL[level],
      },
    });
    expect(result.maxTurns).toBe(maxTurns);
  });

  it("listByUserId returns sessions for the user ordered by createdAt desc", async () => {
    const sessions = [sampleSession];
    mockPrisma.interviewSession.findMany.mockResolvedValue(sessions);

    const result = await repository.listByUserId(sampleSession.userId);

    expect(mockPrisma.interviewSession.findMany).toHaveBeenCalledWith({
      where: { userId: sampleSession.userId },
      orderBy: { createdAt: "desc" },
    });
    expect(result).toEqual(sessions);
  });

  it("findByIdAndUserId filters by id and userId", async () => {
    mockPrisma.interviewSession.findFirst.mockResolvedValue(sampleSession);

    const result = await repository.findByIdAndUserId(
      sampleSession.id,
      sampleSession.userId,
    );

    expect(mockPrisma.interviewSession.findFirst).toHaveBeenCalledWith({
      where: { id: sampleSession.id, userId: sampleSession.userId },
    });
    expect(result).toEqual(sampleSession);
  });
});
