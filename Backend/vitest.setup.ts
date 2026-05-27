const testEnvDefaults: Record<string, string> = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/test",
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
  RATE_LIMIT_MAX: "20",
  OPENAI_API_KEY: "sk-test-openai-api-key",
  OPENAI_MODEL_INTERVIEW: "gpt-5",
  OPENAI_MODEL_EXTRACTION: "gpt-5-nano",
  OPENAI_MODEL_REVIEW: "gpt-5-nano",
  R2_ACCOUNT_ID: "test-account-id",
  R2_ACCESS_KEY_ID: "test-access-key",
  R2_SECRET_ACCESS_KEY: "test-secret-key",
  R2_BUCKET_NAME: "test-bucket",
  REDIS_URL: "redis://localhost:6379",
  RESUME_MAX_BYTES: "5242880",
};

for (const [key, value] of Object.entries(testEnvDefaults)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}
