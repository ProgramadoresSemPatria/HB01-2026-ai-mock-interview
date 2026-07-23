import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_SERVER_URL: z.url().default("http://localhost:3000"),
    NEXT_PUBLIC_BORDERLESS_SIGNUP_URL: z
      .url()
      .default("https://borderlesscoding.com"),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_BORDERLESS_SIGNUP_URL:
      process.env.NEXT_PUBLIC_BORDERLESS_SIGNUP_URL,
  },
  emptyStringAsUndefined: true,
});
