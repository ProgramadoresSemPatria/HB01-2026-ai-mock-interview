import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const nodemailerMock = vi.hoisted(() => {
  const sentMails: Array<{ to: string; subject: string; body: string }> = [];
  const sendMailMock = vi.fn(async (message: Record<string, unknown>) => {
    sentMails.push({
      to: String(message.to),
      subject: String(message.subject),
      body: String(message.text),
    });

    return {
      messageId: "mock-message-id",
    };
  });

  const createTransportMock = vi.fn(() => ({
    sendMail: sendMailMock,
  }));

  return {
    sentMails,
    sendMailMock,
    createTransportMock,
  };
});

vi.mock("nodemailer", () => ({
  default: {
    createTransport: nodemailerMock.createTransportMock,
  },
  createTransport: nodemailerMock.createTransportMock,
}));

import request from "supertest";
import type { Express } from "express";

import { createApp } from "@/config/app";
import prisma from "@/infrastructure/database";
import { initializeE2EDatabase, truncateE2ETables } from "./database";

function createSignupPayload(
  overrides?: Partial<{
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }>,
) {
  return {
    name: "Jane Doe",
    email: "jane@example.com",
    password: "secret123",
    confirmPassword: "secret123",
    ...overrides,
  };
}

async function signUpUser(
  app: Express,
  overrides?: Partial<{
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }>,
) {
  const payload = createSignupPayload(overrides);
  const response = await request(app).post("/api/auth/signup").send(payload);

  return { payload, response };
}

async function loginUser(
  app: Express,
  overrides?: Partial<{
    email: string;
    password: string;
  }>,
) {
  return request(app)
    .post("/api/auth/login")
    .send({
      email: "jane@example.com",
      password: "secret123",
      ...overrides,
    });
}

function extractResetToken(): string {
  const body = nodemailerMock.sentMails[0]?.body;

  if (!body) {
    throw new Error("Reset email was not sent");
  }

  const match = body.match(/https?:\/\/\S+/);

  if (!match) {
    throw new Error("Reset URL not found in email body");
  }

  const resetUrl = new URL(match[0]);
  const token = resetUrl.searchParams.get("token");

  if (!token) {
    throw new Error("Reset token not found in reset URL");
  }

  return token;
}

describe("Auth API E2E", () => {
  let app: Express;

  beforeAll(async () => {
    await initializeE2EDatabase();
    app = await createApp();
  });

  beforeEach(async () => {
    nodemailerMock.sentMails.length = 0;
    nodemailerMock.sendMailMock.mockClear();
    nodemailerMock.createTransportMock.mockClear();
    await truncateE2ETables();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns OK on health endpoint", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toBe("OK");
  });

  it("returns 401 for protected path without bearer token", async () => {
    const response = await request(app).get("/api/protected-smoke");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Authentication required",
    });
  });

  it("allows bearer auth to reach protected path and then returns 404", async () => {
    await signUpUser(app);
    const loginResponse = await loginUser(app);

    const response = await request(app)
      .get("/api/protected-smoke")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "Not Found",
    });
  });

  it("signs up user successfully", async () => {
    const { response } = await signUpUser(app);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      id: 1,
      name: "Jane Doe",
      email: "jane@example.com",
    });
    expect(response.body.user).not.toHaveProperty("password");
  });

  it("returns 400 when signup email already exists", async () => {
    await signUpUser(app);

    const response = await request(app)
      .post("/api/auth/signup")
      .send(createSignupPayload());

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Email already in use",
    });
  });

  it("returns 422 when signup payload is invalid", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      name: "",
      email: "bad-email",
      password: "123",
      confirmPassword: "456",
    });

    expect(response.status).toBe(422);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toBeDefined();
  });

  it("logs in user and returns auth tokens", async () => {
    await signUpUser(app);

    const response = await loginUser(app);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      id: 1,
      name: "Jane Doe",
      email: "jane@example.com",
    });
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
  });

  it("returns 401 when login credentials are invalid", async () => {
    await signUpUser(app);

    const response = await loginUser(app, {
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Invalid credentials",
    });
  });

  it("rotates refresh token and rejects reused refresh token", async () => {
    await signUpUser(app);
    const loginResponse = await loginUser(app);

    const refreshResponse = await request(app).post("/api/auth/refresh").send({
      refreshToken: loginResponse.body.refreshToken,
    });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body.refreshToken).toEqual(expect.any(String));
    expect(refreshResponse.body.refreshToken).not.toBe(
      loginResponse.body.refreshToken,
    );

    const reusedTokenResponse = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: loginResponse.body.refreshToken,
      });

    expect(reusedTokenResponse.status).toBe(401);
    expect(reusedTokenResponse.body).toEqual({
      message: "Invalid or expired refresh token",
    });
  });

  it("returns 422 when refresh payload is invalid", async () => {
    const response = await request(app).post("/api/auth/refresh").send({});

    expect(response.status).toBe(422);
    expect(response.body.message).toBe("Validation failed");
  });

  it("returns password reset message and sends email for existing user", async () => {
    await signUpUser(app);

    const response = await request(app)
      .post("/api/auth/request-password-reset")
      .send({
        email: "jane@example.com",
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message:
        "If an account with that email exists, you will receive password reset instructions.",
    });
    expect(nodemailerMock.sentMails).toHaveLength(1);
    expect(nodemailerMock.sentMails[0]).toMatchObject({
      to: "jane@example.com",
      subject: "Password reset",
    });
    expect(extractResetToken()).toEqual(expect.any(String));
  });

  it("returns same password reset message for missing user without sending email", async () => {
    const response = await request(app)
      .post("/api/auth/request-password-reset")
      .send({
        email: "missing@example.com",
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message:
        "If an account with that email exists, you will receive password reset instructions.",
    });
    expect(nodemailerMock.sentMails).toHaveLength(0);
  });

  it("resets password and accepts only new password for subsequent login", async () => {
    await signUpUser(app);

    await request(app).post("/api/auth/request-password-reset").send({
      email: "jane@example.com",
    });
    const token = extractResetToken();

    const resetResponse = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token,
        password: "new-secret123",
      });

    expect(resetResponse.status).toBe(200);
    expect(resetResponse.body).toEqual({
      message: "Password updated successfully",
    });

    const oldPasswordResponse = await loginUser(app);
    expect(oldPasswordResponse.status).toBe(401);

    const newPasswordResponse = await loginUser(app, {
      password: "new-secret123",
    });
    expect(newPasswordResponse.status).toBe(200);
    expect(newPasswordResponse.body.accessToken).toEqual(expect.any(String));
  });

  it("returns 401 when reset token is invalid", async () => {
    const response = await request(app).post("/api/auth/reset-password").send({
      token: "invalid-token",
      password: "new-secret123",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Invalid or expired reset token",
    });
  });

  it("serves OpenAPI JSON for auth module", async () => {
    const response = await request(app).get("/api-docs.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe("3.0.0");
    expect(response.body.paths["/api/auth/login"]).toBeDefined();
    expect(response.body.paths["/api/auth/signup"]).toBeDefined();
    expect(response.body.components.securitySchemes.bearerAuth).toBeDefined();
  });

  it("serves Swagger UI", async () => {
    const response = await request(app).get("/api-docs");

    expect(response.status).toBe(301);
    expect(response.headers.location).toBe("/api-docs/");

    const htmlResponse = await request(app).get("/api-docs/");

    expect(htmlResponse.status).toBe(200);
    expect(htmlResponse.text).toContain("Swagger UI");
  });
});
