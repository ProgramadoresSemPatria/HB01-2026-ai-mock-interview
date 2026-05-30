import {
  loginSchema,
  passwordResetSchema,
  refreshSchema,
  requestPasswordResetSchema,
  signupSchema,
} from "@/modules/auth";
import { asyncHandler, authRateLimiter, validate } from "@/shared";
import type { Router } from "express";

import { makeAuthController } from "@/factories/auth/auth-controller-factory";

export default function authRoutes(router: Router): void {
  const controller = makeAuthController();

  router.post(
    "/signup",
    authRateLimiter,
    validate(signupSchema),
    asyncHandler(controller.signUp),
  );
  router.post(
    "/login",
    authRateLimiter,
    validate(loginSchema),
    asyncHandler(controller.login),
  );
  router.post(
    "/refresh",
    validate(refreshSchema),
    asyncHandler(controller.refresh),
  );
  router.post(
    "/request-password-reset",
    authRateLimiter,
    validate(requestPasswordResetSchema),
    asyncHandler(controller.requestPasswordReset),
  );
  router.post(
    "/reset-password",
    validate(passwordResetSchema),
    asyncHandler(controller.resetPassword),
  );
}
