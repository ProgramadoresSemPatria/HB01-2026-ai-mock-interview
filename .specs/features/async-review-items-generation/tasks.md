# Async Review Items Generation — Tasks

**Design**: `.specs/features/async-review-items-generation/design.md`  
**Spec**: `.specs/features/async-review-items-generation/spec.md`  
**Context**: `.specs/features/async-review-items-generation/context.md`  
**Status**: Complete (T1–T11 implemented; awaiting user commit)

**Test refs**: `backend/docs/TESTING.md`, `frontend/.specs/codebase/TESTING.md`

---

## Execution Plan

### Phase 1: Foundation (Parallel OK)

```
T1 [P] ──┐
         ├──→ Phase 2
T3 [P] ──┘
```

### Phase 2: Persistence (Sequential — integration not parallel-safe)

```
T1 → T2
```

### Phase 3: Core services (Parallel after T2 + T3)

```
        ┌→ T4 [P] ─┐
T2,T3 ──┼→ T5 [P] ─┼──→ Phase 4
        └→ T6 [P] ─┘
```

### Phase 4: HTTP + Worker (Parallel after Phase 3)

```
T4,T5,T6 ──┬→ T7 [P]
           └→ T8 [P]
```

### Phase 5: Frontend (Sequential)

```
T7 → T9 → T10 → T11
```

---

## Task Breakdown

### T1: Prisma `ReviewGenerationStatus` + session columns + migration [P]

**What**: Add enum `ReviewGenerationStatus { idle pending ready failed }`, columns `reviewGenerationStatus` (default `idle`) and `reviewGenerationError` on `InterviewSession`, generate client, migration with backfill `ready` where `is_finished = true`.
**Where**: `Backend/prisma/schema/ai-mock-interview.prisma`, `Backend/prisma/migrations/*`
**Depends on**: None
**Reuses**: Existing Prisma multi-file schema; `ResumeStatus` enum style
**Requirement**: ARG-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Enum + two columns with `@map` names from design
- [x] Migration applies; finished sessions backfilled to `ready`; unfinished stay `idle`
- [x] `bun run db:generate` succeeds
- [x] Gate check passes: `bun run check-types` (from `Backend/`)

**Tests**: none  
**Gate**: build

**Verify**:
`cd Backend && bun run db:generate && bun run check-types`

**Commit**: `feat(interview): add reviewGenerationStatus columns` (deferred — user commits at end)

---

### T2: `SessionRepository` status transitions + integration tests

**What**: Extend `markFinished` to set `reviewGenerationStatus=pending` and clear error; add `markReviewGenerationFailed`, `markReviewGenerationReady`, `markReviewGenerationPending`; cover with integration tests.
**Where**: `Backend/src/modules/interview/repository/session-repository.ts`, `session-repository.integration.test.ts`
**Depends on**: T1
**Reuses**: Existing session repository integration patterns (`resetDatabase`, seed helpers)
**Requirement**: ARG-02, ARG-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `markFinished` sets `isFinished=true`, locale, `pending`, `reviewGenerationError=null`
- [x] Failed / ready / pending helpers update only generation fields (do not reopen chat)
- [x] Integration tests cover finish→pending, failed, ready, pending-for-retry
- [x] Gate check passes: `bun run test:integration -- src/modules/interview/repository/session-repository.integration.test.ts`
- [x] Test count: existing session repo tests + ≥3 new cases (no silent deletions)

**Tests**: integration  
**Gate**: full

**Verify**:
`cd Backend && bun run test:integration -- src/modules/interview/repository/session-repository.integration.test.ts`

**Commit**: `feat(interview): persist review generation status transitions` (deferred — user commits at end)

---

### T3: Review-generation queue protocol + BullMQ infra [P]

**What**: Add `IReviewGenerationQueue` protocol and `review-generation-queue.ts` with queue name `review-generation`, `jobId=sessionId`, `attempts:3`, exponential backoff `delay:2000`, `add` + `remove`, reusing `redisConnection`.
**Where**: `Backend/src/modules/interview/protocols/review-generation-queue.ts`, `Backend/src/infrastructure/queue/review-generation-queue.ts`
**Depends on**: None
**Reuses**: `resume-queue.ts`, `modules/resumes/protocols/resume-queue.ts`
**Requirement**: ARG-06, ARG-11, ARG-13

**Tools**:

- MCP: NONE (BullMQ options already locked in design via Context7)
- Skill: NONE

**Done when**:

- [x] `add({ sessionId })` uses design job options
- [x] `remove(sessionId)` removes job by id when present
- [x] Shared `redisConnection` import (no second Redis client)
- [x] Gate check passes: `bun run check-types`

**Tests**: none (thin BullMQ wrapper — same as resume queue)  
**Gate**: build

