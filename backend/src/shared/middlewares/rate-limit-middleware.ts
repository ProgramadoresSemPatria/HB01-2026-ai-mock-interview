import { env } from "@/config/env";
import type { Request, RequestHandler } from "express";
import rateLimit, { type Store } from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export function aiRateLimitKeyGenerator(req: Request): string {
  if (req.userId === undefined) {
    throw new Error("aiRateLimiter: req.userId is not set");
  }
  return String(req.userId);
}

export function makeAiRateLimiter(store: Store): RequestHandler {
  return rateLimit({
    windowMs: env.RATE_LIMIT_AI_WINDOW_MS,
    max: env.RATE_LIMIT_AI_MAX,
    message: { message: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: aiRateLimitKeyGenerator,
    store,
  });
}
