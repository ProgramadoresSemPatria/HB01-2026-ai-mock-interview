import { makeCheckAuthMiddleware } from "@/modules/auth";
import { JwtTokenService } from "@/shared";
import { env } from "@/config/env";
import type { RequestHandler } from "express";

export function makeCheckAuth(): RequestHandler {
  const tokenService = new JwtTokenService({
    secret: env.JWT_SECRET,
    defaultExpiresIn: env.JWT_EXPIRE_IN,
  });

  return makeCheckAuthMiddleware(tokenService);
}
