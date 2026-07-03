# AI Mock Interview — Tasks

**Design**: `.specs/features/ai-mock-interview/design.md`
**Spec**: `.specs/features/ai-mock-interview/spec.md`
**Status**: In Progress (T1–T38 committed; T39 manual smoke pending)

---

## Execution Plan

### Phase 1: Foundation (Sequential)

Infrastructure and schema must land before feature modules.

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
```

### Phase 2: Shared Primitives (Sequential)

```
T8 → T9 → T10
```

### Phase 3: Infrastructure Adapters (Parallel after T3, T5)

```
        ┌→ T11 [P] ─┐
T10 ────┼→ T12 [P] ─┼──→ (feeds Phase 4–6)
        ├→ T13 [P] ─┤
        └→ T14 [P] ─┘
```

### Phase 4: Resumes Module (Mostly sequential)

```
T15 (parallel with T11/T12) ──→ T16 → T17 → T18 → T19 → T20 → T21
         ↑
    T11, T12 required before T17
```

### Phase 5: Interview Data Layer (Parallel after T2)

```
T2 ──┬→ T24 [P]
     ├→ T25 [P]  } schemas + repositories
     └→ T26 [P]
```

### Phase 6: Interview Services (Parallel after Phase 5 + T15)

```
T17,T24-T26 ──┬→ T27 [P]  (ReviewMergeService)
              └→ T28 [P]  (SessionService)
```

### Phase 7: LangGraph (Sequential)

```
T12,T14,T24-T28 ──→ T29 → T30 → T31 → T32 → T33 → T34 → T35
```

### Phase 8: Stream & HTTP (Sequential)

```
T35,T27,T28 ──→ T36 → T37 → T38
```

### Phase 9: App Wiring (Sequential)

```
T14,T35,T18,T38 ──→ T39
```

**Gate commands** (no `.specs/codebase/TESTING.md`; per design):

| Level | Command |
| ----- | ------- |
| Quick | `bun test` && `bun run check-types` |
| Full  | Same as quick in v1 (no integration DB in CI) |

---

## Task Breakdown

### T1: Add feature npm dependencies

**What**: Add LangChain, BullMQ, R2, multer packages to `package.json` and install.
**Where**: `package.json`
**Depends on**: None
**Reuses**: Existing Bun + Vitest toolchain
**Requirements**: AMI-04, AMI-05, AMI-13 (deps only)

**Tools**: MCP: NONE | Skill: context7 (optional, for version pins)

**Done when**:

- [x] All packages from design §Dependencies are listed with compatible versions
- [x] `bun install` succeeds
- [x] `bun run check-types` still passes (no code changes yet)

**Tests**: none
**Gate**: quick (types only)

---

### T2: Prisma schema — enums and AI mock interview models

**What**: Create `prisma/schema/ai-mock-interview.prisma` with enums and four models per design.
**Where**: `prisma/schema/ai-mock-interview.prisma`
**Depends on**: None
**Reuses**: `prisma/schema/user.prisma`, `schema.prisma` multi-file pattern
**Requirements**: AMI-03, AMI-07, AMI-12, AMI-23–25 (data model)

**Done when**:

- [x] Enums: `ResumeStatus`, `InterviewLevel`, `MessageRole`, `ReviewPriority`
- [x] Models: `Resume`, `InterviewSession`, `InterviewMessage`, `ReviewItem` with indexes and `@@map`
- [x] `ReviewItem` has `@@unique([userId, topic])`

**Tests**: none
**Gate**: quick

---

### T3: Extend User model relations

**What**: Add `resumes`, `interviewSessions`, `reviewItems` relations to `User`.
**Where**: `prisma/schema/user.prisma`
**Depends on**: T2
**Reuses**: Existing `User` model
**Requirements**: AMI-DEC-01

**Done when**:

- [x] Relations compile in Prisma schema
- [x] `bun run db:generate` succeeds

**Tests**: none
**Gate**: quick

---

### T4: Apply Prisma migration

**What**: Create and apply migration for new tables; verify LangGraph can share `DATABASE_URL`.
**Where**: `prisma/migrations/`
**Depends on**: T2, T3
**Reuses**: `bun run db:migrate` script
**Requirements**: AMI-03, AMI-13

**Done when**:

- [x] Migration SQL created and applied locally
- [x] `bun run db:generate` produces client types for new models
- [x] Existing auth tables unchanged

**Tests**: none
**Gate**: quick

---

### T5: Extend env schema and `.env.example`

**What**: Add OpenAI, R2, Redis, `RESUME_MAX_BYTES` to `server-schema.ts` and `.env.example`.
**Where**: `src/config/env/server-schema.ts`, `.env.example`
**Depends on**: None
**Reuses**: `@t3-oss/env-core` + Zod pattern in `server-schema.ts`
**Requirements**: AMI-01, AMI-04, AMI-15

**Done when**:

- [x] All env vars from design §Environment Variables validated at boot
- [x] Defaults match design (`gpt-4o`, `gpt-4o-mini`, `redis://localhost:6379`, 5MB)
- [x] `src/config/env/server.test.ts` updated if assertions break

