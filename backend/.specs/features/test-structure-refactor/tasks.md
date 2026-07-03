# Refatoração da Estrutura de Testes — Tasks

**Design**: `.specs/features/test-structure-refactor/design.md`
**Spec**: `.specs/features/test-structure-refactor/spec.md`
**Status**: Complete

---

## Gate Check Commands

| Gate | Command | Requires Docker | When |
|------|---------|-----------------|------|
| **quick** | `bun run test` | No | Unit tests; pre-commit |
| **integration** | `bun run test:integration` | Yes | Repository integration |
| **e2e** | `bun run test:e2e` | Yes | HTTP supertest suites |
| **full** | `bun run test:all` | Yes | Final validation |

> TESTING.md ainda não existe — matriz de cobertura derivada da spec § Política de Testes por Camada.

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10
```

### Phase 2: Repositories (Parallel after T9)

```
         ┌→ T11 [P] ─┐
         ├→ T12 [P] ─┤
T9,T10 ──┼→ T13 [P] ─┼──→ (integration gate)
         ├→ T14 [P] ─┤
         └→ T15 [P] ─┘
```

### Phase 3: Validations + Cleanup (Parallel after T8)

```
         ┌→ T16 [P] ─┐
T8 ──────┼→ T17 [P] ─┤
         ├→ T18 [P] ─┤──→ (quick gate)
         ├→ T19 [P] ─┤
         └→ T20 [P] ─┘

T8 ──→ T21 (delete checkpointer test — quick gate)
```

### Phase 4: E2E Expansion (Parallel after T10)

```
T10 ──→ ┌→ T21 [P] ─┐
        ├→ T22 [P] ─┼──→ T24 ──→ (e2e gate)
        └→ T23 [P] ─┘
