import type { RequestHandler } from "express";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redisCallMock: vi.fn(),
  createAiRateLimiterMock: vi.fn(),
  redisStoreOptions: [] as Array<{
    prefix?: string;
    sendCommand: (command: string, ...args: string[]) => Promise<unknown>;
  }>,
}));

vi.mock("@/infrastructure/queue/resume-queue", () => ({
  redisConnection: {
    call: mocks.redisCallMock,
  },
}));

vi.mock("rate-limit-redis", () => ({
  RedisStore: class MockRedisStore {
    prefix: string;

    constructor(options: {
      prefix?: string;
      sendCommand: (command: string, ...args: string[]) => Promise<unknown>;
    }) {
      mocks.redisStoreOptions.push(options);
      this.prefix = options.prefix ?? "";
    }
  },
}));

vi.mock("@/shared/middlewares/rate-limit-middleware", () => ({
  makeAiRateLimiter: mocks.createAiRateLimiterMock,
}));

import { makeAiRateLimiter } from "./ai-rate-limiter-factory";

describe("makeAiRateLimiter factory", () => {
  it("constructs RedisStore with prefix rl:ai:", () => {
    const stubHandler = vi.fn() as unknown as RequestHandler;
    mocks.createAiRateLimiterMock.mockReturnValue(stubHandler);
    mocks.redisStoreOptions.length = 0;

    const limiter = makeAiRateLimiter();

    expect(mocks.redisStoreOptions).toHaveLength(1);
    expect(mocks.redisStoreOptions[0]?.prefix).toBe("rl:ai:");
    expect(mocks.createAiRateLimiterMock).toHaveBeenCalledOnce();
    expect(limiter).toBe(stubHandler);
  });

  it("routes sendCommand through redisConnection.call", async () => {
    mocks.redisCallMock.mockResolvedValueOnce("OK");
    mocks.createAiRateLimiterMock.mockReturnValue(vi.fn() as RequestHandler);
    mocks.redisStoreOptions.length = 0;

    makeAiRateLimiter();

    const { sendCommand } = mocks.redisStoreOptions[0]!;
    await sendCommand("PING");

    expect(mocks.redisCallMock).toHaveBeenCalledWith("PING");
  });
});
