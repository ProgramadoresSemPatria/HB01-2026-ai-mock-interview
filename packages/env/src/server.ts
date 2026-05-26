import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Database
    DATABASE_URL: z.string().min(1),

    // Server
    PORT: z.coerce.number().default(3000),
    CORS_ORIGIN: z.url(),
    FRONTEND_URL: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

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
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