**Verify**:
`cd Backend && bun run check-types`

**Commit**: `feat(queue): add review-generation BullMQ queue` (deferred — user commits at end)

---

### T4: `ReviewGenerationService` + unit tests [P]

**What**: Implement `process`, `enqueueForSession`, and `retry` per design (quota → permanent fail; transient → rethrow; ready/skip/idempotent; retry 409 rules).
**Where**: `Backend/src/modules/interview/service/review-generation-service.ts`, `review-generation-service.test.ts`
**Depends on**: T2, T3
**Reuses**: `IReviewItemsGenerator`, `ReviewMergeService.insertNewTopicsOnly`, `TokenUsageService`, resume `process` result style
**Requirement**: ARG-07, ARG-08, ARG-09, ARG-10, ARG-11, ARG-18

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `process` marks `ready` after generate+merge (including empty items)
- [x] Quota → `failed` + `retryable: false` (no throw)
- [x] Transient errors rethrown; status stays `pending`
- [x] Skip when missing / not finished / already `ready`
- [x] `enqueueForSession` add success → pending; add fail → failed
- [x] `retry` only when finished+failed; else ConflictError; ownership NotFoundError
- [x] Gate check passes: `bun run lint && bun run check-types && bun run test -- src/modules/interview/service/review-generation-service.test.ts`
- [x] Test count: ≥8 new unit tests

**Tests**: unit  
**Gate**: quick

**Verify**:
`cd Backend && bun run test -- src/modules/interview/service/review-generation-service.test.ts`

**Commit**: `feat(interview): add ReviewGenerationService for async extraction` (deferred — user commits at end)

---

### T5: Decouple final turn in `InterviewStreamService` + unit tests [P]

**What**: On final turn, `markFinished` then enqueue (no generator/merge/quota for review); SSE meta includes `reviewGenerationStatus`; remove generator/merge deps; inject queue (or `enqueueForSession`).
**Where**: `Backend/src/modules/interview/service/stream-service.ts`, `stream-service.test.ts`
**Depends on**: T2, T3
**Reuses**: Existing stream SSE helpers and abort handling
**Requirement**: ARG-01, ARG-02, ARG-03, ARG-04, ARG-05, ARG-12, ARG-16

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Final turn does not call `IReviewItemsGenerator` / merge
- [x] Final meta has `isFinished: true` and `reviewGenerationStatus` `pending` or `failed`
- [x] Mid-turn meta has no `reviewGenerationStatus`
- [x] Enqueue failure still finishes chat with `failed` status
- [x] Existing non-final stream tests still pass
- [x] Gate check passes: `bun run lint && bun run check-types && bun run test -- src/modules/interview/service/stream-service.test.ts`
- [x] Test count: existing stream tests updated + ≥3 new final-turn cases (no silent deletions)

**Tests**: unit  
**Gate**: quick

**Verify**:
`cd Backend && bun run test -- src/modules/interview/service/stream-service.test.ts`

**Commit**: `feat(interview): enqueue review generation after finish` (deferred — user commits at end)

---

### T6: `SessionService` getSession + SessionSummary fields + unit tests [P]

**What**: Extend `SessionSummary` with `reviewGenerationStatus` + `reviewGenerationError`; map in `listSessions`; add `getSession(userId, sessionId)` → summary or NotFoundError.
**Where**: `Backend/src/modules/interview/service/session-service.ts`, `session-service.test.ts`
**Depends on**: T2
**Reuses**: Existing `listSessions` mapping
**Requirement**: ARG-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] List and get return new fields
- [x] Unknown/other-user id → NotFoundError
- [x] Unit tests cover mapping + 404
- [x] Gate check passes: `bun run lint && bun run check-types && bun run test -- src/modules/interview/service/session-service.test.ts`
- [x] Test count: existing + ≥2 new cases

**Tests**: unit  
**Gate**: quick

**Verify**:
`cd Backend && bun run test -- src/modules/interview/service/session-service.test.ts`

**Commit**: `feat(interview): expose reviewGenerationStatus on session summary` (deferred — user commits at end)

---

### T7: Factories + GET session + retry routes + E2E [P]