**Tests**: unit (update existing env tests if present)
**Gate**: quick

---

### T6: Vitest env placeholders

**What**: Add test-safe defaults for new env vars in `vitest.setup.ts`.
**Where**: `vitest.setup.ts`
**Depends on**: T5
**Reuses**: Existing vitest setup pattern
**Requirements**: — (test infra)

**Done when**:

- [x] `bun test` runs without missing env errors for new keys

**Tests**: none (infra)
**Gate**: quick

---

### T7: Add Redis to Docker Compose

**What**: Add `redis:7-alpine` service with healthcheck per design.
**Where**: `docker-compose.yml`
**Depends on**: None
**Reuses**: Existing Postgres service pattern
**Requirements**: AMI-04

**Done when**:

- [x] `docker compose up -d redis` starts and passes healthcheck
- [x] Port `6379` exposed for local BullMQ

**Tests**: none
**Gate**: quick (manual compose up)

---

### T8: HTTP error classes for feature

**What**: Add `ConflictError` (409) and `ServiceUnavailableError` (503) to http-errors.
**Where**: `src/shared/errors/http-errors.ts`
**Depends on**: None
**Reuses**: Existing `BadRequestError`, `NotFoundError` hierarchy
**Requirements**: AMI-22, AMI-04 (503 on enqueue)

**Done when**:

- [x] Classes exported with correct `statusCode`
- [x] Error handler middleware maps them without changes (or minimal update if needed)

**Tests**: none
**Gate**: quick

---

### T9: SSE helper utilities

**What**: Implement `writeEvent` and `writeDone` for SSE framing.
**Where**: `src/shared/utils/sse.ts`
**Depends on**: None
**Reuses**: Express `Response` type from `express`
**Requirements**: AMI-11

**Done when**:

- [x] Emits `event: token|meta|error` + `data:` JSON lines
- [x] `writeDone` sends `data: [DONE]\n\n`
- [x] Unit tests cover event framing

**Tests**: unit
**Gate**: quick

---

### T10: `IObjectStorage` protocol

**What**: Define storage interface (`put`, `get`, `delete`) for R2 abstraction.
**Where**: `src/modules/resumes/protocols/object-storage.ts`
**Depends on**: None
**Reuses**: Auth `protocols/` pattern
**Requirements**: AMI-02, AMI-DEC-05

**Done when**:

- [x] Interface typed; no implementation in this task

**Tests**: none
**Gate**: quick

---

### T11: `R2ObjectStorage` adapter [P]

**What**: Implement `IObjectStorage` with `@aws-sdk/client-s3` and R2 endpoint config.
**Where**: `src/infrastructure/storage/r2-client.ts`
**Depends on**: T5, T10
**Reuses**: Env vars from T5
**Requirements**: AMI-02, AMI-SEC-02

**Done when**:

- [x] Path-style addressing; key stored, not public URL
- [x] Unit tests mock S3 client (put/get/delete called with expected keys)

