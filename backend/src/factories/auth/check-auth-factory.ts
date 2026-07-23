import { BorderlessAccessTokenParser } from "@/modules/auth/adapters/borderless-access-token-parser";
import { makeCheckAuthMiddleware } from "@/modules/auth/middlewares/check-auth-middleware";
import { UserRepository } from "@/modules/auth/repository/user-repository";
import { UserSyncService } from "@/modules/auth/service/user-sync-service";
import type { RequestHandler } from "express";

export function makeCheckAuth(): RequestHandler {
  const verifier = new BorderlessAccessTokenParser();
  const userSync = new UserSyncService(new UserRepository());

  return makeCheckAuthMiddleware(verifier, userSync);
}
