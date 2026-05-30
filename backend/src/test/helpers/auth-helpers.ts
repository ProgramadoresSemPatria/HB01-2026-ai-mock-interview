import request from "supertest";
import type { Express } from "express";
import type { Response } from "supertest";

export function createSignupPayload(
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

export async function signUpUser(
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

export async function loginUser(
  app: Express,
  overrides?: Partial<{
    email: string;
    password: string;
  }>,
): Promise<Response> {
  return request(app)
    .post("/api/auth/login")
    .send({
      email: "jane@example.com",
      password: "secret123",
      ...overrides,
    });
}

export function authHeader(accessToken: string): { Authorization: string } {
  return { Authorization: `Bearer ${accessToken}` };
}
