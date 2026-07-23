import { BorderlessJwtVerifier } from "@/modules/auth/adapters/borderless-jwt-verifier";
import { makeCheckAuthMiddleware } from "@/modules/auth/middlewares/check-auth-middleware";
import { UserRepository } from "@/modules/auth/repository/user-repository";
import { UserSyncService } from "@/modules/auth/service/user-sync-service";
import { env } from "@/config/env";
import type { RequestHandler } from "express";

export function makeCheckAuth(): RequestHandler {
  const verifier = new BorderlessJwtVerifier({
    secret: env.BORDERLESS_JWT_SECRET,
  });
  const userSync = new UserSyncService(new UserRepository());

  return makeCheckAuthMiddleware(verifier, userSync);
}
