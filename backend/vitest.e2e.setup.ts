const e2eEnvDefaults: Record<string, string> = {
  CORS_ORIGIN: "http://localhost:3001",
  FRONTEND_URL: "http://localhost:3001",
  NODE_ENV: "test",
  JWT_SECRET: "test-jwt-secret-at-least-32-characters-long",
  JWT_EXPIRE_IN: "15m",
  REFRESH_EXPIRES: "604800",
  RESET_PASSWORD_JWT_EXPIRE_IN: "1h",
  SMTP_HOST: "smtp.example.com",
  SMTP_PORT: "587",
  SMTP_USER: "user@example.com",
  SMTP_PASS: "secret",
  MAIL_FROM: "user@example.com",
  RATE_LIMIT_WINDOW_MS: "900000",
  RATE_LIMIT_MAX: "500",
  OPENAI_API_KEY: "test-openai-key",
  OPENAI_MODEL_INTERVIEW: "gpt-5",
  OPENAI_MODEL_EXTRACTION: "gpt-5-mini",
  OPENAI_MODEL_REVIEW: "gpt-5-mini",
  R2_ACCOUNT_ID: "account",
  R2_ACCESS_KEY_ID: "key",
  R2_SECRET_ACCESS_KEY: "secret",
  R2_BUCKET_NAME: "bucket",
  RESUME_MAX_BYTES: "5242880",
};

for (const [key, value] of Object.entries(e2eEnvDefaults)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

// E2E suites issue many auth requests; .env often sets a low limit (20).
process.env.RATE_LIMIT_MAX = e2eEnvDefaults.RATE_LIMIT_MAX;
process.env.RATE_LIMIT_WINDOW_MS = e2eEnvDefaults.RATE_LIMIT_WINDOW_MS;

// vitest.setup.ts sets a low default; E2E suites issue many auth requests per file.
process.env.RATE_LIMIT_MAX = e2eEnvDefaults.RATE_LIMIT_MAX;
