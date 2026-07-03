# AI Rate Limit by User — Tasks

**Design**: `.specs/features/ai-rate-limit-by-user/design.md`
**Status**: Complete

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2 → T3
```

### Phase 2: Route Wiring + E2E (Parallel OK after Phase 1)

```
       ┌→ T4 [P] ─┐
T3 ────┤          ├──→ T6
       └→ T5 [P] ─┘
```

### Phase 3: Cross-Cutting Verification + Docs (Sequential)

```
T6 → T7
```

---

## Task Breakdown

### T1: Extract testable `keyGenerator` + injectable-store `aiRateLimiter` factory function

**What**: Refactor `rate-limit-middleware.ts` so `aiRateLimiter` is no longer a fixed instance — export `aiRateLimitKeyGenerator(req): string` (throws when `req.userId` is missing) and `makeAiRateLimiter(store: Store): RequestHandler` (accepts any `express-rate-limit` `Store`). `authRateLimiter` stays untouched.
**Where**: `src/shared/middlewares/rate-limit-middleware.ts`, `src/shared/middlewares/rate-limit-middleware.test.ts`
**Depends on**: None
**Reuses**: Existing `windowMs`/`max`/`message`/headers config already in `aiRateLimiter`; `MemoryStore` from `express-rate-limit` for tests
**Requirement**: AIRL-01, AIRL-04, AIRL-05, AIRL-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `aiRateLimitKeyGenerator(req)` returns `String(req.userId)` when set, throws `Error` when `req.userId` is `undefined`
- [x] `makeAiRateLimiter(store)` builds a `rateLimit({...})` middleware using `aiRateLimitKeyGenerator` as `keyGenerator` and the injected `store`, preserving `windowMs`/`max` from `env`, the exact `429` message body, `standardHeaders: true`, `legacyHeaders: false`
- [x] `authRateLimiter` export and behavior unchanged (no regression)
- [x] Unit test: `aiRateLimitKeyGenerator` — returns key for valid `req.userId`, throws for missing `req.userId`
- [x] Unit test: `makeAiRateLimiter(new MemoryStore())` — two different `userId`s hitting the same mounted route each get independent quotas (proves per-user, not per-IP, keying)
- [x] Unit test: `makeAiRateLimiter(store)` with a fake `store.increment` that rejects — request fails with `500` via `errorHandler` (no silent bypass; covers AIRL-11 without needing real Redis)
- [x] Unit test: request missing `req.userId` on a route mounted with `makeAiRateLimiter` — fails with `500`, not a fallback by IP
- [x] Gate check passes: `bun run lint && bun run check-types && bun run test`
- [x] Test count: existing `rate-limit-middleware.test.ts` tests (1) + at least 4 new tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Verify**:
`bun run test -- src/shared/middlewares/rate-limit-middleware.test.ts` — all tests green, including the 4 new cases above.

**Commit**: `refactor(rate-limit): extract testable keyGenerator and injectable-store aiRateLimiter`

---

### T2: Add `rate-limit-redis` dependency

**What**: Add the `rate-limit-redis` package to `package.json` dependencies (pinned with `^`, following existing version style).
**Where**: `package.json`
**Depends on**: None
**Reuses**: Existing dependency declaration style (`"package": "^x.y.z"`)
**Requirement**: AIRL-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `rate-limit-redis` present in `dependencies` with a valid current version
- [ ] `bun install` completes without errors and lockfile is updated
- [ ] Gate check passes: `bun run check-types` (no type errors introduced by the new package being present but unused yet)

**Tests**: none
**Gate**: build

**Verify**:
`bun install && bun run check-types` — exits 0.

**Commit**: `chore(deps): add rate-limit-redis`

---

### T3: Create `ai-rate-limiter-factory.ts` + update `src/shared/index.ts` barrel

**What**: Create `makeAiRateLimiter(): RequestHandler` in a new factory file that builds a `RedisStore` (prefix `rl:ai:`, `sendCommand` via `(redisConnection as Redis).call(...)`) and passes it to `makeAiRateLimiter(store)` from T1. Remove the old fixed `aiRateLimiter` export from `src/shared/index.ts` (keep `authRateLimiter`).
**Where**: `src/factories/shared/ai-rate-limiter-factory.ts` (new), `src/shared/index.ts` (modify)
**Depends on**: T1, T2
**Reuses**: `redisConnection` from `src/infrastructure/queue/resume-queue.ts` (same cast pattern as `src/infrastructure/queue/redis-health.ts`); `make*Factory()` pattern from `src/factories/auth/check-auth-factory.ts`
**Requirement**: AIRL-09, AIRL-11, AIRL-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `src/factories/shared/ai-rate-limiter-factory.ts` exports a function that constructs `RedisStore({ sendCommand: (command, ...args) => (redisConnection as Redis).call(command, ...args), prefix: "rl:ai:" })` and returns `makeAiRateLimiter(store)` from T1
- [ ] No second Redis connection is created — `redisConnection` singleton is reused as-is
- [ ] `src/shared/index.ts` no longer exports `aiRateLimiter`; `authRateLimiter` export unchanged
- [ ] Unit test (co-located `ai-rate-limiter-factory.test.ts`): constructing the store used by the factory has `prefix === "rl:ai:"` (RedisStore's constructor does not open a connection, so this is verifiable without real Redis — covers AIRL-12 cheaply)
- [ ] No TypeScript errors from the `redisConnection as Redis` cast
- [ ] Gate check passes: `bun run lint && bun run check-types && bun run test`
- [ ] Test count: 1 new test passes (no silent deletions)

**Tests**: unit
**Gate**: quick

**Verify**:
`bun run test -- src/factories/shared/ai-rate-limiter-factory.test.ts` — prefix assertion passes. `bun run check-types` — exits 0.

**Commit**: `feat(rate-limit): wire RedisStore via ai-rate-limiter-factory`

---

### T4: Apply per-route `aiRateLimiter` in `interview-routes.ts` + update interview E2E rate-limit tests [P]

**What**: Remove `router.use(aiRateLimiter)`; apply the limiter (imported from `@/factories/shared/ai-rate-limiter-factory`) only to `POST /sessions` and `POST /sessions/:sessionId/stream`. `GET /sessions`, `GET /sessions/:sessionId/messages`, `DELETE /sessions/:sessionId`, and `POST /sessions/:sessionId/feedback` must NOT receive it. Update the existing `describe("AI rate limiting")` block in the E2E suite to match the new scope and add the per-user isolation + unaffected-GET assertions.
**Where**: `src/modules/interview/routes/interview-routes.ts`, `src/test/e2e/interview.e2e.test.ts`
**Depends on**: T3
**Reuses**: `validate`, `asyncHandler`, `makeInterviewController` (unchanged); existing `vi.resetModules()` + dynamic `import("@/config/app")` pattern already used in the current `describe("AI rate limiting")` block
**Requirement**: AIRL-01, AIRL-02, AIRL-03, AIRL-05, AIRL-06, AIRL-07, AIRL-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `router.use(aiRateLimiter)` removed from `interview-routes.ts`
- [ ] `aiRateLimiter` (from the factory) applied directly to `POST /sessions` and `POST /sessions/:sessionId/stream` only
- [ ] `GET /sessions`, `GET /sessions/:sessionId/messages`, `DELETE /sessions/:sessionId`, `POST /sessions/:sessionId/feedback` have no `aiRateLimiter`
- [ ] E2E test updated: exceeding `RATE_LIMIT_AI_MAX` via repeated `POST /sessions` (or `POST /sessions/:sessionId/stream`) returns `429` with the existing message body (AIRL-05, AIRL-06)
- [ ] E2E test added: two different authenticated users (same `supertest` app/origin) each reach `RATE_LIMIT_AI_MAX` independently — neither's `429` is triggered by the other's requests (AIRL-01, AIRL-02, AIRL-03)
- [ ] E2E test added: after a `429` on the AI-limited route, `GET /api/interview/sessions` still returns `200` (AIRL-07)
- [ ] Existing `maxTurns` / `ConflictError` E2E tests still pass unmodified — no interference between rate limiter and domain rule (AIRL-08)
- [ ] Gate check passes: `bun run test:e2e -- src/test/e2e/interview.e2e.test.ts`
- [ ] Test count: existing interview E2E tests + at least 2 new tests pass (no silent deletions)

**Tests**: e2e
**Gate**: full

**Verify**:
`bun run test:e2e -- src/test/e2e/interview.e2e.test.ts` — all tests green, including the 2 new "AI rate limiting" cases.

**Commit**: `feat(interview): scope aiRateLimiter to AI-invoking routes only`

---

### T5: Apply per-route `aiRateLimiter` in `resumes-routes.ts` + update resumes E2E rate-limit tests [P]

**What**: Remove `router.use(aiRateLimiter)`; apply the limiter (imported from `@/factories/shared/ai-rate-limiter-factory`) only to `POST /` (upload). `GET /`, `GET /:id`, `DELETE /:id` must NOT receive it. Add a per-user isolation test to the existing `describe("AI rate limiting")` block.
**Where**: `src/modules/resumes/routes/resumes-routes.ts`, `src/test/e2e/resumes.e2e.test.ts`
**Depends on**: T3
**Reuses**: `resumeUploadMiddleware`, `asyncHandler`, `makeResumesController` (unchanged); existing `vi.resetModules()` + dynamic `import("@/config/app")` pattern already used in the current `describe("AI rate limiting")` block
**Requirement**: AIRL-01, AIRL-02, AIRL-03, AIRL-05, AIRL-06, AIRL-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `router.use(aiRateLimiter)` removed from `resumes-routes.ts`
- [ ] `aiRateLimiter` (from the factory) applied directly to `POST /` only
- [ ] `GET /`, `GET /:id`, `DELETE /:id` have no `aiRateLimiter`
- [ ] Existing E2E test (exceeding `RATE_LIMIT_AI_MAX` on upload → `429` with existing message body) still passes (AIRL-05, AIRL-06)
- [ ] E2E test added: two different authenticated users each reach `RATE_LIMIT_AI_MAX` independently on `POST /` without affecting each other (AIRL-01, AIRL-02, AIRL-03)
- [ ] E2E test added: after a `429` on upload, `GET /api/resumes` still returns `200` (AIRL-07)
- [ ] Gate check passes: `bun run test:e2e -- src/test/e2e/resumes.e2e.test.ts`
- [ ] Test count: existing resumes E2E tests + at least 2 new tests pass (no silent deletions)

**Tests**: e2e
**Gate**: full

**Verify**:
`bun run test:e2e -- src/test/e2e/resumes.e2e.test.ts` — all tests green, including the 2 new "AI rate limiting" cases.

**Commit**: `feat(resumes): scope aiRateLimiter to AI-invoking routes only`

---

### T6: E2E test — shared Redis count across multiple API instances

**What**: New E2E suite that boots two independent `Express` apps via `createApp()` (both pointing at the same Testcontainers `REDIS_URL`) and proves that requests from the same user against either instance count toward one combined `RATE_LIMIT_AI_MAX` quota.
**Where**: `src/test/e2e/rate-limit-redis.e2e.test.ts` (new)
**Depends on**: T4, T5
**Reuses**: `vi.resetModules()` + dynamic `import("@/config/app")` pattern; `authenticate()` / `authHeader()` helpers from `src/test/helpers/`
**Requirement**: AIRL-09, AIRL-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Test creates two `Express` apps via two calls to `createApp()` (same process, sharing `REDIS_URL`, simulating two API instances)
- [ ] Authenticates one user, alternates `POST /api/interview/sessions` (or another AI route) calls between the two app instances
- [ ] Asserts the combined count across both instances triggers `429` at exactly `RATE_LIMIT_AI_MAX`, proving the count is shared via Redis and not per-process
- [ ] Gate check passes: `bun run test:e2e -- src/test/e2e/rate-limit-redis.e2e.test.ts`
- [ ] Test count: 1 new test passes

**Tests**: e2e
**Gate**: full

**Verify**:
`bun run test:e2e -- src/test/e2e/rate-limit-redis.e2e.test.ts` — test green.

**Commit**: `test(rate-limit): verify shared Redis count across multiple API instances`

---

### T7: Update `docs/TESTING.md` with `aiRateLimiter` testing notes

**What**: Add a short note documenting that `aiRateLimiter` now counts by `userId` (not IP), unit tests use an injected `MemoryStore` (never real `RedisStore`), and E2E rate-limit tests reuse the same Testcontainers Redis already used for BullMQ.
**Where**: `docs/TESTING.md`
**Depends on**: T6
**Reuses**: Existing "Mocking Guidelines" / "Scenario coverage" sections style
**Requirement**: (documentation — no direct AIRL-ID)

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `docs/TESTING.md` documents the `userId`-based keying, the `MemoryStore`-injection unit test strategy, and the Redis reuse for E2E rate-limit tests
- [ ] No broken links/formatting (renders correctly as markdown)
- [ ] Gate check passes: `bun run lint`

**Tests**: none
**Gate**: quick

**Verify**:
Manual review of the rendered `docs/TESTING.md` section; `bun run lint` exits 0.

**Commit**: `docs(testing): document userId-based aiRateLimiter test strategy`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2 ──→ T3

Phase 2 (Parallel):
  T3 complete, then:
    ├── T4 [P]
    └── T5 [P]  } Can run simultaneously (different files, no shared mutable state)

Phase 3 (Sequential):
  T4, T5 complete, then:
    T6 ──→ T7
```