**Tests**: unit
**Gate**: quick

---

### T12: `ResumeQueue` (BullMQ) [P]

**What**: Create `Queue<ResumeJobData>` named `resume-processing` with shared Redis connection.
**Where**: `src/infrastructure/queue/resume-queue.ts`
**Depends on**: T5, T7
**Reuses**: `ioredis` from env `REDIS_URL`
**Requirements**: AMI-04

**Done when**:

- [x] `add({ resumeId })` enqueues job
- [x] Unit test mocks Redis/Queue add

**Tests**: unit
**Gate**: quick

---

### T13: OpenAI model factory [P]

**What**: `createInterviewModel`, `createExtractionModel`, `createReviewModel` from env.
**Where**: `src/infrastructure/ai/openai-models.ts`
**Depends on**: T5
**Reuses**: `@langchain/openai` `ChatOpenAI`
**Requirements**: AMI-15, AMI-05, AMI-23, AMI-DEC-10

**Done when**:

- [x] Models read `OPENAI_MODEL_*` defaults from env
- [x] Unit test asserts factory uses env (mocked)

**Tests**: unit
**Gate**: quick

---

### T14: Postgres checkpointer singleton [P]

**What**: `PostgresSaver.fromConnString(DATABASE_URL)` with `setup()` export.
**Where**: `src/infrastructure/ai/checkpoint/postgres-checkpointer.ts`
**Depends on**: T5, T4
**Reuses**: `DATABASE_URL` from env
**Requirements**: AMI-13

**Done when**:

- [x] `getCheckpointer()` returns singleton
- [x] `setup()` is idempotent (mocked in test)

**Tests**: unit
**Gate**: quick

---

### T15: `structuredSummarySchema` (Zod)

**What**: Zod schema matching spec JSON shape for résumé structuring.
**Where**: `src/modules/resumes/validations/resume-schemas.ts`
**Depends on**: None
**Reuses**: Zod v4 patterns from auth validations
**Requirements**: AMI-05, AMI-07

**Done when**:

- [x] Schema validates spec example; rejects invalid shapes
- [x] Unit tests for valid/invalid payloads

**Tests**: unit
**Gate**: quick

---

### T16: `ResumeRepository`

**What**: Prisma CRUD for résumés (create processing, update ready/failed, find by id+userId).
**Where**: `src/modules/resumes/repository/resume-repository.ts`
**Depends on**: T4
**Reuses**: `src/infrastructure/database/index.ts` prisma singleton
**Requirements**: AMI-03, AMI-06, AMI-SEC-05

**Done when**:

- [x] All queries filter by `userId` where applicable
- [x] Unit tests with hoisted `vi.mock` prisma (match auth repository tests)

**Tests**: unit
**Gate**: quick

---

### T17: `ResumeService` + unit tests

**What**: Upload flow: validate PDF → insert → R2 put → enqueue; failure paths mark `failed`.
**Where**: `src/modules/resumes/service/resume-service.ts`, `resume-service.test.ts`
**Depends on**: T8, T11, T12, T15, T16
**Reuses**: `BadRequestError`, `ServiceUnavailableError`, `NotFoundError`
**Requirements**: AMI-01–06, AMI-SEC-01, AMI-SEC-02

**Done when**:

- [x] Mimetype + size validation before DB
- [x] R2 failure → `failed` + 502; Redis failure → `failed` + 503
- [x] Gate: `bun test resume-service` passes; types clean

**Tests**: unit
**Gate**: quick

---

### T18: Resumes factory

**What**: Wire `ResumeService` with R2, queue, repository.
**Where**: `src/factories/resumes/`
**Depends on**: T17, T11, T12, T16
**Reuses**: `src/factories/auth/*` pattern
**Requirements**: —

**Done when**:

- [x] `makeResumeService()` exported and used by controller factory

**Tests**: none
**Gate**: quick

---

### T19: `ResumesController` + routes + module index

