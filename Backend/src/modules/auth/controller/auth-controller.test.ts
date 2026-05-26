import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthService } from "@/modules/auth";
import { BadRequestError, NotFoundError, UnauthorizedError } from "@/shared";
import type { NextFunction, Request, Response } from "express";

import {
  AuthController,
  PASSWORD_RESET_REQUEST_MESSAGE,
} from "./auth-controller";

function createMockResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);

  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

function createMockRequest(body: unknown = {}) {
  return { body } as Request;
}

describe("AuthController", () => {
  let authService: AuthService;
  let controller: AuthController;
  let res: ReturnType<typeof createMockResponse>;
  let next: NextFunction;

  beforeEach(() => {
    authService = {
      signUp: vi.fn(),
      login: vi.fn(),
      refreshAccessToken: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    } as unknown as AuthService;

    controller = new AuthController(authService);
    res = createMockResponse();
    next = vi.fn();
  });

  describe("signUp", () => {
    it("returns 201 with the created user", async () => {
      const user = {
        id: 1,
        name: "Jane",
        email: "jane@example.com",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      };
      const body = {
        name: "Jane",
        email: "jane@example.com",
        password: "secret12",
      };

      vi.mocked(authService.signUp).mockResolvedValue(user);

      await controller.signUp(createMockRequest(body), res, next);

      expect(authService.signUp).toHaveBeenCalledWith(body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ user });
      expect(next).not.toHaveBeenCalled();
    });

    it("delegates errors to next", async () => {
      const error = new BadRequestError("Email already in use");
      vi.mocked(authService.signUp).mockRejectedValue(error);

      await controller.signUp(createMockRequest({}), res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("returns 200 with user and tokens", async () => {
      const body = { email: "jane@example.com", password: "secret12" };
      const loginResult = {
        user: {
          id: 1,
          name: "Jane",
          email: body.email,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };

      vi.mocked(authService.login).mockResolvedValue(loginResult);

      await controller.login(createMockRequest(body), res, next);

      expect(authService.login).toHaveBeenCalledWith(body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(loginResult);
      expect(next).not.toHaveBeenCalled();
    });

    it("delegates errors to next", async () => {
      const error = new UnauthorizedError("Invalid credentials");
      vi.mocked(authService.login).mockRejectedValue(error);

      await controller.login(createMockRequest({}), res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("refresh", () => {
    it("returns 200 with rotated tokens", async () => {
      const body = { refreshToken: "refresh-token" };
      const refreshResult = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };

      vi.mocked(authService.refreshAccessToken).mockResolvedValue(
        refreshResult,
      );

      await controller.refresh(createMockRequest(body), res, next);

      expect(authService.refreshAccessToken).toHaveBeenCalledWith(
        "refresh-token",
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(refreshResult);
      expect(next).not.toHaveBeenCalled();
    });

    it("delegates errors to next", async () => {
      const error = new UnauthorizedError("Invalid or expired refresh token");
      vi.mocked(authService.refreshAccessToken).mockRejectedValue(error);

      await controller.refresh(
        createMockRequest({ refreshToken: "bad-token" }),
        res,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("requestPasswordReset", () => {
    it("always responds with a generic 200 when the service succeeds", async () => {
      vi.mocked(authService.requestPasswordReset).mockResolvedValue(undefined);

      await controller.requestPasswordReset(
        createMockRequest({ email: "jane@example.com" }),
        res,
        next,
      );

      expect(authService.requestPasswordReset).toHaveBeenCalledWith(
        "jane@example.com",
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: PASSWORD_RESET_REQUEST_MESSAGE,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("responds with generic 200 when the service throws NotFoundError", async () => {
      vi.mocked(authService.requestPasswordReset).mockRejectedValue(
        new NotFoundError("User not found"),
      );

      await controller.requestPasswordReset(
        createMockRequest({ email: "missing@example.com" }),
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: PASSWORD_RESET_REQUEST_MESSAGE,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("delegates non-404 errors to next", async () => {
      const error = new Error("SMTP failure");
      vi.mocked(authService.requestPasswordReset).mockRejectedValue(error);

      await controller.requestPasswordReset(
        createMockRequest({ email: "jane@example.com" }),
        res,
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    it("returns 200 after a successful password reset", async () => {
      vi.mocked(authService.resetPassword).mockResolvedValue(undefined);

      await controller.resetPassword(
        createMockRequest({
          token: "reset-token",
          password: "new-secret",
        }),
        res,
        next,
      );

      expect(authService.resetPassword).toHaveBeenCalledWith(
        "reset-token",
        "new-secret",
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Password updated successfully",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("delegates errors to next", async () => {
      const error = new UnauthorizedError("Invalid or expired reset token");
      vi.mocked(authService.resetPassword).mockRejectedValue(error);

      await controller.resetPassword(createMockRequest({}), res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