**What**: Wire factories (`stream` uses queue; `makeReviewGenerationService`); add `GET /sessions/:sessionId` and `POST /sessions/:sessionId/review-generation/retry`; E2E for finish→pending meta, GET status, process→ready (call service or mock worker path), retry from failed (409 paths).
**Where**: `Backend/src/factories/interview/*`, `interview-controller.ts`, `interview-routes.ts`, `Backend/src/test/e2e/interview.e2e.test.ts` (and/or new `review-generation.e2e.test.ts`)
**Depends on**: T4, T5, T6
**Reuses**: Existing interview E2E mocks/helpers; `asyncHandler`; auth middleware
**Requirement**: ARG-15, ARG-16, ARG-18 (plus end-to-end ARG-01..13 smoke)

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Final-turn E2E: `isFinished` true, meta/status `pending`, generator **not** invoked in request path
- [x] After `ReviewGenerationService.process` (or equivalent test hook): status `ready`, items may be inserted
- [x] `GET /sessions/:id` returns status fields; 404 for other user
- [x] Retry: failed→pending; ready/pending/idle→409; unauthenticated→401
- [x] Gate check passes: `bun run test:e2e -- src/test/e2e/interview.e2e.test.ts` (and new file if split)
- [x] Test count: update obsolete “generate called on stream” assertion; ≥4 new E2E cases

**Tests**: e2e  
**Gate**: full

**Verify**:
`cd Backend && bun run test:e2e -- src/test/e2e/interview.e2e.test.ts`

**Commit**: `feat(interview): add session GET and review-generation retry API` (deferred — user commits at end)

---

### T8: Register review-generation worker + unit helpers [P]

**What**: In `src/worker.ts`, register second BullMQ Worker on `review-generation` (`concurrency: 1`); extract `processReviewJob` / `logReviewJobResult`; on permanent fail result do not throw; on throw let BullMQ retry; on exhausted `failed` event mark DB failed.
**Where**: `Backend/src/worker.ts`, `Backend/src/worker.test.ts` (or colocated helper tests), factory `makeReviewGenerationService`
**Depends on**: T4
**Reuses**: Existing resume worker pattern in `worker.ts`
**Requirement**: ARG-12, ARG-13, ARG-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Both resume and review workers start from `bun run worker`
- [x] Helper unit tests cover ready / failed-non-retryable / log paths
- [x] Exhausted-failure path marks `failed` (unit with mocked repo or documented handler test)
- [x] Gate check passes: `bun run lint && bun run check-types && bun run test -- src/worker.test.ts`
- [x] Test count: ≥3 new unit tests (extend existing worker tests if present)

**Tests**: unit  
**Gate**: quick

**Verify**:
`cd Backend && bun run test -- src/worker.test.ts`

**Commit**: `feat(worker): process review-generation BullMQ jobs` (deferred — user commits at end)

---

### T9: Frontend types + interview API clients

**What**: Extend `SessionSummary` and `StreamMeta`; add `getSession` and `retryReviewGeneration` on `interviewApi`.
**Where**: `frontend/src/types/interview.ts`, `frontend/src/lib/api/interview.ts`
**Depends on**: T7
**Reuses**: Existing `interviewApi` / `apiRequest` patterns
**Requirement**: ARG-15, ARG-16, ARG-17, ARG-18

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Types match backend contract
- [x] Clients call correct paths/methods
- [x] Gate check passes: `bun run lint && bun run check-types` (from `frontend/`)

**Tests**: none (FE matrix)  
**Gate**: quick

**Verify**:
`cd frontend && bun run lint && bun run check-types`

**Commit**: `feat(frontend): add session status and retry API clients` (deferred — user commits at end)

---

### T10: `useInterviewSession` poll hook

**What**: Add React Query hook that GETs session detail and `refetchInterval: 3000` while `reviewGenerationStatus === "pending"`; on transition to `ready`, invalidate `review-items` + sessions.
**Where**: `frontend/src/lib/query/hooks/use-interview-session.ts`, `frontend/src/lib/query/keys.ts` (if needed)
**Depends on**: T9
**Reuses**: `use-resume.ts` refetchInterval pattern; `queryKeys`
**Requirement**: ARG-17

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Polls only while pending
- [x] Invalidates review-items when becoming ready
- [x] Gate check passes: `bun run lint && bun run check-types` (from `frontend/`)

**Tests**: none (FE matrix)  
**Gate**: quick

**Verify**:
`cd frontend && bun run lint && bun run check-types`

**Commit**: `feat(frontend): poll interview session reviewGenerationStatus` (deferred — user commits at end)

---

### T11: Interview chat + review panel pending/failed/ready UX

**What**: Wire finish meta + `useInterviewSession`; stop treating finish as review-items ready; panel shows preparing / error+retry / grid; Review tab still available at `isFinished`.
**Where**: `frontend/src/features/interview/interview-chat.tsx`, `interview-review-panel.tsx` (and small related components if needed)
**Depends on**: T10
**Reuses**: Existing Review tab / `InterviewReviewPanel` / toast patterns
**Requirement**: ARG-17, ARG-18

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] No blind `invalidateQueries(["review-items"])` as sole ready signal on finish
- [x] Pending → preparing UI; failed → error + retry calling API; ready → grid
- [x] Chat remains locked when failed
- [x] Gate check passes: `bun run lint && bun run check-types && bun run build` (from `frontend/`)