**What**: `POST /` multipart upload, `GET /:id` status; register routes module.
**Where**: `src/modules/resumes/controller/`, `routes/`, `index.ts`, `resumes-controller.test.ts`
**Depends on**: T18, T5 (`RESUME_MAX_BYTES`)
**Reuses**: Auth controller try/catch; `makeCheckAuth()` default
**Requirements**: AMI-06, AMI-30, AMI-SEC-01

**Done when**:

- [x] Routes auto-discovered under `/api/resumes`
- [x] Controller tests assert 201/200/404 status codes with mocked service
- [x] Response omits `rawText`, `pdfUrl`, `errorMessage`

**Tests**: unit
**Gate**: quick

---

### T20: Resume processor handler

**What**: BullMQ job handler: download PDF → PDFLoader → structured LLM → update row.
**Where**: `src/infrastructure/queue/resume-processor.ts`
**Depends on**: T11, T13, T15, T16
**Reuses**: Same `IObjectStorage` as API
**Requirements**: AMI-05, AMI-04

**Done when**:

- [x] Success path sets `ready` + `structured_summary` + `raw_text`
- [x] Failure sets `failed` + `error_message`
- [x] Unit tests mock storage, LLM, prisma

**Tests**: unit
**Gate**: quick

---

### T21: Worker entry + npm scripts

**What**: `src/worker.ts` registers BullMQ worker; add `dev:worker` and `worker` scripts.
**Where**: `src/worker.ts`, `package.json`
**Depends on**: T12, T20
**Reuses**: AMI-DEC-04 separate process
**Requirements**: AMI-04

**Done when**:

- [x] `bun run dev:worker` starts consumer (concurrency 1)
- [x] Worker uses factory-injected processor
- [x] Types compile

**Tests**: none
**Gate**: quick

---

### T22: Interview Zod schemas

**What**: `createSessionSchema`, `streamMessageSchema`, `reviewGeneratorOutputSchema`.
**Where**: `src/modules/interview/validations/interview-schemas.ts`
**Depends on**: None
**Reuses**: Auth validation middleware pattern
**Requirements**: AMI-07–09, AMI-24, AMI-11

**Done when**:

- [x] Schemas exported; unit tests for boundaries (min content length, level enum)

**Tests**: unit
**Gate**: quick

---

### T23: `SessionRepository` [P]

**What**: Create/list/find session with ownership filters.
**Where**: `src/modules/interview/repository/session-repository.ts`
**Depends on**: T4
**Reuses**: Prisma mock test pattern
**Requirements**: AMI-07–09, AMI-27, AMI-SEC-05

**Done when**:

- [x] `maxTurns` set on create from level map (5/7/8)
- [x] Unit tests cover create + list + findByIdAndUserId

**Tests**: unit
**Gate**: quick

---

### T24: `MessageRepository` [P]

**What**: Insert human/ai messages; list by session ordered by `createdAt`.
**Where**: `src/modules/interview/repository/message-repository.ts`
**Depends on**: T4
**Requirements**: AMI-12, AMI-28

**Done when**:

- [x] Inserts include `userId` denormalized field
- [x] Unit tests mock prisma

**Tests**: unit
**Gate**: quick

---

### T25: `ReviewRepository` [P]

**What**: List by userId; case-insensitive topic lookup; upsert support for merge service.
**Where**: `src/modules/interview/repository/review-repository.ts`
**Depends on**: T4
**Requirements**: AMI-25, AMI-31, AMI-DEC-02

**Done when**:

- [x] `findByUserIdAndTopicCaseInsensitive` implemented (app-layer normalize)
- [x] Unit tests for lookup + list

**Tests**: unit
**Gate**: quick

---

### T26: `ReviewMergeService` + unit tests [P]

**What**: Deterministic upsert: max priority, bump safety net, latest description (AMI-DEC-06).
**Where**: `src/modules/interview/service/review-merge-service.ts`, `review-merge-service.test.ts`
**Depends on**: T25
**Reuses**: Priority rank + `bump()` from design
**Requirements**: AMI-25, AMI-31, AMI-DEC-02, AMI-DEC-06

**Done when**:

