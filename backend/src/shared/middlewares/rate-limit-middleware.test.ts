import express from "express";
import { MemoryStore, type Store } from "express-rate-limit";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { errorHandler } from "./error-handler-middleware";

vi.mock("@/config/env", () => ({
  env: {
    RATE_LIMIT_AI_WINDOW_MS: 60_000,
    RATE_LIMIT_AI_MAX: 2,
  },
}));

const { aiRateLimitKeyGenerator, makeAiRateLimiter } = await import(
  "./rate-limit-middleware"
);

describe("aiRateLimitKeyGenerator", () => {
  it("returns String(req.userId) when userId is set", () => {
    const req = { userId: 42 } as express.Request;
    expect(aiRateLimitKeyGenerator(req)).toBe("42");
  });

  it("throws when req.userId is undefined", () => {
    const req = {} as express.Request;
    expect(() => aiRateLimitKeyGenerator(req)).toThrow(
      "aiRateLimiter: req.userId is not set",
    );
  });
});

describe("makeAiRateLimiter", () => {
  it("returns 429 after the configured max requests", async () => {
    const app = express();
    const limiter = makeAiRateLimiter(new MemoryStore());

    app.use((req, _res, next) => {
      req.userId = 1;
      next();
    });
    app.get("/test", limiter, (_req, res) => {
      res.status(200).json({ ok: true });
    });

    await request(app).get("/test").expect(200);
    await request(app).get("/test").expect(200);

    const response = await request(app).get("/test").expect(429);

    expect(response.body).toEqual({
      message: "Too many requests, please try again later.",
    });
  });

  it("gives independent quotas per userId", async () => {
    const app = express();
    const limiter = makeAiRateLimiter(new MemoryStore());

    app.get(
      "/test",
      (req, _res, next) => {
        req.userId = Number(req.query.userId);
        next();
      },
      limiter,
      (_req, res) => {
        res.status(200).json({ ok: true });
      },
    );

    await request(app).get("/test?userId=1").expect(200);
    await request(app).get("/test?userId=1").expect(200);
    await request(app).get("/test?userId=1").expect(429);

    await request(app).get("/test?userId=2").expect(200);
    await request(app).get("/test?userId=2").expect(200);
  });

  it("returns 500 via errorHandler when store.increment rejects", async () => {
    const failingStore: Store = {
      increment: () => Promise.reject(new Error("store down")),
      decrement: () => {},
      resetKey: () => {},
    };
    const limiter = makeAiRateLimiter(failingStore);

    const app = express();
    app.use((req, _res, next) => {
      req.userId = 1;
      next();
    });
    app.get("/test", limiter, (_req, res) => {
      res.status(200).json({ ok: true });
    });
    app.use(errorHandler);

    const response = await request(app).get("/test").expect(500);

    expect(response.body).toEqual({ message: "Internal Server Error" });
  });

  it("returns 500 when req.userId is missing (no IP fallback)", async () => {
    const app = express();
    const limiter = makeAiRateLimiter(new MemoryStore());

    app.get("/test", limiter, (_req, res) => {
      res.status(200).json({ ok: true });
    });
    app.use(errorHandler);

    const response = await request(app).get("/test").expect(500);

    expect(response.body).toEqual({ message: "Internal Server Error" });
  });
});
