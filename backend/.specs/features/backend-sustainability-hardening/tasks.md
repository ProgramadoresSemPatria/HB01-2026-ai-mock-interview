# Backend Sustainability Hardening — Tasks

**Design**: `.specs/features/backend-sustainability-hardening/design.md`  
**Spec**: `.specs/features/backend-sustainability-hardening/spec.md`  
**Status**: Complete (T1–T21 verified 2026-05-30)

---

## Gate Commands (Backend/)

| Gate | Command |
|------|---------|
| **quick** | `bun run lint && bun run check-types && bun run test` |
| **full** | `bun run test:all` (Docker required) |

Run all commands from `Backend/`.

---

## Execution Plan

### Phase 1: asyncHandler foundation (sequential → parallel routes)

```
T1 ──→ T2
  ├──→ T3 [P]
  ├──→ T4 [P]
  └──→ T5 [P]
```

### Phase 2: Interview adapter DI (sequential)

```
T6 ──→ T7 ──→ T8
```

### Phase 3: CI + logging (parallel)

```
T1..T5 complete, then:
  ├── T9  [P] ──→ T10
  └── T11 [P]
```

### Phase 4: DTOs (sequential chains)

```
T12 ──→ T13 ──→ T14 (README)
T15 ──→ T16
              └──→ T17 (after T15; T16 ∥ T17 optional — T17 only needs T15)
```

Practical order: `T12 → T13 → T14 → T15 → T16 → T17`

### Phase 5: P3 polish (parallel after Phase 4)

```
  ├── T18 [P]
  ├── T19 [P]
  └── T20 [P] (depends T10 for doc cross-ref optional)
```

### Phase 6: Release gate

```
T21 (full gate + spec status)
```

---

## Parallel Execution Map

```
Phase 1:  T1 → (T2 ∥ T3 ∥ T4 ∥ T5)
Phase 2:  T6 → T7 → T8
Phase 3:  T9 → T10  |  T11
Phase 4:  T12 → T13 → T14 → T15 → T16 → T17
Phase 5:  T18 | T19 | T20
Phase 6:  T21
```

---

## Task Breakdown

### T1: Create `asyncHandler` utility

**What**: Implement `asyncHandler` and unit tests; export from `@/shared`.  
**Where**: `src/shared/utils/async-handler.ts`, `src/shared/utils/async-handler.test.ts`, `src/shared/index.ts`  
**Depends on**: None  
**Reuses**: Express `RequestHandler` pattern from design  
**Requirements**: SUS-03, SUS-05

**Done when**:

- [ ] `asyncHandler` catches rejected promises and calls `next(error)`
- [ ] Unit test: resolved handler does not call `next` with error
- [ ] Unit test: rejected handler calls `next` with error
- [ ] Exported from `src/shared/index.ts`
- [ ] Gate: `bun run lint && bun run check-types && bun run test`
- [ ] Test count: all unit tests pass (no deletions)

**Tests**: unit (`shared/utils` → middlewares/util layer)  
**Gate**: quick  

**Commit**: `refactor(shared): add asyncHandler for route error forwarding`

---

### T2: Migrate auth module to `asyncHandler`

**What**: Wrap auth route handlers; remove `try/catch` and `next` from `AuthController`; remove dead `NotFoundError` catch in `requestPasswordReset`.  
**Where**: `src/modules/auth/routes/auth-routes.ts`, `src/modules/auth/controller/auth-controller.ts`  
**Depends on**: T1  
**Reuses**: `asyncHandler` from `@/shared`  
**Requirements**: SUS-04

**Done when**:

- [ ] All 5 auth routes use `asyncHandler(controller.method)`
- [ ] `AuthController` methods signature `(req, res) => Promise<void>` only
- [ ] No `try/catch` solely for `next(error)` in auth controller
- [ ] Gate: quick
- [ ] Existing `auth-service.test.ts` / schema tests still pass

**Tests**: none (controllers covered by E2E per `docs/TESTING.md`)  
**Gate**: quick  

**Commit**: `refactor(auth): use asyncHandler in routes`

---

### T3: Migrate interview module to `asyncHandler` [P]

**What**: Same as T2 for interview routes/controller (4 handlers).  
**Where**: `src/modules/interview/routes/interview-routes.ts`, `src/modules/interview/controller/interview-controller.ts`  
**Depends on**: T1  
**Requirements**: SUS-04

**Done when**:

