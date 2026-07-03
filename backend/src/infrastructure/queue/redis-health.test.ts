import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pingMock: vi.fn(),
}));

vi.mock("./resume-queue", () => ({
  redisConnection: {
    ping: mocks.pingMock,
  },
}));

import { pingRedis } from "./redis-health";

describe("pingRedis", () => {
  it("pings the redis connection", async () => {
    mocks.pingMock.mockResolvedValueOnce("PONG");

    await pingRedis();

    expect(mocks.pingMock).toHaveBeenCalledOnce();
  });

  it("propagates redis errors", async () => {
    mocks.pingMock.mockRejectedValueOnce(new Error("connection refused"));

    await expect(pingRedis()).rejects.toThrow("connection refused");
  });
});
