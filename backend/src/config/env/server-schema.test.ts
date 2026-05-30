import { describe, expect, it } from "vitest";

import { serverEnvSchema } from "./server-schema";

const validEnv = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/hackathon2026",
  PORT: "3000",
  CORS_ORIGIN: "http://localhost:3001",
  FRONTEND_URL: "http://localhost:3001",
  NODE_ENV: "development",
  JWT_SECRET: "your-super-secret-jwt-key-min-32-chars",
  JWT_EXPIRE_IN: "15m",
  REFRESH_EXPIRES: "604800",
  RESET_PASSWORD_JWT_EXPIRE_IN: "1h",
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "587",
  SMTP_USER: "user@example.com",
  SMTP_PASS: "secret",
  MAIL_FROM: "user@example.com",
  OPENAI_API_KEY: "sk-test-openai-api-key",
  R2_ACCOUNT_ID: "test-account-id",
  R2_ACCESS_KEY_ID: "test-access-key",
  R2_SECRET_ACCESS_KEY: "test-secret-key",
  R2_BUCKET_NAME: "test-bucket",
};

describe("serverEnvSchema", () => {
  it("parses a valid environment", () => {
    const result = serverEnvSchema.safeParse(validEnv);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.PORT).toBe(3000);
    expect(result.data.REFRESH_EXPIRES).toBe(604800);
    expect(result.data.SMTP_PORT).toBe(587);
    expect(result.data.RATE_LIMIT_WINDOW_MS).toBe(900000);
    expect(result.data.RATE_LIMIT_MAX).toBe(20);
    expect(result.data.OPENAI_MODEL_INTERVIEW).toBe("gpt-5");
    expect(result.data.OPENAI_MODEL_EXTRACTION).toBe("gpt-5-nano");
    expect(result.data.OPENAI_MODEL_REVIEW).toBe("gpt-5-nano");
    expect(result.data.REDIS_URL).toBe("redis://localhost:6379");
    expect(result.data.RESUME_MAX_BYTES).toBe(5_242_880);
    expect(result.data.R2_ENDPOINT).toBe(
      "https://test-account-id.r2.cloudflarestorage.com",
    );
  });

  it("uses explicit R2_ENDPOINT when provided", () => {
    const result = serverEnvSchema.safeParse({
      ...validEnv,
      R2_ENDPOINT: "https://custom.r2.example.com",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.R2_ENDPOINT).toBe("https://custom.r2.example.com");
  });

  it("rejects invalid environment with clear field errors", () => {
    const result = serverEnvSchema.safeParse({
      ...validEnv,
      JWT_SECRET: "too-short",
      CORS_ORIGIN: "not-a-url",
      MAIL_FROM: "not-an-email",
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const messages = result.error.issues.map((i) => i.message).join(" ");
    expect(messages.length).toBeGreaterThan(0);
    expect(result.error.issues.some((i) => i.path.includes("JWT_SECRET"))).toBe(
      true,
    );
    expect(
      result.error.issues.some((i) => i.path.includes("CORS_ORIGIN")),
    ).toBe(true);
    expect(result.error.issues.some((i) => i.path.includes("MAIL_FROM"))).toBe(
      true,
    );
  });
});