- [x] Tests cover: new insert, max priority, bump when LLM omits raise, case-insensitive match
- [x] Never decreases priority

**Tests**: unit
**Gate**: quick

---

### T27: `SessionService` + unit tests [P]

**What**: Create session (résumé ready + Zod summary), list sessions, get messages.
**Where**: `src/modules/interview/service/session-service.ts`, `session-service.test.ts`
**Depends on**: T15, T16, T22, T23, T24
**Reuses**: `NotFoundError`, `BadRequestError`
**Requirements**: AMI-07–09, AMI-27–29

**Done when**:

- [x] Wrong user / not ready résumé → 404
- [x] Malformed `structured_summary` → 400
- [x] `maxTurns` map correct per level

**Tests**: unit
**Gate**: quick

---

### T28: LangGraph `InterviewGraphState` type

**What**: State interface and initial state helpers per design.
**Where**: `src/infrastructure/ai/langgraph/interview-state.ts`
**Depends on**: T15, T22
**Requirements**: AMI-14, AMI-20

**Done when**:

- [x] Fields: messages, turnCount, maxTurns, level, userId, resumeSummary, isFinished, runReview
- [x] Types compile with `@langchain/core` messages

**Tests**: none
**Gate**: quick

---

### T29: Interviewer system prompt builder

**What**: Four-block prompt: guardrails → level → résumé summary → context.
**Where**: `src/modules/interview/prompts/interviewer-system-prompt.ts`
**Depends on**: T15
**Requirements**: AMI-16, AMI-21, AMI-SEC-06

**Done when**:

- [x] Guardrails appear first (keyword/order test or snapshot)
- [x] Uses `structuredSummary` only, not raw PDF text

**Tests**: unit
**Gate**: quick

---

### T30: Review and closing feedback prompt builders

**What**: Prompt templates for review items generation and final-turn closing feedback.
**Where**: `src/modules/interview/prompts/review-items-generator-prompt.ts`, `closing-feedback-prompt.ts`
**Depends on**: T15, T22
**Requirements**: AMI-23, AMI-31, AMI-18

**Done when**:

- [x] Review prompt includes transcript, existing items, structured summary
- [x] Closing feedback prompt uses session context only

**Tests**: none
**Gate**: quick

---

### T31: LangGraph stream token extraction

**What**: Map LangGraph `streamMode: "messages"` chunks to SSE token strings.
**Where**: `src/infrastructure/ai/langgraph/stream-message-tokens.ts`
**Depends on**: T28
**Requirements**: AMI-11

**Done when**:

- [x] Extracts string content from message stream chunks
- [x] Unit tests cover chunk shapes

**Tests**: unit
**Gate**: quick

---

### T32: `interviewer` node

**What**: ChatOpenAI stream node with system prompt.
**Where**: `src/infrastructure/ai/langgraph/nodes/interviewer-node.ts`
**Depends on**: T13, T29
**Requirements**: AMI-15, AMI-16

**Done when**:

- [x] Node streams interviewer tokens from `createInterviewModel()`
- [x] Uses `structuredSummary` only in system prompt (via T29)

**Tests**: none (covered by graph/stream tests)
**Gate**: quick

---

### T33: Review items generator + closing feedback nodes

**What**: Structured review output node and final-turn closing feedback node.
**Where**: `src/infrastructure/ai/langgraph/nodes/review-items-generator-node.ts`, `nodes/closing-feedback-node.ts`, `review-items-generator-adapter.ts`, `protocols/review-items-generator.ts`
**Depends on**: T13, T22, T30
**Requirements**: AMI-23, AMI-24, AMI-18

**Done when**:

- [x] Review node uses `createReviewModel()` + Zod schema from T22
- [x] Closing feedback node runs when `runReview` is true
- [x] Adapter isolates LLM from graph node

**Tests**: unit (graph/stream)
**Gate**: quick

---

### T34: `buildInterviewGraph` + interview graph factory

