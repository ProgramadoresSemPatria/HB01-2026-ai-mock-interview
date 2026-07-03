import type Redis from "ioredis";

import { redisConnection } from "./resume-queue";

export async function pingRedis(): Promise<void> {
  await (redisConnection as Redis).ping();
}