- [ ] All interview routes wrapped with `asyncHandler`
- [ ] `InterviewController` without boilerplate `try/catch`
- [ ] Gate: quick

**Tests**: none (E2E covers controllers)  
**Gate**: quick  

**Commit**: `refactor(interview): use asyncHandler in routes`

---

### T4: Migrate resumes module to `asyncHandler` [P]

**What**: Same as T2 for resumes (2 handlers).  
**Where**: `src/modules/resumes/routes/resumes-routes.ts`, `src/modules/resumes/controller/resumes-controller.ts`  
**Depends on**: T1  
**Requirements**: SUS-04

**Done when**:

- [ ] Both resume routes use `asyncHandler`
- [ ] `ResumesController` cleaned
- [ ] Gate: quick

**Tests**: none  
**Gate**: quick  

**Commit**: `refactor(resumes): use asyncHandler in routes`

---

### T5: Migrate review-items module to `asyncHandler` [P]

**What**: Same as T2 for review-items (1 handler).  
**Where**: `src/modules/review-items/routes/review-items-routes.ts`, `src/modules/review-items/controller/review-items-controller.ts`  
**Depends on**: T1  
**Requirements**: SUS-04

**Done when**:

- [ ] `GET /` route uses `asyncHandler`
- [ ] `ReviewItemsController` cleaned
- [ ] Gate: quick

**Tests**: none  
**Gate**: quick  

**Commit**: `refactor(review-items): use asyncHandler in routes`

---

### T6: Require `ReviewRepository` in adapter constructor

**What**: Remove default `new ReviewRepository()`; make `reviewRepository` a required constructor parameter.  
**Where**: `src/infrastructure/ai/langgraph/review-items-generator-adapter.ts`  
**Depends on**: T2, T3, T4, T5 (routes stable; optional — can run after T1 only)  
**Reuses**: `IReviewItemsGenerator` protocol  
**Requirements**: SUS-06

**Done when**:

- [ ] No default instantiation of `ReviewRepository` in adapter
- [ ] TypeScript compiles (factory updated in T7)
- [ ] Gate: quick (may fail until T7 — pair T6+T7 in same commit if preferred)

**Tests**: none (adapter tested in T8)  
**Gate**: quick (with T7)  

**Commit**: _(squash with T7 if single commit)_ `refactor(interview): inject ReviewRepository into review adapter`

---

### T7: Wire shared `ReviewRepository` in stream factory

**What**: Single `ReviewRepository` instance passed to `ReviewMergeService` and `ReviewItemsGeneratorAdapter`.  
**Where**: `src/factories/interview/stream-service-factory.ts`  
**Depends on**: T6  
**Reuses**: `makeReviewMergeService` pattern (inline merge with shared repo)  
**Requirements**: SUS-07

**Done when**:

- [ ] `makeInterviewStreamService()` creates one `reviewRepository` and passes to merge + adapter
- [ ] Gate: quick
- [ ] No duplicate `new ReviewRepository()` inside adapter

**Tests**: none  
**Gate**: quick  

**Commit**: `refactor(interview): share ReviewRepository in stream factory`

---

### T8: Unit test `ReviewItemsGeneratorAdapter`

**What**: Test adapter calls `listByUserId` and passes mapped items to generator node (mocked).  
**Where**: `src/infrastructure/ai/langgraph/review-items-generator-adapter.test.ts`  
**Depends on**: T7  
**Reuses**: Vitest mocks pattern from `build-interview-graph.test.ts`  
**Requirements**: SUS-06, SUS-08

**Done when**:

- [ ] Test with mock `ReviewRepository` and mock generator function
- [ ] Gate: quick
- [ ] At least 2 test cases (happy path + empty existing items)

**Tests**: unit  
**Gate**: quick  

**Commit**: `test(interview): cover ReviewItemsGeneratorAdapter DI`

---

### T9: Add GitHub Actions quality workflow [P]

**What**: Create `backend-ci.yml` at monorepo root with lint, types, unit tests in `Backend/`.  
**Where**: `.github/workflows/backend-ci.yml` (repo root: `HB01-2026-nome_projeto/`)  
**Depends on**: None (independent)  
**Reuses**: `package.json` scripts  
**Requirements**: SUS-01

**Done when**:

- [ ] Workflow triggers on `pull_request` and push to default branch
- [ ] Steps: checkout, setup Bun, `bun install`, `lint`, `check-types`, `test` with `working-directory: Backend`
- [ ] No secrets required for unit job
- [ ] YAML valid (review locally)

