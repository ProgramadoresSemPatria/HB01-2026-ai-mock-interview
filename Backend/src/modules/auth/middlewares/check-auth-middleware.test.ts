import type {
  ITokenService,
  SignTokenOptions,
  TokenPayload,
} from "../protocols/token-service";
import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { createJwtTokenService } from "@/shared/adapters/cryptography/jwt-token-service";
import { makeCheckAuthMiddleware } from "./check-auth-middleware";

const jwtConfig = {
  secret: "test-secret-key-at-least-32-characters-long",
  defaultExpiresIn: "1h",
} as const;

class StubTokenService implements ITokenService {
  verifyResult: TokenPayload = { userId: 42 };
  verifyError: Error | null = null;

  sign(_payload: TokenPayload, _options?: SignTokenOptions): string {
    return "stub-token";
  }

  verify<T extends TokenPayload = TokenPayload>(
    _token: string,
    _secret?: string,
  ): T {
    if (this.verifyError) {
      throw this.verifyError;
    }

    return this.verifyResult as T;
  }

  decode<T extends TokenPayload = TokenPayload>(_token: string): T | null {
    return null;
  }
}

function runMiddleware(
  middleware: ReturnType<typeof makeCheckAuthMiddleware>,
  overrides: Partial<Request> = {},
) {
  const req = {
    method: "GET",
    path: "/protected",
    headers: {},
    ...overrides,
  } as Request;

  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  } as Response & { statusCode: number; body: unknown };

  const next = vi.fn();

  middleware(req, res, next);

  return { req, res, next };
}

describe("makeCheckAuthMiddleware", () => {
  it("allows public routes without Authorization header", () => {
    const middleware = makeCheckAuthMiddleware(new StubTokenService());
    const { req, res, next } = runMiddleware(middleware, {
      method: "POST",
      path: "/api/auth/login",
    });

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
    expect(req.userId).toBeUndefined();
  });

  it("returns 401 when Authorization header is missing on protected routes", () => {
    const middleware = makeCheckAuthMiddleware(new StubTokenService());
    const { res, next } = runMiddleware(middleware);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: "Authentication required" });
  });

  it("sets req.userId when token is valid", () => {
    const tokenService = createJwtTokenService(jwtConfig);
    const token = tokenService.sign({ userId: 7 });
    const middleware = makeCheckAuthMiddleware(tokenService);
    const { req, res, next } = runMiddleware(middleware, {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
    expect(req.userId).toBe(7);
  });

  it("returns 401 when token is expired", () => {
    const tokenService = createJwtTokenService(jwtConfig);
    const expiredToken = tokenService.sign({ userId: 1 }, { expiresIn: "0s" });
    const middleware = makeCheckAuthMiddleware(tokenService);
    const { res, next } = runMiddleware(middleware, {
      headers: { authorization: `Bearer ${expiredToken}` },
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: "Invalid or expired token" });
  });
});
