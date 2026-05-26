import {
  loginSchema,
  passwordResetSchema,
  refreshSchema,
  requestPasswordResetSchema,
  signupSchema,
} from "@/modules/auth";
import { authRateLimiter, validate } from "@/shared";
import type { Router } from "express";

import { makeAuthController } from "@/factories/auth/auth-controller-factory";

export default function authRoutes(router: Router): void {
  const controller = makeAuthController();

  router.post(
    "/signup",
    authRateLimiter,
    validate(signupSchema),
    controller.signUp,
  );
  router.post(
    "/login",
    authRateLimiter,
    validate(loginSchema),
    controller.login,
  );
  router.post("/refresh", validate(refreshSchema), controller.refresh);
  router.post(
    "/request-password-reset",
    authRateLimiter,
    validate(requestPasswordResetSchema),
    controller.requestPasswordReset,
  );
  router.post(
    "/reset-password",
    validate(passwordResetSchema),
    controller.resetPassword,
  );
}
