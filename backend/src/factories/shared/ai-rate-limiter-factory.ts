import type Redis from "ioredis";
import type { RequestHandler } from "express";
import { RedisStore, type RedisReply } from "rate-limit-redis";

import { redisConnection } from "@/infrastructure/queue/resume-queue";
import { makeAiRateLimiter as createAiRateLimiter } from "@/shared/middlewares/rate-limit-middleware";

export function makeAiRateLimiter(): RequestHandler {
  const store = new RedisStore({
    sendCommand: (command, ...args) =>
      (redisConnection as Redis).call(
        command,
        ...args,
      ) as Promise<RedisReply>,
    prefix: "rl:ai:",
  });

  return createAiRateLimiter(store);
}