```

### Phase 5: Docs (Sequential)

```
T24 ──→ T25
```

---

## Task Breakdown

### T1: Install Testcontainers dependencies and npm scripts

**What**: Add `@testcontainers/postgresql`, `@testcontainers/redis`, `testcontainers` and test scripts to `package.json`.
**Where**: `package.json`
**Depends on**: None
**Reuses**: Existing `test` / `test:e2e` scripts
**Requirements**: TEST-02, TEST-18

**Done when**:

- [ ] `@testcontainers/postgresql`, `@testcontainers/redis`, `testcontainers` in devDependencies
- [ ] Scripts: `test:integration`, `test:all` present
- [ ] `bun install` succeeds

**Tests**: none
**Gate**: none

**Verify**:
```bash
grep testcontainers package.json
grep test:integration package.json
```

**Commit**: `chore(test): add testcontainers deps and integration scripts`

---

### T2: Create migrate-database helper

**What**: Extract migration SQL runner from `e2e/database.ts` into shared helper.
**Where**: `src/test/containers/migrate-database.ts`
**Depends on**: T1
**Reuses**: `readAllMigrationSql()` logic from `src/test/e2e/database.ts`
**Requirements**: TEST-05, TEST-22

**Done when**:

- [ ] `readAllMigrationSql()` exported
- [ ] `runMigrations(databaseUrl: string)` connects via `pg` Client and executes SQL
- [ ] No CREATE DATABASE / admin client logic (Testcontainers provides DB)
- [ ] `bun run check-types` passes

**Tests**: none (infra helper — verified by T6/T7 globalSetup)
**Gate**: none

**Verify**:
```bash
bun run check-types
```

**Commit**: `test: add migrate-database helper for testcontainers`

---

### T3: Create truncate-tables helper

**What**: Shared table truncation for integration/E2E isolation.
**Where**: `src/test/containers/truncate-tables.ts`
**Depends on**: T1
**Reuses**: SQL from `truncateE2ETables()` in `src/test/e2e/database.ts`
**Requirements**: TEST-05

**Done when**:

- [ ] `truncateTables(databaseUrl?: string)` truncates all domain tables with RESTART IDENTITY CASCADE
- [ ] Accepts optional URL; falls back to `process.env.DATABASE_URL`
- [ ] `bun run check-types` passes

**Tests**: none (verified by integration/E2E usage)
**Gate**: none

**Verify**:
```bash
bun run check-types
```

**Commit**: `test: add truncate-tables helper`

---

### T4: Add Vitest inject() TypeScript types

**What**: Type `databaseUrl` and optional `redisUrl` for Vitest `inject()`.
**Where**: `src/test/vitest-env.d.ts`, `tsconfig.json`
**Depends on**: T1
**Reuses**: Vitest `ProvidedContext` augmentation pattern
**Requirements**: TEST-01

**Done when**:

- [ ] `ProvidedContext` declares `databaseUrl: string` and `redisUrl?: string`
- [ ] `tsconfig.json` includes test configs and `src/test/vitest-env.d.ts`
- [ ] `bun run check-types` passes

**Tests**: none
**Gate**: none

**Verify**:
```bash
bun run check-types
```

**Commit**: `test: add vitest inject context types`

---

### T5: Create inject-env setup file

**What**: Propagate `globalSetup` values to `process.env` before Prisma imports.
**Where**: `src/test/containers/inject-env.setup.ts`
**Depends on**: T4
**Reuses**: Design §5 inject-env pattern
**Requirements**: TEST-05

**Done when**:

- [ ] Sets `process.env.DATABASE_URL = inject("databaseUrl")`
- [ ] Sets `REDIS_URL` when `inject("redisUrl", { optional: true })` is present
- [ ] `bun run check-types` passes

**Tests**: none
**Gate**: none

**Verify**:
```bash
bun run check-types
```

**Commit**: `test: add inject-env setup for testcontainers`

---

### T6: Create integration globalSetup (PostgreSQL)

**What**: Start `PostgreSqlContainer`, run migrations, provide `databaseUrl`.
**Where**: `src/test/containers/vitest.integration.global-setup.ts`
**Depends on**: T2, T5
**Reuses**: `runMigrations()` from T2
**Requirements**: TEST-19

**Done when**:

- [ ] Uses `postgres:16-alpine` with test/test credentials
- [ ] `setup()` calls `project.provide("databaseUrl", uri)` and sets `process.env.DATABASE_URL`
- [ ] `teardown()` stops container
- [ ] No `.withReuse()`

**Tests**: none (smoke verified in T8)
**Gate**: none

**Verify**:
```bash
bun run check-types
```

**Commit**: `test: add integration globalSetup with postgres testcontainer`

---

### T7: Create E2E globalSetup (PostgreSQL + Redis)

**What**: Start Postgres and Redis containers in parallel for E2E suite.
**Where**: `src/test/containers/vitest.e2e.global-setup.ts`
**Depends on**: T2, T5
**Reuses**: `runMigrations()` from T2
**Requirements**: TEST-20

**Done when**:

- [ ] `Promise.all` starts `PostgreSqlContainer` + `RedisContainer("redis:8-alpine")`
- [ ] Provides `databaseUrl` and `redisUrl`; sets both env vars
- [ ] `teardown()` stops both containers

**Tests**: none (smoke verified in T10)
**Gate**: none

**Verify**:
```bash
bun run check-types
```

**Commit**: `test: add e2e globalSetup with postgres and redis testcontainers`

---

### T8: Configure Vitest suites (unit + integration + e2e)

**What**: Wire all three Vitest configs with correct include/exclude/globalSetup/setupFiles order.
**Where**: `vitest.config.ts`, `vitest.integration.config.ts` (new), `vitest.e2e.config.ts`, `vitest.e2e.setup.ts`
**Depends on**: T5, T6, T7
**Reuses**: Existing `vitest.config.ts` aliases
**Requirements**: TEST-01

**Done when**:

- [ ] `vitest.config.ts` excludes `*.integration.test.ts` and `*.e2e.test.ts`
- [ ] `vitest.integration.config.ts` created with globalSetup, `inject-env` first in setupFiles, `fileParallelism: false`, `hookTimeout: 120_000`
- [ ] `vitest.e2e.config.ts` updated with E2E globalSetup and setupFiles order
- [ ] `vitest.e2e.setup.ts` no longer sets hardcoded `DATABASE_URL` / `REDIS_URL`
- [ ] `bun run test` still runs (unit only)

**Tests**: none
**Gate**: quick

**Verify**:
```bash
bun run test
```
Expected: unit tests pass; no integration/e2e files included.

**Commit**: `test: split vitest configs for unit integration and e2e`

---

### T9: Create integration test helpers

**What**: `resetDatabase()` and `disconnectDatabase()` wrappers for repository tests.
**Where**: `src/test/integration/helpers.ts`
**Depends on**: T3
**Reuses**: `truncateTables()` from T3, `@/infrastructure/database` prisma singleton
**Requirements**: TEST-05

**Done when**:

- [ ] `resetDatabase()` calls `truncateTables()`
- [ ] `disconnectDatabase()` calls `prisma.$disconnect()`
- [ ] `bun run check-types` passes

**Tests**: none
**Gate**: none

**Verify**:
```bash
bun run check-types
```

**Commit**: `test: add integration test helpers`

---

### T10: Refactor auth E2E for Testcontainers

**What**: Migrate `auth.e2e.test.ts` off manual DB setup; extract auth helpers; delete `database.ts`.
**Where**: `src/test/e2e/auth.e2e.test.ts`, `src/test/helpers/auth-helpers.ts` (new), delete `src/test/e2e/database.ts`
**Depends on**: T3, T8
**Reuses**: Existing auth E2E scenarios; nodemailer mock pattern
**Requirements**: TEST-10, TEST-21, TEST-22

**Done when**:

- [ ] `auth-helpers.ts` exports `createSignupPayload`, `signUpUser`, `loginUser`, `authHeader`
- [ ] `auth.e2e.test.ts` uses helpers; no `initializeE2EDatabase`
- [ ] `afterEach` calls `truncateTables()` from containers helper
- [ ] `src/test/e2e/database.ts` deleted
- [ ] Gate check passes: `bun run test:e2e`
- [ ] Test count: auth E2E tests ≥ previous count (no silent deletions)

**Tests**: e2e
**Gate**: e2e

**Verify**:
```bash
bun run test:e2e
```
Expected: auth suite green with Docker running; no import of `./database`.

**Commit**: `test: migrate auth e2e to testcontainers`

---

### T11: UserRepository integration test [P]

**What**: Replace mocked `user-repository.test.ts` with real DB integration test.
**Where**: `src/modules/auth/repository/user-repository.integration.test.ts`; delete `user-repository.test.ts`
**Depends on**: T9
**Reuses**: Scenarios from existing mock test; integration template from design §10
**Requirements**: TEST-04

**Done when**:

- [ ] No `vi.mock("@/infrastructure/database")`
- [ ] Uses `resetDatabase` in `afterEach`, `disconnectDatabase` in `afterAll`
- [ ] Covers: create, getByEmail, getById, update, refresh token CRUD + expiry filter
- [ ] Old `user-repository.test.ts` deleted
- [ ] Gate check passes: `bun run test:integration`
- [ ] Test count: ≥ mock test scenario count

**Tests**: integration
**Gate**: integration

**Verify**:
```bash
bun run test:integration -- src/modules/auth/repository/user-repository.integration.test.ts
```

**Commit**: `test(auth): add user-repository integration test`

---

### T12: ResumeRepository integration test [P]

**What**: Replace mocked resume repository test with integration test.
**Where**: `src/modules/resumes/repository/resume-repository.integration.test.ts`; delete `resume-repository.test.ts`
**Depends on**: T9
**Reuses**: Scenarios from existing mock test
**Requirements**: TEST-04

**Done when**:

- [ ] No Prisma mock; real DB round-trips
- [ ] Covers: create, findById, findByUserId, update status
- [ ] Old mock test deleted
- [ ] Gate check passes: `bun run test:integration`

**Tests**: integration
**Gate**: integration

**Verify**:
```bash
bun run test:integration -- src/modules/resumes/repository/resume-repository.integration.test.ts
```

**Commit**: `test(resumes): add resume-repository integration test`

---

### T13: SessionRepository integration test [P]

**What**: Replace mocked session repository test with integration test.
**Where**: `src/modules/interview/repository/session-repository.integration.test.ts`; delete `session-repository.test.ts`
**Depends on**: T9
**Reuses**: Scenarios from existing mock test
**Requirements**: TEST-04

**Done when**:

- [ ] Covers: create session, list by user, find by id
- [ ] Old mock test deleted
- [ ] Gate check passes: `bun run test:integration`

**Tests**: integration
**Gate**: integration

**Verify**:
```bash
bun run test:integration -- src/modules/interview/repository/session-repository.integration.test.ts
```

**Commit**: `test(interview): add session-repository integration test`

---

### T14: MessageRepository integration test [P]

**What**: Replace mocked message repository test with integration test.
**Where**: `src/modules/interview/repository/message-repository.integration.test.ts`; delete `message-repository.test.ts`
**Depends on**: T9
**Reuses**: Scenarios from existing mock test
**Requirements**: TEST-04

**Done when**:

- [ ] Covers: create message, list by session
- [ ] Old mock test deleted
- [ ] Gate check passes: `bun run test:integration`

**Tests**: integration
**Gate**: integration

**Verify**:
```bash
bun run test:integration -- src/modules/interview/repository/message-repository.integration.test.ts
```

**Commit**: `test(interview): add message-repository integration test`

---

### T15: ReviewRepository integration test [P]

**What**: Replace mocked review repository test with integration test.
**Where**: `src/modules/interview/repository/review-repository.integration.test.ts`; delete `review-repository.test.ts`
**Depends on**: T9
**Reuses**: Scenarios from existing mock test
**Requirements**: TEST-04

**Done when**:

- [ ] Covers: upsert review items, list by session
- [ ] Old mock test deleted
- [ ] Gate check passes: `bun run test:integration` (all 5 repos)
- [ ] Test count: 5 integration test files exist; 0 `repository/*.test.ts` (non-integration)

**Tests**: integration
**Gate**: integration

**Verify**:
```bash
bun run test:integration
```
Expected: 5 repository integration files pass.

**Commit**: `test(interview): add review-repository integration test`

---

### T16: Auth validation unit tests [P]

**What**: Unit tests for all auth Zod schemas.
**Where**: `src/modules/auth/validations/auth-schemas.test.ts`
**Depends on**: T8
**Reuses**: Patterns from `interview-schemas.test.ts`
**Requirements**: TEST-11

**Done when**:

- [ ] Tests signup (confirmPassword match), login, refresh, password-reset, request-reset
- [ ] Valid + invalid cases for each schema
- [ ] Gate check passes: `bun run test`

**Tests**: unit
**Gate**: quick

**Verify**:
```bash
bun run test -- src/modules/auth/validations/auth-schemas.test.ts
```

**Commit**: `test(auth): add validation schema unit tests`

---

### T17: Resume validation unit tests [P]

**What**: Unit tests for resume Zod schemas.
**Where**: `src/modules/resumes/validations/resume-schemas.test.ts`
**Depends on**: T8
**Reuses**: `interview-schemas.test.ts` patterns
**Requirements**: TEST-12

**Done when**:

- [ ] Tests `structuredSummarySchema` and related constraints
- [ ] Gate check passes: `bun run test`

**Tests**: unit
**Gate**: quick

**Verify**:
```bash
bun run test -- src/modules/resumes/validations/resume-schemas.test.ts
```

**Commit**: `test(resumes): add validation schema unit tests`

---

### T18: Review-items validation unit tests [P]

**What**: Unit tests for review-items Zod schemas.
**Where**: `src/modules/review-items/validations/review-items-schemas.test.ts`
**Depends on**: T8
**Reuses**: `interview-schemas.test.ts` patterns
**Requirements**: TEST-13

**Done when**:

- [ ] Tests list/output schemas
- [ ] Gate check passes: `bun run test`

**Tests**: unit
**Gate**: quick

**Verify**:
```bash
bun run test -- src/modules/review-items/validations/review-items-schemas.test.ts
```

**Commit**: `test(review-items): add validation schema unit tests`

---

### T19: Move server env schema tests [P]

**What**: Relocate `server.test.ts` to `server-schema.test.ts` as validation unit test.
**Where**: `src/config/env/server-schema.test.ts`; delete `server.test.ts`
**Depends on**: T8
**Reuses**: Existing test cases from `server.test.ts`
**Requirements**: TEST-14

**Done when**:

- [ ] All scenarios from `server.test.ts` preserved
- [ ] `server.test.ts` deleted
- [ ] Gate check passes: `bun run test`

**Tests**: unit
**Gate**: quick

**Verify**:
```bash
bun run test -- src/config/env/server-schema.test.ts
```

**Commit**: `test(config): move server env tests to server-schema`

---

### T20: Delete postgres-checkpointer unit test

**What**: Remove test for thin wrapper singleton (policy: none).
**Where**: delete `src/infrastructure/ai/checkpoint/postgres-checkpointer.test.ts`
**Depends on**: T8
**Reuses**: N/A
**Requirements**: TEST-06

**Done when**:

- [ ] File deleted
- [ ] Gate check passes: `bun run test`
- [ ] No other tests broken

**Tests**: none (deletion only)
**Gate**: quick

**Verify**:
```bash
bun run test
```

**Commit**: `test: remove postgres-checkpointer wrapper test`

---

### T21: Interview E2E suite [P]

**What**: E2E tests for interview HTTP routes with mocked LangGraph/LLM.
**Where**: `src/test/e2e/interview.e2e.test.ts`
**Depends on**: T10
**Reuses**: `auth-helpers.ts`; design §12 interview routes
**Requirements**: TEST-07

**Done when**:

- [ ] POST `/api/interview/sessions` — 201, 422, 401
- [ ] GET `/api/interview/sessions` — 200
- [ ] GET `/api/interview/sessions/:id/messages` — 200, 404
- [ ] POST stream — smoke (SSE headers; mocked graph)
- [ ] Gate check passes: `bun run test:e2e -- src/test/e2e/interview.e2e.test.ts`

**Tests**: e2e
**Gate**: e2e

**Verify**:
```bash
bun run test:e2e -- src/test/e2e/interview.e2e.test.ts
```

**Commit**: `test(interview): add e2e suite`

---

### T22: Resumes E2E suite [P]

**What**: E2E tests for resume upload and get-by-id.
**Where**: `src/test/e2e/resumes.e2e.test.ts`
**Depends on**: T10
**Reuses**: `auth-helpers.ts`; mock storage pattern
**Requirements**: TEST-08

**Done when**:

- [ ] POST `/api/resumes/` — 201 with PDF buffer; 401 without auth
- [ ] GET `/api/resumes/:id` — 200, 404, 404 other user
- [ ] Mocks for object storage (and queue if needed)
- [ ] Gate check passes: `bun run test:e2e -- src/test/e2e/resumes.e2e.test.ts`

**Tests**: e2e
**Gate**: e2e

**Verify**:
```bash
bun run test:e2e -- src/test/e2e/resumes.e2e.test.ts
```

**Commit**: `test(resumes): add e2e suite`

---

### T23: Review-items E2E suite [P]

**What**: E2E tests for review-items list endpoint.
**Where**: `src/test/e2e/review-items.e2e.test.ts`
**Depends on**: T10
**Reuses**: `auth-helpers.ts`; seed via Prisma or interview API
**Requirements**: TEST-09

**Done when**:

- [ ] GET `/api/review-items/` — 200 with items; 401 without auth
- [ ] Gate check passes: `bun run test:e2e -- src/test/e2e/review-items.e2e.test.ts`

**Tests**: e2e
**Gate**: e2e

**Verify**:
```bash
bun run test:e2e -- src/test/e2e/review-items.e2e.test.ts
```

**Commit**: `test(review-items): add e2e suite`

---

### T24: Delete controller unit tests

**What**: Remove all 4 controller test files after E2E coverage exists.
**Where**: Delete `auth-controller.test.ts`, `interview-controller.test.ts`, `resumes-controller.test.ts`, `review-items-controller.test.ts`
**Depends on**: T10, T21, T22, T23
**Reuses**: Design §13 deletion checklist
**Requirements**: TEST-03

**Done when**:

- [ ] Zero files matching `**/controller/*.test.ts`
- [ ] Gate check passes: `bun run test` (unit)
- [ ] Gate check passes: `bun run test:e2e` (4 suites)

**Tests**: none (deletion — coverage via E2E)
**Gate**: quick + e2e

**Verify**:
```bash
bun run test
bun run test:e2e
```
Expected: no controller tests; 4 E2E suites green.

**Commit**: `test: remove controller unit tests covered by e2e`

---

### T25: Write TESTING.md documentation

**What**: Document test policy, commands, Testcontainers prereqs, and examples.
**Where**: `.specs/codebase/TESTING.md`
**Depends on**: T24
**Reuses**: Spec policy table, design conventions, gate commands
**Requirements**: TEST-15

**Done when**:

- [ ] Layer → test type table
- [ ] File suffix conventions (`*.test.ts`, `*.integration.test.ts`, `*.e2e.test.ts`)
- [ ] npm scripts and Docker prerequisite
- [ ] Example snippets for unit, integration, E2E
- [ ] Optional `.withReuse()` note for local dev

**Tests**: none
**Gate**: full

**Verify**:
```bash
bun run test:all
```
Expected: all suites pass with Docker running.

**Commit**: `docs: add TESTING.md with test pyramid guide`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10

Phase 2 (Parallel — after T9):
  T9 complete, then concurrently:
    ├── T11 [P] user-repository
    ├── T12 [P] resume-repository
    ├── T13 [P] session-repository
    ├── T14 [P] message-repository
    └── T15 [P] review-repository

Phase 3 (Parallel — after T8):
  T8 complete, then concurrently:
    ├── T16 [P] auth validations
    ├── T17 [P] resume validations
    ├── T18 [P] review-items validations
    ├── T19 [P] server-schema
    └── T20 delete checkpointer test

Phase 4 (Parallel E2E — after T10):
  T10 complete, then concurrently:
    ├── T21 [P] interview e2e
    ├── T22 [P] resumes e2e
    └── T23 [P] review-items e2e
  Then sequential:
    T24 delete controller tests

Phase 5:
  T24 → T25
```

**Parallelism constraint**: T11–T15 share one PostgreSQL container per integration run (`fileParallelism: false`) — safe for **implementation** in parallel (different files), but gate check runs full `test:integration` after all complete.

---

## Task Granularity Check

| Task | Scope | Status |
|------|-------|--------|
| T1 | package.json deps + scripts | ✅ Granular |
| T2 | 1 helper file (migrate) | ✅ Granular |
| T3 | 1 helper file (truncate) | ✅ Granular |
| T4 | types + tsconfig | ✅ Granular |
| T5 | 1 setup file | ✅ Granular |
| T6 | 1 globalSetup file | ✅ Granular |
| T7 | 1 globalSetup file | ✅ Granular |
| T8 | vitest configs (cohesive wiring) | ✅ Granular |
| T9 | 1 helpers file | ✅ Granular |
| T10 | auth e2e refactor + helpers + delete database | ⚠️ 3 files — cohesive single migration |
| T11–T15 | 1 repository each | ✅ Granular |
| T16–T19 | 1 validation test file each | ✅ Granular |
| T20 | 1 file deletion | ✅ Granular |
| T21–T23 | 1 E2E suite each | ✅ Granular |
| T24 | 4 file deletions (single policy action) | ✅ Granular |
| T25 | 1 doc file | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
|------|-------------------|---------------|--------|
| T1 | None | Start | ✅ |
| T2 | T1 | T1 → T2 | ✅ |
| T3 | T1 | T1 → T3 | ✅ |
| T4 | T1 | T1 → T4 | ✅ |
| T5 | T4 | T4 → T5 | ✅ |
| T6 | T2, T5 | T2,T5 → T6 | ✅ |
| T7 | T2, T5 | T2,T5 → T7 | ✅ |
| T8 | T5, T6, T7 | T5,T6,T7 → T8 | ✅ |
| T9 | T3 | T3 → T9 | ✅ |
| T10 | T3, T8 | T8,T3 → T10 | ✅ |
| T11 | T9 | T9 → T11 [P] | ✅ |
| T12 | T9 | T9 → T12 [P] | ✅ |
| T13 | T9 | T9 → T13 [P] | ✅ |
| T14 | T9 | T9 → T14 [P] | ✅ |
| T15 | T9 | T9 → T15 [P] | ✅ |
| T16 | T8 | T8 → T16 [P] | ✅ |
| T17 | T8 | T8 → T17 [P] | ✅ |
| T18 | T8 | T8 → T18 [P] | ✅ |
| T19 | T8 | T8 → T19 [P] | ✅ |
| T20 | T8 | T8 → T20 | ✅ |
| T21 | T10 | T10 → T21 [P] | ✅ |
| T22 | T10 | T10 → T22 [P] | ✅ |
| T23 | T10 | T10 → T23 [P] | ✅ |
| T24 | T10, T21, T22, T23 | T21-23 → T24 | ✅ |
| T25 | T24 | T24 → T25 | ✅ |

---

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
|------|------------|-----------------|-----------|--------|
| T1 | package.json scripts | none | none | ✅ |
| T2–T9 | test infra helpers | none | none | ✅ |
| T10 | E2E routes (HTTP) | e2e | e2e | ✅ |
| T11–T15 | repository/ | integration | integration | ✅ |
| T16–T19 | validations/ + env schema | unit | unit | ✅ |
| T20 | checkpoint wrapper | none | none (delete) | ✅ |
| T21–T23 | HTTP routes | e2e | e2e | ✅ |
| T24 | controller/ | none | none (delete) | ✅ |
| T25 | docs | none | none | ✅ |

---

## Requirement Traceability

| Requirement | Task(s) |
|-------------|---------|
| TEST-01 | T4, T8 |
| TEST-02 | T1 |
| TEST-03 | T24 |
| TEST-04 | T11–T15 |
| TEST-05 | T2, T3, T5, T9 |
| TEST-06 | T20 |
| TEST-07 | T21 |
| TEST-08 | T22 |
| TEST-09 | T23 |
| TEST-10 | T10 |
| TEST-11 | T16 |
| TEST-12 | T17 |
| TEST-13 | T18 |
| TEST-14 | T19 |
| TEST-15 | T25 |
| TEST-16 | — (no change; mailer test kept) |
| TEST-17 | — (no change; policy applied in T20) |
| TEST-18 | T1 |
| TEST-19 | T6 |
| TEST-20 | T7 |
| TEST-21 | T10 |
| TEST-22 | T2, T10 |

**Coverage:** 22/22 requirements mapped to tasks ✅

---

## Status Tracker

| Task | Status | Gate Result | Notes |
|------|--------|-------------|-------|
| T1 | Done | pass | testcontainers deps + scripts |
| T2 | Done | pass | migrate-database helper |
| T3 | Done | pass | truncate-tables helper |
| T4 | Done | pass | vitest-env.d.ts + tsconfig |
| T5 | Done | pass | inject-env.setup.ts |
| T6 | Done | pass | integration globalSetup |
| T7 | Done | pass | e2e globalSetup (PG+Redis) |
| T8 | Done | pass | 3 vitest configs wired |
| T9 | Done | pass | integration helpers |
| T10 | Done | pass | auth E2E migrated; database.ts deleted |
| T11 | Done | pass | user-repository integration (10 tests) |
| T12 | Done | pass | resume-repository integration (8 tests) |
| T13 | Done | pass | session-repository integration (6 tests) |
| T14 | Done | pass | message-repository integration (2 tests) |
| T15 | Done | pass | review-repository integration (3 tests) |
| T16 | Done | pass | auth-schemas unit (23 tests) |
| T17 | Done | pass | resume-schemas unit (11 tests) |
| T18 | Done | pass | review-items-schemas unit (13 tests) |
| T19 | Done | pass | server-schema.test.ts moved |
| T20 | Done | pass | checkpointer test deleted |
| T21 | Done | pass | interview E2E (7 tests) |
| T22 | Done | pass | resumes E2E (5 tests) |
| T23 | Done | pass | review-items E2E (2 tests) |
| T24 | Done | pass | 4 controller tests deleted |
| T25 | Done | pass | TESTING.md written; test:all passes |

---

## Tools for Execute (defaults)

| Task type | MCP / Skill |
|-----------|-------------|
| Testcontainers setup | Context7 (`/testcontainers/testcontainers-node`) |
| Vitest config | Context7 if needed |
| All implementation | Shell (bun), filesystem edits |
| Gate checks | Shell |

Confirm or override tools before starting **implement**.