**Tests**: none (FE matrix)  
**Gate**: build

**Verify**:
`cd frontend && bun run lint && bun run check-types && bun run build`

**Commit**: `feat(frontend): handle async review generation states in interview UI` (deferred — user commits at end)

---

## Parallel Execution Map

```
Phase 1 (Parallel):
  ├── T1 [P]  Prisma
  └── T3 [P]  Queue

Phase 2 (Sequential):
  T1 → T2     SessionRepository (integration)

Phase 3 (Parallel after T2+T3):
  ├── T4 [P]  ReviewGenerationService (unit)
  ├── T5 [P]  StreamService (unit)
  └── T6 [P]  SessionService (unit)

Phase 4 (Parallel after Phase 3):
  ├── T7 [P]  HTTP + E2E
  └── T8 [P]  Worker (unit)

Phase 5 (Sequential):
  T7 → T9 → T10 → T11
```

**Note:** T7 and T8 are marked `[P]` relative to each other only. Integration (T2) and E2E (T7) must not run concurrently with other integration/E2E suites (shared Testcontainers — `fileParallelism: false`).

---

## Pre-Approval Validation

### Check 1: Task Granularity

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | Prisma schema + migration | ✅ Granular |
| T2 | Repository methods + integration tests | ✅ Granular |
| T3 | Queue protocol + infra file | ✅ Granular |
| T4 | One service + unit tests | ✅ Granular |
| T5 | One service refactor + unit tests | ✅ Granular |
| T6 | One service + unit tests | ✅ Granular |
| T7 | Routes/factories + E2E (HTTP layer co-located) | ✅ OK cohesive |
| T8 | Worker registration + helper unit tests | ✅ Granular |
| T9 | FE types + API clients | ✅ Granular |
| T10 | One hook | ✅ Granular |
| T11 | Chat + panel UX wiring | ✅ OK cohesive (same feature surface) |

### Check 2: Diagram–Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
| ---- | ----------------- | ------------- | ------ |
| T1 | None | Phase 1 root | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | None | Phase 1 root | ✅ Match |
| T4 | T2, T3 | T2,T3 → T4 | ✅ Match |
| T5 | T2, T3 | T2,T3 → T5 | ✅ Match |
| T6 | T2 | T2 → T6 (via T2,T3 fan-in; T6 does not need T3) | ✅ Match |
| T7 | T4, T5, T6 | Phase 3 → T7 | ✅ Match |
| T8 | T4 | T4 → T8 | ✅ Match |
| T9 | T7 | T7 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |

T4/T5/T6 do not depend on each other → valid `[P]`. T7/T8 do not depend on each other → valid `[P]`.

### Check 3: Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1 | Prisma schema | none | none | ✅ OK |
| T2 | `repository/` | integration | integration | ✅ OK |
| T3 | Thin queue wrapper | none | none | ✅ OK |
| T4 | `service/` | unit | unit | ✅ OK |
| T5 | `service/` | unit | unit | ✅ OK |
| T6 | `service/` | unit | unit | ✅ OK |
| T7 | HTTP routes (+ controller) | e2e (controller none) | e2e | ✅ OK |
| T8 | worker helpers / pure infra | unit | unit | ✅ OK |
| T9 | `src/lib/api/` | none | none | ✅ OK |
| T10 | `src/lib/query/hooks/` | none | none | ✅ OK |
| T11 | `src/features/` | none | none | ✅ OK |

---

## Requirement Traceability (Tasks)

| Requirement ID | Task(s) |
| -------------- | ------- |
| ARG-01 | T5, T7 |
| ARG-02 | T2, T5 |
| ARG-03 | T5, T7 |
| ARG-04 | T5, T7 |
| ARG-05 | T5 |
| ARG-06 | T3, T5 |
| ARG-07 | T4, T5 |
| ARG-08 | T4, T8 |
| ARG-09 | T4 |
| ARG-10 | T4, T8 |
| ARG-11 | T3, T4 |
| ARG-12 | T5, T8 |
| ARG-13 | T3, T8 |
| ARG-14 | T1, T2 |
| ARG-15 | T6, T7, T9 |
| ARG-16 | T5, T7, T9 |
| ARG-17 | T9, T10, T11 |
| ARG-18 | T4, T7, T11 |

**Coverage:** 18 total, 18 mapped to tasks, 0 unmapped

---

## Gate Commands Reference

| Gate | Backend | Frontend |
| ---- | ------- | -------- |
| quick | `bun run lint && bun run check-types && bun run test` (or file-scoped `test --`) | `bun run lint && bun run check-types` |
| full | `bun run test:integration` / `bun run test:e2e` / `bun run test:all` | N/A (same as build) |
| build | `bun run check-types` (+ `db:generate` for T1) | `bun run lint && bun run check-types && bun run build` |
