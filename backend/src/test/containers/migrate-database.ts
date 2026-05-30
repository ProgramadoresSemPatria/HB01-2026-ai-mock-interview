import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "pg";

const migrationsDirPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../prisma/migrations",
);

export async function readAllMigrationSql(): Promise<string> {
  const entries = await readdir(migrationsDirPath, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const sqlParts = await Promise.all(
    directories.map((directory) =>
      readFile(resolve(migrationsDirPath, directory, "migration.sql"), "utf8"),
    ),
  );

  return sqlParts.join("\n\n");
}

export async function runMigrations(databaseUrl: string): Promise<void> {
  const migrationSql = await readAllMigrationSql();
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query(migrationSql);
  } finally {
    await client.end();
  }
}
