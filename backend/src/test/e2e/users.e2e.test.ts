import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import request from "supertest";
import type { Express } from "express";

import { createApp } from "@/config/app";
import prisma from "@/infrastructure/database";
import {
  authHeader,
  seedAuthenticatedUser,
} from "@/test/helpers/auth-helpers";
import { truncateTables } from "@/test/containers/truncate-tables";

async function authenticate(): Promise<{
  token: string;
  userId: number;
}> {
  const auth = await seedAuthenticatedUser();
  return {
    token: auth.accessToken,
    userId: auth.userId,
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
      const { token } = await authenticate();

      const response = await request(app)
        .patch("/api/users/me/interview-locale")
        .set(authHeader(token))
        .send({ interviewLocale: "fr" });

      expect(response.status).toBe(422);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
    });

    it("returns 200 and persists interviewLocale for authenticated user", async () => {
      const { token, userId } = await authenticate();

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

  describe("interviewLocale persistence", () => {
    it("starts null and remains set after PATCH", async () => {
      const auth = await seedAuthenticatedUser();

      const userBefore = await prisma.user.findUnique({
        where: { id: auth.userId },
      });
      expect(userBefore?.interviewLocale).toBeNull();

      const patchResponse = await request(app)
        .patch("/api/users/me/interview-locale")
        .set(authHeader(auth.accessToken))
        .send({ interviewLocale: "en" });

      expect(patchResponse.status).toBe(200);
      expect(patchResponse.body).toEqual({ interviewLocale: "en" });

      const userAfter = await prisma.user.findUnique({
        where: { id: auth.userId },
      });
      expect(userAfter?.interviewLocale).toBe("en");
    });
  });
});