**What**: Compile graph: START → interviewer → (tools?) tool_executor → interviewer → END; PostgresSaver.
**Where**: `src/infrastructure/ai/langgraph/build-interview-graph.ts`, `src/factories/interview/interview-graph-factory.ts`
**Depends on**: T14, T28, T31–T33
**Requirements**: AMI-13, AMI-19

**Done when**:

- [x] Graph compiles with checkpointer
- [x] `thread_id` configurable via `sessionId`
- [x] Unit test compiles graph with mocked checkpointer

**Tests**: unit
**Gate**: quick

---

### T35: `InterviewStreamService` + unit tests

**What**: SSE orchestration: pre-checks, persist human, stream tokens, disconnect policy, final-turn review, meta events.
**Where**: `src/modules/interview/service/stream-service.ts`, `stream-service.test.ts`
**Depends on**: T9, T26–T27, T33–T34, T23–T24
**Reuses**: AMI-DEC-03 discard partial AI on abort
**Requirements**: AMI-10–22, AMI-18, AMI-SEC-04

**Done when**:

- [x] `ConflictError` before SSE if finished or `turnCount >= maxTurns`
- [x] Mock graph stream asserts `event:token`, `event:meta`, `[DONE]`
- [x] Final turn invokes review merge + `isFinished=true`
- [x] Client disconnect does not persist partial AI

**Tests**: unit
**Gate**: quick

---

### T36: Interview factories

**What**: Wire session, stream, repositories, graph, merge service.
**Where**: `src/factories/interview/`
**Depends on**: T27, T35, T34, T26
**Reuses**: Auth/resumes factory layout
**Requirements**: —

**Done when**:

- [x] `makeInterviewController()` receives all services

**Tests**: none
**Gate**: quick

---

### T37: `InterviewController` + routes + module index

**What**: Endpoints: POST/GET sessions, POST stream, GET messages.
**Where**: `src/modules/interview/controller/`, `routes/`, `index.ts`, `interview-controller.test.ts`
**Depends on**: T36, T22
**Reuses**: Validation middleware on JSON routes
**Requirements**: AMI-09–11, AMI-27–29, AMI-22

**Done when**:

- [x] Mounted under `/api/interview`
- [x] Controller tests: 201 session, 409 finished stream, 404 cross-user

**Tests**: unit
**Gate**: quick

---

### T38: App startup wiring

**What**: `checkpointer.setup()` on boot; multer on résumé upload route only.
**Where**: `src/config/app.ts` and/or `src/index.ts`, résumé routes
**Depends on**: T14, T19, T37
**Requirements**: AMI-01, AMI-13

**Done when**:

- [x] API starts without worker in-process
- [x] Multer memory storage respects `RESUME_MAX_BYTES`
- [x] `bun run check-types` passes

**Tests**: none
**Gate**: quick

---

### T39: End-to-end smoke verification (manual checklist)

**What**: Document and run local smoke path: Redis + Postgres + worker + API.
**Where**: N/A (verification only; optional note in feature spec STATE)
**Depends on**: T21, T38
**Requirements**: Success criteria in spec.md

**Done when**:

- [ ] Upload PDF → `processing` → worker → `ready`
- [ ] Create session → stream until finished → `review_items` exist
- [ ] Second stream on finished session returns 409
- [ ] User B cannot read User A résumé/session (404)

**Tests**: none (manual smoke)
**Gate**: full (all unit tests + manual checklist)

**Commit**: `feat: Complete AI mock interview manual smoke`

---

## Parallel Execution Map