**Parallelism constraint:** A task marked `[P]` must have ALL of these:

- No unfinished dependencies
- Required test type is parallel-safe (per TESTING.md Parallelism Assessment)
- No shared mutable state with other `[P]` tasks in the same phase

T4 and T5 touch disjoint files (`interview-routes.ts`/`interview.e2e.test.ts` vs. `resumes-routes.ts`/`resumes.e2e.test.ts`) and each spins its own Testcontainers instance when run in isolation via a sub-agent — no shared mutable state between them.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Extract keyGenerator + injectable-store factory function | 1 file (+ its test file) | ✅ Granular |
| T2: Add `rate-limit-redis` dependency | 1 file (`package.json`) | ✅ Granular |
| T3: Create `ai-rate-limiter-factory.ts` + update barrel | 2 related files, 1 cohesive change | ✅ Granular (2-3 related things, cohesive) |
| T4: Wire interview routes + update interview E2E tests | 2 related files, 1 cohesive change (route scope + its own verification) | ✅ Granular |
| T5: Wire resumes routes + update resumes E2E tests | 2 related files, 1 cohesive change | ✅ Granular |
| T6: New E2E test for multi-instance Redis sharing | 1 file | ✅ Granular |
| T7: Update `docs/TESTING.md` | 1 file | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ----------------------- | -------------- | ------ |
| T1 | None | None (start of chain) | ✅ Match |
| T2 | None | T1 → T2 (sequential, no data dependency but ordered per Tips) | ✅ Match |
| T3 | T1, T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 [P] | ✅ Match |
| T5 | T3 | T3 → T5 [P] | ✅ Match |
| T6 | T4, T5 | T4, T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | ---------------------------- | ---------------- | ---------- | ------ |
| T1: `rate-limit-middleware.ts` | `middlewares/` | Unit | unit | ✅ OK |
| T2: `package.json` | Dependency manifest (no code layer) | N/A | none | ✅ OK |
| T3: `ai-rate-limiter-factory.ts` | Thin wrapper (factory, no business logic) | None | unit (cheap prefix check, no Redis) | ✅ OK — stricter than required, not a violation |
| T4: `interview-routes.ts` (HTTP routes) | HTTP routes (Express + supertest) | E2E | e2e | ✅ OK |
| T5: `resumes-routes.ts` (HTTP routes) | HTTP routes (Express + supertest) | E2E | e2e | ✅ OK |
| T6: new E2E suite | HTTP routes (cross-cutting, Express + supertest) | E2E | e2e | ✅ OK |
| T7: `docs/TESTING.md` | Documentation (no code layer) | N/A | none | ✅ OK |

