import type { ITokenService } from "../protocols/token-service";
import type { RequestHandler } from "express";

export type PublicRoute = {
  method: string;
  path: string;
};

export const PUBLIC_ROUTES: PublicRoute[] = [
  { method: "GET", path: "/" },
  { method: "POST", path: "/api/auth/signup" },
  { method: "POST", path: "/api/auth/login" },
  { method: "POST", path: "/api/auth/refresh" },
  { method: "POST", path: "/api/auth/request-password-reset" },
  { method: "POST", path: "/api/auth/reset-password" },
];

function isPublicRoute(method: string, path: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => route.method === method && route.path === path,
  );
}

function extractBearerToken(
  authorizationHeader: string | undefined,
): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export function makeCheckAuthMiddleware(
  tokenService: ITokenService,
): RequestHandler {
  return (req, res, next) => {
    if (isPublicRoute(req.method, req.path)) {
      next();
      return;
    }

    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    try {
      const payload = tokenService.verify<{ userId?: number }>(token);

      if (!payload.userId) {
        res.status(401).json({ message: "Invalid token" });
        return;
      }

      req.userId = payload.userId;
      next();
    } catch {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}