```
Phase 1:  T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10

Phase 3:  T10 complete → parallel:
            T11 [P], T12 [P], T13 [P], T14 [P]

Phase 4:  T11,T12 → T15 → T16 → T17 → T18 → T19 → T20 → T21

Phase 5:  T4 → parallel: T22, T23 [P], T24 [P], T25 [P]
          (T22 independent; repos need T4 only)

Phase 6:  T17,T23-T25 → parallel: T26 [P], T27 [P]

Phase 7:  T28 → T29 → T30 → T31 → T32 → T33 → T34

Phase 8:  T35 → T36 → T37

Phase 9:  T38 → T39
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | package.json deps | ✅ Granular |
| T2–T4 | Prisma split (schema / user / migrate) | ✅ Granular |
| T5–T7 | One config surface each | ✅ Granular |
| T8–T9 | One utility / protocol | ✅ Granular |
| T11–T14 | One adapter each | ✅ Granular |
| T17 | Service + co-located tests | ✅ Granular |
| T19 | Controller + routes (cohesive HTTP slice) | ✅ OK cohesive |
| T34 | Graph compile + factory | ✅ Granular |
| T35 | Stream service + tests | ✅ Granular |
| T39 | Manual smoke only | ✅ Verification task |

---

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
| ---- | ------------------- | ------------- | ------ |
| T1 | None | Phase 1 start | ✅ |
| T2 | None | Phase 1 (parallel to T1 in diagram — T2 can start without T1) | ✅ |
| T3 | T2 | T2 → T3 | ✅ |
| T4 | T2, T3 | T3 → T4 | ✅ |
| T5 | None | Phase 1 (independent of T2) | ✅ |
| T6 | T5 | T5 → T6 | ✅ |
| T7 | None | Phase 1 parallel | ✅ |
| T8 | None | After T7 in phase 1 chain | ✅ |
| T9 | None | T8 → T9 | ✅ |
| T10 | None | Before T11 | ✅ |
| T11 | T5, T10 | T10 → T11 [P] | ✅ |
| T12 | T5, T7 | T10 → T12 [P] | ✅ |
| T13 | T5 | T10 → T13 [P] | ✅ |
| T14 | T5, T4 | T10 → T14 [P] | ✅ |
| T15 | None | Phase 4 start | ✅ |
| T16 | T4 | T4 → T16 | ✅ |
| T17 | T8, T11, T12, T15, T16 | T11,T12 → T17 | ✅ |
| T18 | T17, T11, T12, T16 | T17 → T18 | ✅ |
| T19 | T18, T5 | T18 → T19 | ✅ |
| T20 | T11, T13, T15, T16 | T19 → T20 (processor after controller OK) | ✅ |
| T21 | T12, T20 | T20 → T21 | ✅ |
| T22 | None | Phase 5 parallel | ✅ |
| T23–T25 | T4 | T4 → repos [P] | ✅ |
| T26 | T25 | Phase 6 parallel | ✅ |
| T27 | T15, T16, T22, T23, T24 | Phase 6 parallel | ✅ |
| T28–T34 | Per body | Phase 7 sequential | ✅ |
| T35 | T9, T23–T27, T33–T34 | Phase 8 | ✅ |
| T36 | T27, T35, T34, T26 | T35 → T36 | ✅ |
| T37 | T36, T22 | T36 → T37 | ✅ |
| T38 | T14, T19, T37 | Phase 9 | ✅ |
| T39 | T21, T38 | T38 → T39 | ✅ |

---

## Test Co-location Validation

Matrix source: design §Testing Strategy (no `TESTING.md` in repo).

| Task | Layer | Matrix Requires | Task Says | Status |
| ---- | ----- | --------------- | --------- | ------ |
| T5 | Env schema | unit if tests exist | unit | ✅ |
| T9 | SSE util | unit | unit | ✅ |
| T11 | R2 adapter | unit | unit | ✅ |
| T12 | Queue | unit | unit | ✅ |
| T13 | Model factory | unit | unit | ✅ |
| T14 | Checkpointer | unit | unit | ✅ |
| T15 | Zod schema | unit | unit | ✅ |
| T16 | Repository | unit (mock prisma) | unit | ✅ |
| T17 | ResumeService | unit | unit | ✅ |
| T19 | Controller | unit | unit | ✅ |
| T20 | Worker handler | unit | unit | ✅ |
| T22 | Zod schemas | unit | unit | ✅ |
| T23–T25 | Repositories | unit | unit | ✅ |
| T26–T27 | Services | unit | unit | ✅ |
| T29–T30 | Prompts | unit/snapshot | unit | ✅ |
| T31–T34 | LangGraph | unit (mocked) | unit | ✅ |
| T35 | StreamService | unit | unit | ✅ |
| T37 | Controller | unit | unit | ✅ |
| T1, T2–T4, T6–T8, T10, T18, T21, T28, T36, T38 | Infra/wiring | none / gate only | none | ✅ |
| T39 | Smoke | manual | none | ✅ |

---

## Requirement Traceability (tasks)

| Requirement | Task(s) |
| ----------- | ------- |
| AMI-01–06 | T5, T7, T10–T12, T15–T21 |
| AMI-07–09 | T22, T23, T27, T37 |
| AMI-10–22 | T9, T28–T35, T37, T38 |
| AMI-23–26, AMI-31 | T26, T30, T33, T35 |
| AMI-27–29 | T27, T37 |
| AMI-30 | T19 |
| AMI-SEC-01–06 | T17, T27, T29, T31, T35, T11 |
| AMI-13 | T4, T14, T34, T38 |

**Coverage:** 37 requirements mapped to T1–T39.

---

## Commit Sequence (one commit per task)

| Task | Commit message |
| ---- | -------------- |
| T1 | `Chore: Add feature npm dependencies` |
| T2 | `feat: Prisma schema — enums and AI mock interview models` |
| T3 | `feat: Extend User model relations for AI mock interview` |
| T4 | `feat: Apply Prisma migration for AI mock interview` |
| T5 | `feat: Extend env schema for AI mock interview` |
| T6 | `chore: Vitest env placeholders for AI mock interview` |
| T7 | `chore: Add Redis to Docker Compose` |
| T8 | `feat: HTTP error classes for AI mock interview` |
| T9 | `feat: SSE helper utilities` |
| T10 | `feat: IObjectStorage protocol` |
| T11 | `feat: R2ObjectStorage adapter` |
| T12 | `feat: ResumeQueue (BullMQ)` |
| T13 | `feat: OpenAI model factory` |
| T14 | `feat: Postgres checkpointer singleton` |
| T15 | `feat: structuredSummarySchema (Zod)` |
| T16 | `feat: ResumeRepository` |
| T17 | `feat: ResumeService` |
| T18 | `feat: Resumes factory` |
| T19 | `feat: ResumesController and routes` |
| T20 | `feat: Resume processor handler` |
| T21 | `feat: Worker entry and npm scripts` |
| T22 | `feat: Interview Zod schemas` |
| T23 | `feat: SessionRepository` |
| T24 | `feat: MessageRepository` |
| T25 | `feat: ReviewRepository` |
| T26 | `feat: ReviewMergeService` |
| T27 | `feat: SessionService` |
| T28 | `feat: LangGraph InterviewGraphState type` |
| T29 | `feat: Interviewer system prompt builder` |
| T30 | `feat: Review generator prompt builder` |
| T31 | `feat: LangGraph stream token extraction` |
| T32 | `feat: LangGraph interviewer node` |
| T33 | `feat: LangGraph review items generator node` |
| T34 | `feat: buildInterviewGraph and interview graph factory` |
| T35 | `feat: InterviewStreamService` |
| T36 | `feat: Interview factories` |
| T37 | `feat: InterviewController and routes` |
| T38 | `feat: App startup wiring for AI mock interview` |
| T39 | `feat: Complete AI mock interview manual smoke` (after checklist) |

---

## Execute: Tools (ask before implementation)

Before running **Execute**, confirm per task:

| Tool | Use for |
| ---- | ------- |
| **context7** MCP | LangGraph, BullMQ, AWS S3/R2, LangChain API accuracy |
| **codenavi** skill | If installed — brownfield pattern discovery |
| **NONE** | Prisma schema, Zod, Vitest mocks following auth module |

---

## Next Steps

1. **Review and approve** this task list (granularity, phase order, T39 smoke scope).
2. **Execute** starting at T1 (or T2 in parallel with T1 if deps install is slow).
3. Update **Status** to `Approved` → `In Progress` as tasks complete; check off `Done when` items in this file.
