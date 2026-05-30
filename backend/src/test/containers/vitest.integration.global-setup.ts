import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import type { TestProject } from "vitest/node";

import { runMigrations } from "./migrate-database";

const POSTGRES_IMAGE = "postgres:16-alpine";

let postgresContainer: StartedPostgreSqlContainer | undefined;

export async function setup(project: TestProject): Promise<void> {
  postgresContainer = await new PostgreSqlContainer(POSTGRES_IMAGE)
    .withDatabase("test")
    .withUsername("test")
    .withPassword("test")
    .start();

  const databaseUrl = postgresContainer.getConnectionUri();
  process.env.DATABASE_URL = databaseUrl;
  project.provide("databaseUrl", databaseUrl);

  await runMigrations(databaseUrl);
}

export async function teardown(): Promise<void> {
  await postgresContainer?.stop();
}
