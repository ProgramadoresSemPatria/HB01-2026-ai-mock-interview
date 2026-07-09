import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import request from "supertest";
import type { Express } from "express";

import { createApp } from "@/config/app";
import prisma from "@/infrastructure/database";
import {
  authHeader,
  loginUser,
  signUpUser,
} from "@/test/helpers/auth-helpers";
import { truncateTables } from "@/test/containers/truncate-tables";

async function authenticate(app: Express): Promise<{
  token: string;
  userId: number;
}> {
  const { response: signUpResponse } = await signUpUser(app);
  const loginResponse = await loginUser(app);
  return {
    token: loginResponse.body.accessToken as string,
    userId: signUpResponse.body.user.id as number,
  };
}

describe("Users API E2E", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await truncateTables();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("PATCH /api/users/me/interview-locale", () => {
    it("returns 401 without authentication", async () => {
      const response = await request(app)
        .patch("/api/users/me/interview-locale")
        .send({ interviewLocale: "en" });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("returns 422 when body is invalid", async () => {
      const { token } = await authenticate(app);

      const response = await request(app)
        .patch("/api/users/me/interview-locale")
        .set(authHeader(token))
        .send({ interviewLocale: "fr" });

      expect(response.status).toBe(422);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
    });

    it("returns 200 and persists interviewLocale for authenticated user", async () => {
      const { token, userId } = await authenticate(app);

      const response = await request(app)
        .patch("/api/users/me/interview-locale")
        .set(authHeader(token))
        .send({ interviewLocale: "pt" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ interviewLocale: "pt" });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user?.interviewLocale).toBe("pt");
    });
  });

  describe("auth payload interviewLocale", () => {
    it("includes interviewLocale null on signup and login, then set after PATCH", async () => {
      const { response: signUpResponse } = await signUpUser(app);

      expect(signUpResponse.status).toBe(201);
      expect(signUpResponse.body.user).toHaveProperty("interviewLocale", null);

      const loginBefore = await loginUser(app);
      expect(loginBefore.status).toBe(200);
      expect(loginBefore.body.user).toHaveProperty("interviewLocale", null);

      await request(app)
        .patch("/api/users/me/interview-locale")
        .set(authHeader(loginBefore.body.accessToken))
        .send({ interviewLocale: "en" });

      const loginAfter = await loginUser(app);
      expect(loginAfter.status).toBe(200);
      expect(loginAfter.body.user).toHaveProperty("interviewLocale", "en");
    });
  });
});
