import {
  JwtTokenService,
  makeCheckAuthMiddleware,
} from "@hackathon2026/common";
import { env } from "@hackathon2026/env/server";
import type { RequestHandler } from "express";

export function makeCheckAuth(): RequestHandler {
  const tokenService = new JwtTokenService({
    secret: env.JWT_SECRET,
    defaultExpiresIn: env.JWT_EXPIRE_IN,
  });

  return makeCheckAuthMiddleware(tokenService);
}
