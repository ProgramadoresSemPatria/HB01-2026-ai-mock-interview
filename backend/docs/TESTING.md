# Testing Guide

This project uses a **three-suite Vitest pyramid**: unit (fast, no Docker), integration (real PostgreSQL via Testcontainers), and E2E (HTTP + PostgreSQL + Redis via Testcontainers).

---

## Layer → Test Type

| Code layer | Test type | File suffix | Runner |
|------------|-----------|-------------|--------|
| `validations/`, `service/`, `middlewares/`, pure infra | **Unit** | `*.test.ts` | `bun run test` |
| `repository/` | **Integration** | `*.integration.test.ts` | `bun run test:integration` |
| HTTP routes (Express + supertest) | **E2E** | `*.e2e.test.ts` | `bun run test:e2e` |
| `controller/` | **None** — covered by E2E | — | — |
| Thin wrappers (e.g. checkpoint singleton) | **None** | — | — |
| `prompts/`, pure LangGraph helpers | **Unit** | `*.test.ts` | `bun run test` |

Pre-commit (`.husky/pre-commit`) runs **unit tests only** — no Docker required.

---

## Commands

| Command | Scope | Docker required |
|---------|-------|-----------------|
| `bun run test` | Unit tests | No |
| `bun run test:integration` | Repository integration | Yes |
| `bun run test:e2e` | HTTP E2E suites | Yes |
| `bun run test:all` | All three suites | Yes |
| `bun run test:watch` | Unit watch mode | No |

Run a single file:

```bash
bun run test -- src/modules/auth/validations/auth-schemas.test.ts
bun run test:integration -- src/modules/auth/repository/user-repository.integration.test.ts
bun run test:e2e -- src/test/e2e/auth.e2e.test.ts
```

---

## Prerequisites

- **Bun** — test runner and runtime
- **Docker Desktop** (or Docker Engine) — required for `test:integration` and `test:e2e`
- Testcontainers pulls `postgres:16-alpine` and `redis:8-alpine` on first run (may take a minute)

---

## File Conventions

| Suffix | Location | Notes |
|--------|----------|-------|
| `*.test.ts` | Colocated with source | Mocked dependencies; excluded from integration/E2E configs |
| `*.integration.test.ts` | Colocated with repository | Real DB; `resetDatabase()` in `afterEach` |
| `*.e2e.test.ts` | `src/test/e2e/` | Full app via `createApp()` + supertest |

Shared test infrastructure lives under `src/test/`:

```
src/test/
├── containers/          # Testcontainers globalSetup, migrate, truncate, inject-env
├── integration/       # resetDatabase / disconnectDatabase helpers
├── helpers/           # auth-helpers, seed helpers for E2E
└── mocks/             # bun password mock, etc.
```

---

## Unit Test Example

```typescript
import { describe, expect, it } from "vitest";
import { loginSchema } from "./auth-schemas";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });
});
```

Unit config (`vitest.config.ts`) excludes `*.integration.test.ts` and `*.e2e.test.ts`. The `bun:` alias mocks Bun's password API for bcrypt tests.

---

## Integration Test Example

```typescript
import { afterAll, afterEach, describe, expect, it } from "vitest";
import {
  disconnectDatabase,
  resetDatabase,
} from "@/test/integration/helpers";
import { UserRepository } from "./user-repository";

describe("UserRepository (integration)", () => {
  const repository = new UserRepository();

  afterEach(() => resetDatabase());
  afterAll(() => disconnectDatabase());

  it("create + getByEmail round-trip", async () => {
    const created = await repository.create({
      name: "Jane",
      email: "jane@test.com",
      password: "hashed-password",
    });

    const found = await repository.getByEmail("jane@test.com");
    expect(found).toMatchObject({ id: created.id, email: "jane@test.com" });
  });
});
```

Integration suite starts a PostgreSQL container in `globalSetup`, runs Prisma migrations, and injects `DATABASE_URL` into workers via Vitest `inject()`. Tests share one container per run (`fileParallelism: false`); `truncateTables()` isolates each test.