All checks pass — no restructuring needed.

---

## Requirement Traceability (updated from spec.md)

| Requirement ID | Story | Covered by | Status |
| --------------- | ----- | ---------- | ------ |
| AIRL-01 | Contagem por `userId` | T1, T4, T5 | Done |
| AIRL-02 | Cota independente entre usuários no mesmo IP | T4, T5 | Done |
| AIRL-03 | Cota compartilhada entre IPs do mesmo usuário | T1 (key ignores IP by construction), T4, T5 | Done |
| AIRL-04 | Falha explícita quando `userId` ausente | T1 | Done |
| AIRL-05 | Contrato de resposta 429 preservado | T1, T4, T5 | Done |
| AIRL-06 | Limiter aplicado só a rotas que chamam IA | T4, T5 | Done |
| AIRL-07 | Rotas de leitura/feedback fora do limite de IA | T4, T5 | Done |
| AIRL-08 | `maxTurns` (ConflictError) independente do rate limiter | T4 (regression check, no code change) | Done |
| AIRL-09 | Store Redis compartilhado | T2, T3 | Done |
| AIRL-10 | Contagem correta entre múltiplas instâncias da API | T6 | Done |
| AIRL-11 | Falha explícita se Redis indisponível | T1 (unit, fake failing store), T3 (default `passOnStoreError`) | Done |
| AIRL-12 | Prefixo de chave dedicado no Redis | T3 | Done |

**Coverage**: 12 total, 12 mapped to tasks, 0 unmapped ✅

---

## MCPs and Skills — Confirm Before Execute

No MCP or skill dependency was identified for any task (all changes are local TypeScript/Express/Prisma-free code + Vitest tests). Before starting Execute, please confirm:

1. Should any task use `context7` MCP to double-check `rate-limit-redis`/`ioredis` API during implementation (beyond the research already captured in `design.md`)?
2. Are there any other skills installed that should be preferred (e.g., a testing or git-commit skill) for running gate checks / creating the atomic commits per task?

---

**Próximos passos:**

1. Revisar e aprovar `tasks.md` (granularidade, dependências, cobertura de testes e rastreabilidade — todas as validações acima já passaram).
2. Responder as perguntas de MCPs/Skills acima.
3. **Execute** — Fase 1 sequencial (T1 → T2 → T3), depois Fase 2 em paralelo (T4 `[P]` + T5 `[P]`), depois Fase 3 sequencial (T6 → T7).
