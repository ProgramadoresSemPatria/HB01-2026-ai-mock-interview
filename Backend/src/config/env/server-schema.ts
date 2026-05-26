import type { StandardSchemaV1 } from "@t3-oss/env-core";
import { z } from "zod";

/** Server-side environment variable validators (MVC, SMTP, rate limit). */
export const serverEnv = {
  // Database
  DATABASE_URL: z.string().min(1),

  // Server
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.url(),
  FRONTEND_URL: z.url(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // JWT Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRE_IN: z.string().default("15m"),
  REFRESH_EXPIRES: z.coerce.number().default(604800), // 7 days in seconds
  RESET_PASSWORD_JWT_EXPIRE_IN: z.string().default("1h"),

  // SMTP / Email
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  MAIL_FROM: z.string().email(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().default(20),
} as const;

export const serverEnvSchema = z.object(serverEnv);

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function formatEnvValidationIssues(
  issues: readonly StandardSchemaV1.Issue[],
): string {
  const lines = issues.map((issue) => {
    const path = issue.path?.map(String).join(".") || "(root)";
    return `  - ${path}: ${issue.message}`;
  });
  return `Invalid environment variables:\n${lines.join("\n")}`;
}