**Tests**: none (CI config)  
**Gate**: quick (local); workflow verified on first push  

**Commit**: `ci: add backend quality workflow`

---

### T10: Document CI in TESTING.md

**What**: Add section "CI vs Husky vs local" describing quality job and developer expectations.  
**Where**: `docs/TESTING.md`  
**Depends on**: T9  
**Requirements**: SUS-02

**Done when**:

- [ ] Documents `backend-ci.yml` steps
- [ ] Clarifies pre-commit = unit only; full = `test:all` before release
- [ ] Gate: quick (doc-only; run quick for safety)

**Tests**: none  
**Gate**: quick  

**Commit**: `docs: document backend CI gates`

---

### T11: Unify 5xx logging in error handler [P]

**What**: Remove duplicate `console.error` in `errorHandler`; keep `logger.error` only; add/update unit test.  
**Where**: `src/shared/middlewares/error-handler-middleware.ts`, `src/shared/middlewares/error-handler-middleware.test.ts` (create if missing)  
**Depends on**: None  
**Requirements**: SUS-13

**Done when**:

- [ ] 5xx path logs once via `logger.error` with stack in meta
- [ ] 4xx `HttpError` not logged as server error
- [ ] Unit test asserts `logger.error` called once for 500
- [ ] Gate: quick

**Tests**: unit  
**Gate**: quick  

**Commit**: `fix(shared): dedupe 5xx error logging`

---

### T12: Add `ReviewItemRecord` and repository mapper

**What**: Domain type + private `toReviewItemRecord`; repository methods return `ReviewItemRecord`.  
**Where**: `src/modules/interview/types/review-item-record.ts`, `src/modules/interview/repository/review-repository.ts`, `src/modules/interview/repository/review-repository.integration.test.ts`  
**Depends on**: T8  
**Requirements**: SUS-11

**Done when**:

- [ ] `ReviewItemRecord` type exported
- [ ] `ReviewRepository` has no Prisma types in public method signatures
- [ ] Integration tests updated and pass: `bun run test:integration -- src/modules/interview/repository/review-repository.integration.test.ts`
- [ ] Gate: quick

**Tests**: integration (repository layer)  
**Gate**: quick + integration file above  

**Commit**: `refactor(interview): map ReviewRepository to ReviewItemRecord`

---

### T13: Update review consumers to `ReviewItemRecord`

**What**: `ReviewItemsService`, `ReviewMergeService`, adapter use `ReviewItemRecord`; remove Prisma import from `review-items-service.ts`.  
**Where**: `src/modules/review-items/service/review-items-service.ts`, `src/modules/interview/service/review-merge-service.ts`, `review-items-generator-adapter.ts`, related `*.test.ts`  
**Depends on**: T12  
**Requirements**: SUS-11

**Done when**:

- [ ] `grep prisma/generated review-items-service.ts` → no matches
- [ ] `review-items-service.test.ts` passes if present; else gate quick
- [ ] `review-merge-service` tests pass
- [ ] Gate: quick

**Tests**: unit (services)  
**Gate**: quick  

**Commit**: `refactor: use ReviewItemRecord in review services`

---

### T14: Add interview module README (bounded context)

**What**: Document ownership and allowed imports for `review-items` consumers (SUS-DEC-01 A).  
**Where**: `src/modules/interview/README.md`  
**Depends on**: T13  
**Requirements**: SUS-12

**Done when**:

- [ ] README lists `ReviewRepository`, schemas, `ReviewItemRecord` as public surface
- [ ] README states `review-items` module owns HTTP list API only
- [ ] Gate: quick

**Tests**: none  
**Gate**: quick  

**Commit**: `docs(interview): document review bounded context`

---

### T15: Add `ResumeRecord` and repository mapper

**What**: Domain `ResumeStatus` union + `ResumeRecord`; repository returns records; update integration tests.  
**Where**: `src/modules/resumes/types/resume-record.ts`, `src/modules/resumes/repository/resume-repository.ts`, `resume-repository.integration.test.ts`  
**Depends on**: T13 (avoid parallel edits to interview/resume in same PR moment — sequential)  
**Requirements**: SUS-09

**Done when**:

- [ ] `ResumeRepository` public API uses `ResumeRecord`
- [ ] Prisma enums only inside repository implementation
- [ ] Integration tests pass for resume repository
- [ ] Gate: quick + `bun run test:integration -- src/modules/resumes/repository/resume-repository.integration.test.ts`

