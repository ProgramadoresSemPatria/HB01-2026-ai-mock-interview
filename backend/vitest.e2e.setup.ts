const e2eEnvDefaults: Record<string, string> = {
  DATABASE_URL:
    "postgresql://postgres:postgres@localhost:5432/hackathon2026_e2e",
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
};

for (const [key, value] of Object.entries(e2eEnvDefaults)) {
  process.env[key] = value;
}
