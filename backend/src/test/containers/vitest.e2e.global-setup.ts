import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import {
  RedisContainer,
  type StartedRedisContainer,
} from "@testcontainers/redis";
import type { TestProject } from "vitest/node";

import { runMigrations } from "./migrate-database";

const POSTGRES_IMAGE = "postgres:16-alpine";
const REDIS_IMAGE = "redis:8-alpine";

let postgresContainer: StartedPostgreSqlContainer | undefined;
let redisContainer: StartedRedisContainer | undefined;

export async function setup(project: TestProject): Promise<void> {
  const [postgres, redis] = await Promise.all([
    new PostgreSqlContainer(POSTGRES_IMAGE)
      .withDatabase("test")
      .withUsername("test")
      .withPassword("test")
      .start(),
    new RedisContainer(REDIS_IMAGE).start(),
  ]);

  postgresContainer = postgres;
  redisContainer = redis;

  const databaseUrl = postgres.getConnectionUri();
  const redisUrl = redis.getConnectionUrl();

  process.env.DATABASE_URL = databaseUrl;
  process.env.REDIS_URL = redisUrl;
  project.provide("databaseUrl", databaseUrl);
  project.provide("redisUrl", redisUrl);

  await runMigrations(databaseUrl);
}

export async function teardown(): Promise<void> {
  await Promise.all([postgresContainer?.stop(), redisContainer?.stop()]);
}
