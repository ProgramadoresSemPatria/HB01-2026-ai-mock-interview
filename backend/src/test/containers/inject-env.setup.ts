import { inject } from "vitest";

process.env.DATABASE_URL = inject("databaseUrl");
const redisUrl = inject("redisUrl", { optional: true });
if (redisUrl) {
  process.env.REDIS_URL = redisUrl;
}