---

## E2E Test Example

```typescript
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "@/config/app";
import { truncateTables } from "@/test/containers/truncate-tables";
import { signUpUser, loginUser, authHeader } from "@/test/helpers/auth-helpers";

describe("My API E2E", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await truncateTables();
  });

  it("returns 401 without auth", async () => {
    const response = await request(app).get("/api/my-route");
    expect(response.status).toBe(401);
  });
});
```

E2E suite starts PostgreSQL + Redis containers. External services (nodemailer, LangGraph, R2, BullMQ) are mocked with `vi.mock()` at the top of each suite. `inject-env.setup.ts` must run before any import of `@/infrastructure/database`.

---

## Bootstrap Flow (integration / E2E)

1. **globalSetup** (main process): start containers → `runMigrations()` → `project.provide("databaseUrl", uri)`
2. **inject-env.setup.ts** (worker): `process.env.DATABASE_URL = inject("databaseUrl")`
3. **vitest.setup.ts**: default env vars (only if unset)
4. Test file imports Prisma singleton (uses injected URL)
5. **afterEach**: `truncateTables()` for isolation
6. **teardown**: stop containers

---

## Local Dev: Container Reuse (optional)

By default containers are **ephemeral** (started/stopped each run). For faster local iteration you can enable reuse in globalSetup:

```typescript
new PostgreSqlContainer(POSTGRES_IMAGE)
  .withReuse()
  // ...
```

Reuse is **not enabled in CI** — keep it as a local-only optimization documented here.

---

## Mocking Guidelines

| Service | Unit | Integration | E2E |
|---------|------|-------------|-----|
| PostgreSQL | Mock Prisma | Real (Testcontainers) | Real (Testcontainers) |
| Redis | N/A | N/A | Real (Testcontainers) |
| OpenAI / LangGraph | Mock | N/A | `vi.mock` graph factory |
| Nodemailer | Mock transport | N/A | `vi.mock("nodemailer")` |
| R2 storage | Mock | N/A | `vi.mock` r2-client |
| BullMQ | Mock | N/A | `vi.mock` resume-queue |

---

## Scenario coverage

Expanded HTTP and repository scenarios are tracked in [`.specs/features/test-scenario-coverage/spec.md`](../.specs/features/test-scenario-coverage/spec.md). Summary by module:

| Module | E2E file | New scenario groups |
|--------|----------|---------------------|
| Auth | `auth.e2e.test.ts` | Bearer malformed/invalid (401), login/request-reset/reset-password 422, refresh 401 |
| Interview | `interview.e2e.test.ts` | Resume processing/failed/404, session/messages/stream auth & 404/409/422 |
| Resumes | `resumes.e2e.test.ts` | Upload validation (no file, non-PDF, size), GET 401, storage 502, queue 503 |
| Review items | `review-items.e2e.test.ts` | Empty list, cross-user isolation |

Unit additions: `validation-middleware.test.ts`, `review-items-generator-prompt.test.ts`, `closing-feedback-prompt.test.ts`.

Integration additions: `SessionRepository.incrementTurnCount` / `markFinished`, `ReviewRepository` topic lookups (case + `pg_trgm` similarity), null/empty cases on user/resume/message repos.

E2E uses `RATE_LIMIT_MAX=500` in `vitest.e2e.setup.ts` (overrides `.env`) so auth-heavy suites do not hit the default 20 req/window limit.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Cannot connect to Docker` | Docker not running | Start Docker Desktop |
| Tests hang on startup | Image pull / slow container | Wait; first run pulls images (~1–2 min) |
| Wrong DATABASE_URL in tests | Import order | Ensure `inject-env.setup.ts` is first in `setupFiles` |
| FK errors on truncate | Missing CASCADE | Use `truncateTables()` helper |
| E2E calls real OpenAI | Missing mock | Add `vi.mock` for graph/LLM factory |
| E2E auth returns 429 | Low `RATE_LIMIT_MAX` in `.env` | E2E setup forces 500; ensure `vitest.e2e.setup.ts` runs |