**Tests**: integration  
**Gate**: quick + integration file  

**Commit**: `refactor(resumes): map ResumeRepository to ResumeRecord`

---

### T16: Decouple `SessionService` from Prisma resume types

**What**: Use `ResumeRecord.status` (domain union) instead of `ResumeStatus` from Prisma.  
**Where**: `src/modules/interview/service/session-service.ts`, `session-service.test.ts` if exists  
**Depends on**: T15  
**Requirements**: SUS-10

**Done when**:

- [ ] No `prisma/generated` import in `session-service.ts`
- [ ] Session creation still rejects non-ready resumes with same messages
- [ ] Gate: quick

**Tests**: unit  
**Gate**: quick  

**Commit**: `refactor(interview): use ResumeRecord in SessionService`

---

### T17: Decouple `ResumeService` from Prisma types

**What**: Service uses `ResumeRecord` from repository; `ResumePreview.status` uses domain `ResumeStatus`; update `resume-service.test.ts`.  
**Where**: `src/modules/resumes/service/resume-service.ts`, `resume-service.test.ts`  
**Depends on**: T15  
**Reuses**: existing `toResumePreview` / `toResumeDetail`  
**Requirements**: SUS-09

**Done when**:

- [ ] No `prisma/generated` import in `resume-service.ts`
- [ ] `resume-service.test.ts` uses domain status constants
- [ ] Gate: quick

**Tests**: unit  
**Gate**: quick  

**Commit**: `refactor(resumes): use ResumeRecord in ResumeService`

---

### T18: Add coverage script and Vitest config [P]

**What**: `test:coverage` script; `coverage` block in `vitest.config.ts`; document in TESTING.md.  
**Where**: `package.json`, `vitest.config.ts`, `docs/TESTING.md`  
**Depends on**: T10  
**Requirements**: SUS-14

**Done when**:

- [ ] `bun run test:coverage` completes and outputs report
- [ ] TESTING.md documents command
- [ ] No coverage threshold enforced in CI
- [ ] Gate: quick

**Tests**: none (tooling)  
**Gate**: quick  

**Commit**: `chore: add vitest coverage script`

---

### T19: Extract and test worker job processor [P]

**What**: Export `processResumeJob` (and optionally `logResumeJobResult`); unit test with mocked `ResumeService`.  
**Where**: `src/worker.ts`, `src/worker.test.ts`  
**Depends on**: T17  
**Requirements**: SUS-15

**Done when**:

- [ ] Worker file calls extracted function
- [ ] Tests cover `ready`, `failed`, `skipped` log paths (at least via `logResumeJobResult` or process mock)
- [ ] Gate: quick

**Tests**: unit  
**Gate**: quick  

**Commit**: `test(worker): add unit tests for resume job handling`

---

### T20: Add integration/e2e CI workflow [P]

**What**: `backend-integration-e2e.yml` on `main` push + `workflow_dispatch`.  
**Where**: `.github/workflows/backend-integration-e2e.yml`  
**Depends on**: T9, T10  
**Requirements**: SUS-16

**Done when**:

- [ ] Job runs `test:integration` and `test:e2e` in `Backend/`
- [ ] Uses runner with Docker
- [ ] TESTING.md mentions optional/main gate
- [ ] Gate: full locally before relying on CI

**Tests**: none (CI)  
**Gate**: full (local verification)  

**Commit**: `ci: add backend integration and e2e workflow`

---

### T21: Final validation and spec traceability

**What**: Run full suite; update `spec.md` requirement statuses to Verified; mark tasks Done.  
**Where**: `.specs/features/backend-sustainability-hardening/spec.md`, `tasks.md`  
**Depends on**: T1–T20  
**Requirements**: SUS-01–SUS-16 (verification)

**Done when**:

- [ ] `bun run lint && bun run check-types && bun run test` passes
- [ ] `bun run test:all` passes (Docker)
- [ ] `grep prisma/generated src/modules/**/service/*.ts` → no matches (SUS-09–11)
- [ ] E2E suites: auth, resumes, interview, review-items pass
- [ ] Spec traceability table updated

**Tests**: e2e (verification run)  
**Gate**: full  

**Commit**: `chore: complete backend sustainability hardening`

---

## Requirement Traceability

| Requirement | Task(s) |
|-------------|---------|
| SUS-01 | T9 |
| SUS-02 | T10 |
| SUS-03 | T1 |
| SUS-04 | T2, T3, T4, T5 |
| SUS-05 | T1 |
| SUS-06 | T6, T8 |
| SUS-07 | T7 |
| SUS-08 | T8, T21 |
| SUS-09 | T15, T17 |
| SUS-10 | T16 |
| SUS-11 | T12, T13 |
| SUS-12 | T14 |
| SUS-13 | T11 |
| SUS-14 | T18 |
| SUS-15 | T19 |
| SUS-16 | T20 |

**Coverage:** 16 requirements → 21 tasks, all mapped ✅

---

## Task Granularity Check

| Task | Scope | Status |
|------|-------|--------|
| T1 | 1 util + 1 test file | ✅ |
| T2–T5 | 1 module routes + controller | ✅ |
| T6 | 1 adapter constructor | ✅ |
| T7 | 1 factory file | ✅ |
| T8 | 1 test file | ✅ |
| T9 | 1 workflow file | ✅ |
| T10 | 1 doc section | ✅ |
| T11 | 1 middleware + test | ✅ |
| T12–T13 | 1 aggregate DTO chain | ✅ |
| T14 | 1 README | ✅ |
| T15–T17 | 1 module/layer each | ✅ |
| T18–T20 | 1 concern each | ✅ |
| T21 | validation only | ✅ |

---

## Diagram-Definition Cross-Check

| Task | Depends on (body) | Diagram | Status |
|------|-------------------|---------|--------|
| T1 | None | Root | ✅ |
| T2 | T1 | T1→T2 | ✅ |
| T3 | T1 | T1→T3 | ✅ |
| T4 | T1 | T1→T4 | ✅ |
| T5 | T1 | T1→T5 | ✅ |
| T6 | T2–T5 | After Phase 1 | ✅ |
| T7 | T6 | T6→T7 | ✅ |
| T8 | T7 | T7→T8 | ✅ |
| T9 | None | Phase 3 parallel | ✅ |
| T10 | T9 | T9→T10 | ✅ |
| T11 | None | Phase 3 parallel | ✅ |
| T12 | T8 | Phase 4 | ✅ |
| T13 | T12 | T12→T13 | ✅ |
| T14 | T13 | T13→T14 | ✅ |
| T15 | T13 | T13→T15 | ✅ |
| T16 | T15 | T15→T16 | ✅ |
| T17 | T15 | T15→T17 | ✅ |
| T18 | T10 | Phase 5 | ✅ |
| T19 | T17 | Phase 5 | ✅ |
| T20 | T9, T10 | Phase 5 | ✅ |
| T21 | T1–T20 | Phase 6 | ✅ |

---

## Test Co-location Validation

| Task | Layer modified | Matrix requires | Task Tests | Status |
|------|----------------|-----------------|------------|--------|
| T1 | shared util | unit | unit | ✅ |
| T2–T5 | controller/routes | none / E2E indirect | none | ✅ |
| T6–T7 | adapter/factory | none / thin | none | ✅ |
| T8 | infra adapter | unit | unit | ✅ |
| T9–T10 | CI/docs | none | none | ✅ |
| T11 | middleware | unit | unit | ✅ |
| T12 | repository | integration | integration | ✅ |
| T13 | service | unit | unit | ✅ |
| T14 | README | none | none | ✅ |
| T15 | repository | integration | integration | ✅ |
| T16–T17 | service | unit | unit | ✅ |
| T18 | config | none | none | ✅ |
| T19 | worker | unit | unit | ✅ |
| T20 | CI | none | none | ✅ |
| T21 | verification | e2e run | e2e | ✅ |

---

## MCPs / Skills (Execute phase)

Per task, default tooling:

| Task range | Tools |
|------------|-------|
| T1–T8, T11–T19 | Filesystem edits + `bun run` gates |
| T9–T10, T20 | GitHub workflow YAML |
| Research if needed | Context7 MCP for Bun/Vitest/Actions |

No mandatory external skills beyond **tlc-spec-driven** Execute workflow.

---

## Status Tracking

| Task | Status |
|------|--------|
| T1 | Done |
| T2 | Done |
| T3 | Done |
| T4 | Done |
| T5 | Done |
| T6 | Done |
| T7 | Done |
| T8 | Done |
| T9 | Done |
| T10 | Done |
| T11 | Done |
| T12 | Done |
| T13 | Done |
| T14 | Done |
| T15 | Done |
| T16 | Done |
| T17 | Done |
| T18 | Done |
| T19 | Done |
| T20 | Done |
| T21 | Done |
