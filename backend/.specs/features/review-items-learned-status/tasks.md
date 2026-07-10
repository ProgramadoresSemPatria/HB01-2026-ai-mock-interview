# Review Items Learned Status — Tasks

**Design**: `.specs/features/review-items-learned-status/design.md`
**Spec**: `.specs/features/review-items-learned-status/spec.md`
**Status**: Complete (executed 2026-07-07)

---

## Test Coverage Matrix (source: `docs/TESTING.md`)

| Code layer | Test type | File suffix | Runner | Parallel-Safe |
|---|---|---|---|---|
| `validations/`, `service/`, pure infra (protocols/nodes/prompts) | Unit | `*.test.ts` | `bun run test` | Yes (mocked deps) |
| `repository/` | Integration | `*.integration.test.ts` | `bun run test:integration` | **No** (`fileParallelism: false`, shared container) |
| HTTP routes | E2E | `*.e2e.test.ts` | `bun run test:e2e` | **No** (shared containers) |
| `controller/`, route wiring | None — covered by E2E | — | — | N/A |
| Prisma schema / migration | None | — | `bun run check-types`, `prisma generate` | N/A |

**Gate check commands:**

| Gate | Command |
|---|---|
| `quick` | `bun run lint && bun run check-types && bun run test` |
| `integration` | `bun run test:integration` |
| `e2e` | `bun run test:e2e` |

---

## SPEC_DEVIATION flagged before execution

Design's Prisma model block for `ReviewSessionItem` (design.md "New: `ReviewSessionItem`") does **not** list the `pendingQuestion` column, but the design's own Note under `ReviewSessionStreamService` (RIL-DES, "Note on `pendingQuestion`") requires it for the stream service to survive multi-request resumption. **T1 includes `pendingQuestion String?` on `ReviewSessionItem`** to resolve this gap — flagged here rather than silently added a second time.

---

## Execution Plan

### Phase 1: Prisma Foundation (mostly parallel)

```
T1 [P] ──┐
T3 [P] ──┼──→ T2
T14 [P] ─┤
T15 [P] ─┘
```

T2 only depends on T1 (migration needs the schema file); T3/T14/T15 have no dependency on T1 but are grouped in this wave since they have no other prerequisites either.

### Phase 2: Post-migration parallel branches

```
T2 ──┬──→ T4 ──┬──→ T5 [P] ──────────────┐
     │         └──→ T6 [P]               │
     ├──→ T10 [P] ──┐                    │
     ├──→ T11 [P] ──┼──→ T7 [P] ──→ T8 [P] ──→ T9 [P]
     └──→ T12 ───────┴──→ T13 ──┬──→ T16 [P] ──→ T17 ─┐
                                 └──→ T19 [P] ─────────┤
                                                        ├──→ T20 ──→ T21 ──┬──→ T22 [P]
                                                                            └──→ T23
```

### Phase 3: Integration (sequential)

```
T20 → T21 → { T22 [P], T23 }
```

---

## Task Breakdown

### T1: Prisma schema — enums, `ReviewItem` columns, `ReviewSession`, `ReviewSessionItem` [P]

**What**: Add `ReviewItemStatus`/`ReviewSessionStatus` enums, `status`/`learnedAt` columns + index on `ReviewItem`, new `ReviewSession`/`ReviewSessionItem` models (including `pendingQuestion String?` — see SPEC_DEVIATION above), and the `User.reviewSessions` back-relation.
**Where**: `prisma/schema/ai-mock-interview.prisma`, `prisma/schema/*.prisma` (User model)
**Depends on**: None
**Reuses**: Existing `ReviewPriority` enum, existing `ReviewItem` model conventions (`@map`, `@@index`)
**Requirement**: RIL-01–19 (schema is the shared foundation)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `ReviewItemStatus` (`active`, `learned`) and `ReviewSessionStatus` (`in_progress`, `pending_review`, `completed`) enums defined
- [ ] `ReviewItem.status` (default `active`) + `ReviewItem.learnedAt` + `@@index([userId, status])` added
- [ ] `ReviewSession` model added with `userId`, `status`, `createdAt`, `evaluatedAt`, `completedAt`
- [ ] `ReviewSessionItem` model added with all snapshot/turn/suggested/confirmed columns **plus `pendingQuestion String?`**
- [ ] `User.reviewSessions ReviewSession[]` relation added
- [ ] `bun run db:generate` succeeds with no schema errors

**Tests**: none
**Gate**: quick (`bun run check-types`)

**Commit**: `chore(prisma): add review learned-status and review-session schema`

---

### T2: Prisma migration

**What**: Generate the migration SQL for T1's schema changes and verify it applies cleanly to the dev database.
**Where**: `prisma/migrations/{timestamp}_add_review_learned_status_and_sessions/migration.sql`
**Depends on**: T1
**Reuses**: Existing migration folder conventions
**Requirement**: RIL-01–19

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `bun run db:migrate` (or `prisma migrate dev`) generates a migration with both enums, `ReviewItem` column/index additions, and the two new tables
- [ ] Existing `review_items` rows backfill `status = 'active'`, `learned_at = NULL` (verified via `ADD COLUMN ... DEFAULT 'active'`)
- [ ] `bun run db:generate` regenerates the Prisma client with new types
- [ ] `bun run check-types` passes

**Tests**: none
**Gate**: quick

**Commit**: `chore(prisma): generate migration for review learned-status and review-sessions`

---

### T3: `REVIEW_SESSION_QUESTION_COUNT` env var [P]

**What**: Add the new env var to the server schema and `.env.example`, per RIL-DES-08.
**Where**: `src/config/env/server-schema.ts`, `.env.example`
**Depends on**: None
**Reuses**: Existing `z.coerce.number().default(3)` pattern (mirrors `RATE_LIMIT_MAX`-style entries)
**Requirement**: RIL-DEC-08

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `REVIEW_SESSION_QUESTION_COUNT: z.coerce.number().default(3)` added to `serverEnv`
- [ ] `.env.example` documents the new variable
- [ ] `server-schema.test.ts` updated/extended to cover the default and an overridden value
- [ ] Gate check passes: `bun run lint && bun run check-types && bun run test`
- [ ] Test count: existing `server-schema.test.ts` suite + new case(s) pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(config): add REVIEW_SESSION_QUESTION_COUNT env var`

---

### T4: `ReviewMergeService.insertNewTopicsOnly`

**What**: Add the new-topic-only insert method (RIL-DES-05/RIL-14/RIL-15): skip any topic with an existing case-insensitive or similarity match (`active` or `learned`); insert as `active` only when no match exists.
**Where**: `src/modules/interview/service/review-merge-service.ts`, `src/modules/interview/service/review-merge-service.test.ts`
**Depends on**: T2
**Reuses**: `ReviewRepository.findByUserIdAndTopicCaseInsensitive` / `findSimilarByUserIdAndTopic` (existing); mirrors `upsertItems`' lookup pattern without its bump/max logic
**Requirement**: RIL-14, RIL-15

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `insertNewTopicsOnly(userId, sessionId, items)` implemented: no match → insert `active`; case-insensitive match → no-op; similarity match (`active` or `learned`) → no-op
- [ ] `upsertItems` left unmodified (still callable, still tested)
- [ ] Unit tests: no-match-insert, case-insensitive-skip, similarity-skip (both statuses)
- [ ] Gate check passes: `bun run lint && bun run check-types && bun run test`
- [ ] Test count: all existing `review-merge-service.test.ts` tests + 3 new cases pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(review-merge): add insertNewTopicsOnly for non-mutating gap discovery`

---

### T5: `ReviewMergeService.applyReviewSessionConfirmation` [P]

**What**: Add the direct-update method used only by a confirmed Review Session item (RIL-DES-06, RSF-04): sets `status`, `priority` (if active), `learnedAt` (`now()`/`null`), `updatedAt` — no search/merge/bump logic.
**Where**: `src/modules/interview/service/review-merge-service.ts`, `src/modules/interview/service/review-merge-service.test.ts`
**Depends on**: T4 (same file; sequenced to avoid concurrent edits)
**Reuses**: `ReviewRepository` (add a direct `updateByIdAndUserId`-style call if not already present); existing test file structure
**Requirement**: RIL-09–13

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `applyReviewSessionConfirmation(userId, reviewItemId, resolved)` implemented for both `{status:"active", priority}` and `{status:"learned"}` shapes
- [ ] `learnedAt` set to `now()` on `learned`, cleared (`null`) on `active`
- [ ] Unit tests: accept-active (priority applied verbatim), accept-learned (`learnedAt` set), override-active (user priority wins, no bump/clamp), override-learned (priority ignored)
- [ ] Gate check passes: `bun run lint && bun run check-types && bun run test`
- [ ] Test count: all existing tests + 4 new cases pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(review-merge): add applyReviewSessionConfirmation for confirmed session items`

---

### T6: `InterviewStreamService` final-turn update [P]

**What**: Replace the final-turn call to `reviewMergeService.upsertItems(...)` with `reviewMergeService.insertNewTopicsOnly(...)`, per RIL-DES-05.
**Where**: `src/modules/interview/service/stream-service.ts`, `src/modules/interview/service/stream-service.test.ts`
**Depends on**: T4
**Reuses**: Existing final-turn branch structure (unchanged control flow, only the merge call changes)
**Requirement**: RIL-14, RIL-15

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Final-turn block calls `insertNewTopicsOnly` instead of `upsertItems`
- [ ] Existing tests updated: assert `insertNewTopicsOnly` is called with the generated review items
- [ ] New test: an existing `active` item whose topic is discussed in the interview is left completely unchanged (no priority/status mutation) after the final turn
- [ ] Gate check passes: `bun run lint && bun run check-types && bun run test`
- [ ] Test count: all `stream-service.test.ts` cases pass, including the updated/new ones (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `fix(interview): stop mutating existing review items on final turn`

---

### T7: Review-items PATCH/filter Zod schemas [P]

**What**: Add `patchReviewItemSchema` and `listReviewItemsQuerySchema` to the existing `review-items` validation file.
**Where**: `src/modules/review-items/validations/review-items-schemas.ts`, `src/modules/review-items/validations/review-items-schemas.test.ts`
**Depends on**: T11 (imports `reviewItemStatusSchema` from `review-session-schemas.ts`)
**Reuses**: `reviewItemStatusSchema` from T11; existing `reviewItemResponseSchema` file structure
**Requirement**: RIL-16–19

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `patchReviewItemSchema = z.object({ status: reviewItemStatusSchema })` added
- [ ] `listReviewItemsQuerySchema` added with `status: z.enum(["active","learned","all"]).default("active")`
- [ ] Unit tests: valid/invalid `status` values for both schemas; default applied when query omitted
- [ ] Gate check passes: `bun run lint && bun run check-types && bun run test`
- [ ] Test count: existing suite + new cases pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(review-items): add patch and status-filter schemas`

---

### T8: `ReviewItemsService.updateStatus` + `listForUser` status filter [P]

**What**: Add `updateStatus(userId, id, status)` and extend `listForUser` to accept a `status` filter (`active`/`learned`/`all`, default `active`) with the corresponding sort comparator for `learned`.
**Where**: `src/modules/review-items/service/review-items-service.ts`, `src/modules/review-items/service/review-items-service.test.ts`
**Depends on**: T7
**Reuses**: Existing `compareReviewItems` comparator (unchanged for `active`); existing `toResponse` mapper; `NotFoundError`
**Requirement**: RIL-16, RIL-17, RIL-18, RIL-19

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `listForUser(userId, status)` filters by `active`/`learned`/`all`, default `active`
- [ ] New comparator for `learned`: `learnedAt` desc, fallback `updatedAt` desc
- [ ] `updateStatus(userId, id, status)`: 404 if not owned; sets `learnedAt = now()` on → `learned`, `null` on → `active`; returns `toResponse`-shaped item
- [ ] Unit tests: filter=`active`/`learned`/`all`; sort order per status; `updateStatus` success + 404 + both transition directions
- [ ] Gate check passes: `bun run lint && bun run check-types && bun run test`
- [ ] Test count: existing suite + new cases pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(review-items): add status filter and manual updateStatus`

---

### T9: `ReviewItemsController.updateStatus` + `PATCH /:id` route [P]

**What**: Wire the new service method to `PATCH /api/review-items/:id`, and pass the `status` query through the existing `GET /` handler.
**Where**: `src/modules/review-items/controller/review-items-controller.ts`, `src/modules/review-items/routes/review-items-routes.ts`, `src/shared/middlewares/validation-middleware.ts` usage
**Depends on**: T8
**Reuses**: `asyncHandler`; `validate()` middleware; existing `list`/`remove` controller method shape
**Requirement**: RIL-16–19

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `updateStatus(req, res)` controller method added, calls `reviewItemsService.updateStatus`, returns 200 with updated item
- [ ] `list(req, res)` reads `status` query (validated by `listReviewItemsQuerySchema`) and forwards it to `listForUser`
- [ ] `PATCH /:id` route registered with `validate(patchReviewItemSchema)` + `asyncHandler`
- [ ] `bun run check-types` and `bun run lint` pass
- [ ] E2E coverage for this endpoint is written in **T23** (merge-forward — controller/route layer has no dedicated unit tests per `docs/TESTING.md`)

**Tests**: none (covered by E2E in T23, per Test Coverage Matrix)
**Gate**: quick (`bun run lint && bun run check-types`)

**Commit**: `feat(review-items): expose PATCH endpoint and status filter query`

---

### T10: `ReviewSessionRecord` types [P]

**What**: Define the TypeScript record types shared by the new repository and services.
**Where**: `src/modules/review-sessions/types/review-session-record.ts`
**Depends on**: T2
**Reuses**: `ReviewPriority`, `ReviewItemStatus`/`ReviewSessionStatus` types from Prisma client / `interview-schemas.ts`
**Requirement**: RIL-01–13

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `ReviewSessionRecord`, `ReviewSessionItemRecord` (with `turns`, `pendingQuestion`, `suggested*`, `confirmed*`) types exported
- [ ] No `any` used; types compile against the generated Prisma client
- [ ] `bun run check-types` passes

**Tests**: none
**Gate**: quick

**Commit**: `feat(review-sessions): add shared record types`

---

### T11: `review-session-schemas.ts` Zod schemas [P]

**What**: Create the new module's validation file: `reviewItemStatusSchema`, `reviewSessionStatusSchema`, `createReviewSessionSchema`, `reviewSessionStreamBodySchema`, `confirmReviewSessionItemSchema`, `reviewSessionEvaluationOutputSchema`.
**Where**: `src/modules/review-sessions/validations/review-session-schemas.ts`, `.test.ts`
**Depends on**: T2
**Reuses**: `reviewPrioritySchema` from `src/modules/interview/validations/interview-schemas.ts`
**Requirement**: RIL-01, RIL-06–13, RIL-16 (status enum shared with review-items)

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] All six schemas defined exactly as specified in design.md's "Zod schemas" section (including `.min(1).max(10)` + duplicate-ID refine on `createReviewSessionSchema`)
- [ ] `confirmReviewSessionItemSchema` is a `z.discriminatedUnion("action", [...])` correctly rejecting a `priority` on the `learned` branch
- [ ] Unit tests: valid/invalid payloads for each schema, including duplicate-ID rejection and the discriminated-union branches
- [ ] Gate check passes: `bun run lint && bun run check-types && bun run test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(review-sessions): add validation schemas`

---

### T12: `ReviewRepository.findActiveByIdsAndUserId`

**What**: Add the lookup used by session creation to validate selected IDs are `active` and owned.
**Where**: `src/modules/interview/repository/review-repository.ts`, `src/modules/interview/repository/review-repository.integration.test.ts`
**Depends on**: T2
**Reuses**: Existing `toReviewItemRecord` mapper; existing integration test container setup
**Requirement**: RIL-01, RIL-05, RIL-SEC-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `findActiveByIdsAndUserId(userId, ids: string[])` returns only rows matching `userId`, `id IN (...)`, `status: "active"`
- [ ] Integration test: returns subset when some IDs are `learned`/not-owned/nonexistent; returns full set when all valid
- [ ] Gate check passes: `bun run test:integration`
- [ ] Test count: existing integration suite + new cases pass (no silent deletions)

**Tests**: integration
**Gate**: integration

**Commit**: `feat(review-repository): add findActiveByIdsAndUserId`

---

### T13: `ReviewSessionRepository`

**What**: Create the new repository with all persistence methods for `ReviewSession`/`ReviewSessionItem`.
**Where**: `src/modules/review-sessions/repository/review-session-repository.ts`, `.integration.test.ts`
**Depends on**: T2, T10
**Reuses**: Prisma singleton (`src/infrastructure/database`); plain-class repository convention (no interface abstraction) from `ReviewRepository`/`SessionRepository`
**Requirement**: RIL-01–13

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `create(userId, items)` snapshots `topic`/`description`/`currentPriority`, sets `order` by input index
- [ ] `findByIdAndUserId(sessionId, userId)` returns session + ordered items (or `null`)
- [ ] `appendTurn`, `setPendingQuestion`, `saveSuggestions`, `markPendingReview`, `confirmItem`, `markCompletedIfAllConfirmed` all implemented and scoped by `userId`/session ownership
- [ ] Integration tests: create round-trip, ordering, turn append, pending-question set/clear, suggestion save, status transitions (`in_progress`→`pending_review`→`completed`), `markCompletedIfAllConfirmed` returns `false` until the last item is confirmed
- [ ] Gate check passes: `bun run test:integration`
- [ ] Test count: new suite passes end-to-end (no silent deletions)

**Tests**: integration
**Gate**: integration

**Commit**: `feat(review-sessions): add ReviewSessionRepository`

---

### T14: `IReviewSessionQuestionGenerator` protocol + question node [P]

**What**: Define the streaming question-generator protocol and its implementation (plain `ChatOpenAI.stream()`, no LangGraph `StateGraph`, per RIL-DES-02).
**Where**: `src/modules/review-sessions/protocols/review-session-question-generator.ts`, `src/infrastructure/ai/langgraph/nodes/review-session-question-node.ts`, `src/modules/review-sessions/prompts/review-session-question-prompt.ts`, `.test.ts` files
**Depends on**: None
**Reuses**: `createReviewModel()`; token-forwarding pattern (reading `.content` off `ChatOpenAI.stream()` chunks directly, not the LangGraph message-tuple parser)
**Requirement**: RIL-02, RIL-03, RIL-DEC-07

**Tools**:
- MCP: `context7` (verify current `ChatOpenAI.stream()` chunk shape)
- Skill: NONE

**Done when**:
- [ ] `IReviewSessionQuestionGenerator.streamQuestion({topic, description, turns}, options?)` returns an `AsyncGenerator<{content}, {content, usage?}>`
- [ ] Prompt template: persona + topic + description + prior turns (if any) + "ask exactly one focused question, no preamble"
- [ ] Question 1 uses only topic/description; question `k>1` includes that item's own turns `1..k-1` only — never other items' data
- [ ] Unit tests: mock `ChatOpenAI`, assert prompt inputs are scoped to the single item, assert token chunks forwarded, assert final `usage` captured
- [ ] Gate check passes: `bun run lint && bun run check-types && bun run test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(review-sessions): add adaptive question generator node`

---

### T15: `IReviewSessionEvaluator` protocol + evaluation node [P]

**What**: Define the structured-output evaluator protocol and its implementation (RIL-DES-03), encoding the normative LLM instructions directly (no post-processing via `bump`/`maxPriority`, per design's explicit choice).
**Where**: `src/modules/review-sessions/protocols/review-session-evaluator.ts`, `src/infrastructure/ai/langgraph/nodes/review-session-evaluation-node.ts`, `src/modules/review-sessions/prompts/review-session-evaluation-prompt.ts`, `.test.ts` files
**Depends on**: None
**Reuses**: `createReviewModel().withStructuredOutput(...)` + `{prompt}` template trick + `schema.parse()` re-validation pattern from `review-items-generator-node.ts`
**Requirement**: RIL-06, RIL-07, RIL-08, RSE-01

**Tools**:
- MCP: `context7` (verify `withStructuredOutput` current API)
- Skill: NONE

**Done when**:
- [ ] `IReviewSessionEvaluator.evaluate({topic, description, currentPriority, turns})` returns `{status, priority?}` matching `reviewSessionEvaluationOutputSchema`
- [ ] Prompt encodes: mark `learned` only with sufficient demonstration; lower priority only with clear improvement evidence, never below `low`; no change when signal is ambiguous; never `active` without `priority`
- [ ] Output re-validated with `schema.parse()` before returning
- [ ] Unit tests: mock `ChatOpenAI`, assert prompt inputs scoped to single item only, assert schema validation rejects malformed output
- [ ] Gate check passes: `bun run lint && bun run check-types && bun run test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(review-sessions): add per-item evaluation node`

---

### T16: `ReviewSessionsService.create` + `getById` [P]

**What**: Implement session creation (selection validation + snapshot) and report retrieval.
**Where**: `src/modules/review-sessions/service/review-sessions-service.ts`, `.test.ts`
**Depends on**: T13, T12
**Reuses**: `NotFoundError`; response-shaping pattern from `ReviewItemsService.toResponse`
**Requirement**: RIL-01, RIL-05, RIL-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `create(userId, reviewItemIds)`: calls `findActiveByIdsAndUserId`; throws `NotFoundError` if `matches.length !== ids.length` (no partial insert); otherwise creates session via `ReviewSessionRepository.create`
- [ ] `getById(userId, sessionId)`: throws `NotFoundError` if not found/not owned; returns report shape (`topic`, `currentPriority`, `suggestedStatus`, `suggestedPriority`, `confirmedStatus`, `confirmedPriority` per item)
- [ ] Unit tests: create success; create 404 on any non-active/not-owned ID with no partial insert asserted; getById success + 404
- [ ] Gate check passes: `bun run lint && bun run check-types && bun run test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(review-sessions): add create and getById service methods`

---

### T17: `ReviewSessionsService.confirmItem`

**What**: Implement the confirm/override/mark-learned flow that triggers persistence to `review_items`.
**Where**: `src/modules/review-sessions/service/review-sessions-service.ts`, `.test.ts`
**Depends on**: T16 (same file), T5
**Reuses**: `ReviewMergeService.applyReviewSessionConfirmation`; `NotFoundError`/`ConflictError`/`BadRequestError`
**Requirement**: RIL-09, RIL-10, RIL-11, RIL-12, RIL-13

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] 404 if `ReviewSessionItem` not found/not owned (via session join)
- [ ] 409 if `confirmedStatus` already set
- [ ] 400 if `action: "accept"` but `suggestedStatus` is `null`
- [ ] Resolves `{status, priority}`: `accept` → suggested values; `override` → body values
- [ ] Calls `ReviewMergeService.applyReviewSessionConfirmation`; persists `confirmedStatus`/`confirmedPriority`/`confirmedAt` on the item
- [ ] If last unconfirmed item → `ReviewSessionRepository.markCompletedIfAllConfirmed` transitions session to `completed`
- [ ] Unit tests: accept-active, accept-learned, override-active, override-learned, 400 accept-without-suggestion, 409 already-confirmed, session-completion-on-last-item
- [ ] Gate check passes: `bun run lint && bun run check-types && bun run test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(review-sessions): add confirmItem service method`

---

### T19: `ReviewSessionStreamService.streamTurn` [P]

**What**: Implement the SSE orchestration for adaptive per-item Q&A and triggering parallel evaluation on last-item completion.
**Where**: `src/modules/review-sessions/service/review-session-stream-service.ts`, `.test.ts`
**Depends on**: T13, T14, T15
**Reuses**: `writeEvent`/`writeDone` (`src/shared/utils/sse.ts`); SSE header block + abort-on-`close` handling copied from `InterviewStreamService`; `createUsageCaptureCallback`/`TokenUsageService`
**Requirement**: RIL-01–08, RIL-DEC-07, RSF-02, RSF-03, RSF-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Preconditions: 404 if session not found/not owned; 409 if `status` is `pending_review`/`completed` (before SSE headers)
- [ ] First call (no `answer`): generates question 1 for the first item, streams tokens, persists `pendingQuestion`, emits `meta`, `[DONE]`
- [ ] Subsequent call (`answer` present): appends `{question: pendingQuestion, answer}` as a full turn; advances state per design's three branches (same item next question / next item question 1 / trigger evaluation)
- [ ] Evaluation branch: `Promise.allSettled` over all items scoped to `{topic, description, currentPriority, turns}` only; per-item failure leaves `suggestedStatus = null` + emits `error` event referencing that item; other items unaffected; session → `pending_review`, final `meta` includes `status` + full report
- [ ] Client disconnect (`res.on("close")`) stops writing and does not persist a partial turn/question
- [ ] Unit tests (mocked generator/evaluator): SSE token/meta sequence per branch, per-item isolation (no cross-item data in prompt inputs), evaluation triggers only after all items reach `N`, partial evaluation failure handling, abort-on-close
- [ ] Gate check passes: `bun run lint && bun run check-types && bun run test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(review-sessions): add SSE stream orchestration service`

---

### T20: `ReviewSessionsController` + routes

**What**: Wire the four endpoints (`create`, `stream`, `getById`, `confirmItem`) to their services.
**Where**: `src/modules/review-sessions/controller/review-sessions-controller.ts`, `src/modules/review-sessions/routes/review-sessions-routes.ts`
**Depends on**: T16, T17, T19
**Reuses**: `asyncHandler` + try/catch delegation pattern from `InterviewController`; `validate()` middleware; `makeAiRateLimiter()` on the stream route (RIL-DES-12/RIL-SEC-03)
**Requirement**: RIL-01–13, RIL-SEC-01–05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `POST /` (201, `validate(createReviewSessionSchema)`), `POST /:id/stream` (SSE, `validate(reviewSessionStreamBodySchema)` + `makeAiRateLimiter()`), `GET /:id` (200), `POST /:id/items/:itemId/confirm` (200, `validate(confirmReviewSessionItemSchema)`) all registered
- [ ] All four handlers wrapped in `asyncHandler`; all use `req.userId` (never body/params) for ownership
- [ ] `bun run check-types` and `bun run lint` pass
- [ ] E2E coverage for all four endpoints is written in **T23** (merge-forward — controller/route layer has no dedicated unit tests)

**Tests**: none (covered by E2E in T23, per Test Coverage Matrix)
**Gate**: quick (`bun run lint && bun run check-types`)

**Commit**: `feat(review-sessions): add controller and routes`

---

### T21: `review-sessions` factories

**What**: Wire the new module's dependency graph following the existing `make*` factory pattern.
**Where**: `src/factories/review-sessions/review-sessions-controller-factory.ts`, `review-sessions-service-factory.ts`, `review-session-stream-service-factory.ts`
**Depends on**: T20
**Reuses**: `src/factories/interview/*`, `src/factories/review-items/*` as templates; `makeTokenUsageService`, `makeAiRateLimiter`
**Requirement**: RIL-01–13

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `makeReviewSessionsController()`, `makeReviewSessionsService()`, `makeReviewSessionStreamService()` construct the full dependency graph with no missing wiring
- [ ] Route auto-discovery (`src/config/routes.ts`) mounts `review-sessions-routes.ts` at `/api/review-sessions` with no manual registration needed
- [ ] `bun run check-types` passes; app boots locally without runtime wiring errors (`bun run dev` starts clean)

**Tests**: none
**Gate**: quick

**Commit**: `feat(review-sessions): add factories and mount routes`

---

### T22: Update `docs/frontend-mock-interview-api.md` [P]

**What**: Document the new fields/endpoints: Review Session SSE contract, report shape, confirm action union, `review-items` PATCH + status filter.
**Where**: `docs/frontend-mock-interview-api.md`
**Depends on**: T21
**Reuses**: Existing doc structure/format for the `ai-mock-interview` and `review-items` sections
**Requirement**: RIL-20–22

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `POST /review-sessions`, `POST /review-sessions/:id/stream` (SSE events + final `meta` report shape), `GET /review-sessions/:id`, `POST /review-sessions/:id/items/:itemId/confirm` documented with request/response examples matching design.md's API Contracts section
- [ ] `GET /review-items?status=` and `PATCH /review-items/:id` documented
- [ ] Doc reviewed against actual response shapes (spot-checked against T20's handlers)

**Tests**: none
**Gate**: none (docs-only; no code gate applies)

**Commit**: `docs: document review-sessions API and review-items status filter`

---

### T23: E2E — full Review Session lifecycle + review-items filter/PATCH

**What**: Cover the complete lifecycle end-to-end, closing the merge-forward test deferrals from T9 and T20.
**Where**: `src/test/e2e/review-items.e2e.test.ts` (extend), `src/test/e2e/review-sessions.e2e.test.ts` (new)
**Depends on**: T21, T9
**Reuses**: `createApp()`, `truncateTables()`, `src/test/helpers/auth-helpers`; existing `vi.mock` pattern for OpenAI/LangGraph in E2E
**Requirement**: RIL-20, RIL-21, RIL-22

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `review-items.e2e.test.ts`: `GET ?status=active|learned|all` filtering, `PATCH /:id` both directions, 404 on not-owned, 401 unauthenticated
- [ ] `review-sessions.e2e.test.ts`: `POST /` (201 + 404 on non-active/not-owned selection), full SSE stream through all items for 2+ items (mocked question/evaluation nodes), `GET /:id` report before/after evaluation, `confirm` accept/override/mark-learned paths, 400/409/404 error cases, session `completed` transition on last confirm, cross-user 404 on every new endpoint
- [ ] `GET /api/review-items` reflects only confirmed changes (not raw suggestions) at each stage of the lifecycle
- [ ] Gate check passes: `bun run test:e2e`
- [ ] Test count: existing `review-items.e2e.test.ts` suite + new cases, plus new `review-sessions.e2e.test.ts` suite, all pass (no silent deletions)

**Tests**: e2e
**Gate**: e2e

**Commit**: `test(e2e): cover full review-session lifecycle and review-items filters`

---

## Parallel Execution Map

```
Level 0 (Parallel):
  T1 [P] ─┐
  T3 [P] ─┤
  T14 [P]─┤
  T15 [P]─┘

Level 1 (Sequential, needs T1):
  T2

Level 2 (Parallel, needs T2):
  T4
  T10 [P]
  T11 [P]
  T12 (integration — not parallel-safe, but no file overlap with others)

Level 3 (needs level 2):
  T5 [P]  (needs T4)
  T6 [P]  (needs T4)
  T7 [P]  (needs T11)
  T13     (needs T2, T10 — integration, not parallel-safe)

Level 4 (needs level 3):
  T8 [P]  (needs T7)
  T16 [P] (needs T13, T12)

Level 5 (needs level 4):
  T9 [P]  (needs T8)
  T17     (needs T16, T5 — same file as T16, sequenced)
  T19 [P] (needs T13, T14, T15)

Level 6 (Sequential):
  T20 (needs T16, T17, T19)

Level 7 (Sequential):
  T21 (needs T20)

Level 8 (Parallel):
  T22 [P] (needs T21)
  T23     (needs T21, T9 — e2e, not parallel-safe)
```

**How parallel execution works**: Tasks marked `[P]` within the same level are dispatched to one sub-agent each, launched concurrently. The orchestrating agent waits for every task in a level to complete (and its gate to pass) before starting the next level. Non-`[P]` tasks are still delegated to a sub-agent, but one at a time.

---

## Pre-Approval Validation

### Check 1: Task Granularity

| Task | Scope | Status |
|---|---|---|
| T1 | 1 schema file, cohesive data-model additions | ✅ Granular |
| T2 | 1 migration | ✅ Granular |
| T3 | 1 env var + test | ✅ Granular |
| T4 | 1 method | ✅ Granular |
| T5 | 1 method (same file as T4, sequenced) | ✅ Granular |
| T6 | 1 call-site change | ✅ Granular |
| T7 | 2 cohesive schemas, 1 file | ✅ Granular |
| T8 | 2 cohesive methods, 1 file | ✅ Granular |
| T9 | 1 controller method + 1 route | ✅ Granular |
| T10 | 1 types file | ✅ Granular |
| T11 | 1 validations file (6 related schemas) | ✅ Granular |
| T12 | 1 repository method | ✅ Granular |
| T13 | 1 new repository, 7 cohesive methods | ✅ Granular (single new component) |
| T14 | 1 protocol + 1 node + 1 prompt (one deliverable: question generation) | ✅ Granular |
| T15 | 1 protocol + 1 node + 1 prompt (one deliverable: evaluation) | ✅ Granular |
| T16 | 2 cohesive read methods, 1 new file | ✅ Granular |
| T17 | 1 method (same file as T16, sequenced) | ✅ Granular |
| T19 | 1 method, 1 new file (one deliverable: stream orchestration) | ✅ Granular |
| T20 | 1 controller + 1 routes file | ✅ Granular |
| T21 | 3 factory files, 1 module | ✅ Granular |
| T22 | 1 doc file | ✅ Granular |
| T23 | E2E suite for 1 feature's endpoints | ✅ Granular |

### Check 2: Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | None (Level 0) | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | None | None (Level 0) | ✅ Match |
| T4 | T2 | T2 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T4 | T4 → T6 | ✅ Match |
| T7 | T2, T11 | T2 → (via T11) → T7; T11 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T2 | T2 → T10 | ✅ Match |
| T11 | T2 | T2 → T11 | ✅ Match |
| T12 | T2 | T2 → T12 | ✅ Match |
| T13 | T2, T10 | T2 → T13; T10 → T13 | ✅ Match |
| T14 | None | None (Level 0) | ✅ Match |
| T15 | None | None (Level 0) | ✅ Match |
| T16 | T13, T12 | T13 → T16; T12 → T16 | ✅ Match |
| T17 | T16, T5 | T16 → T17; T5 → T17 | ✅ Match |
| T19 | T13, T14, T15 | T13 → T19; T14 → T19; T15 → T19 | ✅ Match |
| T20 | T16, T17, T19 | T16 → T20; T17 → T20; T19 → T20 | ✅ Match |
| T21 | T20 | T20 → T21 | ✅ Match |
| T22 | T21 | T21 → T22 | ✅ Match |
| T23 | T21, T9 | T21 → T23; T9 → T23 | ✅ Match |

No task marked `[P]` shares a level with a task it depends on. ✅

### Check 3: Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | Prisma schema | none | none | ✅ OK |
| T2 | Prisma migration | none | none | ✅ OK |
| T3 | `config/env` (pure infra) | unit | unit | ✅ OK |
| T4 | `service/` | unit | unit | ✅ OK |
| T5 | `service/` | unit | unit | ✅ OK |
| T6 | `service/` | unit | unit | ✅ OK |
| T7 | `validations/` | unit | unit | ✅ OK |
| T8 | `service/` | unit | unit | ✅ OK |
| T9 | `controller/`, routes | none — E2E | none (E2E in T23) | ✅ OK |
| T10 | `types/` (pure infra) | unit* | none | ✅ OK — type-only file, no runtime logic to unit test |
| T11 | `validations/` | unit | unit | ✅ OK |
| T12 | `repository/` | integration | integration | ✅ OK |
| T13 | `repository/` | integration | integration | ✅ OK |
| T14 | `protocols/`, `langgraph/nodes/`, `prompts/` | unit | unit | ✅ OK |
| T15 | `protocols/`, `langgraph/nodes/`, `prompts/` | unit | unit | ✅ OK |
| T16 | `service/` | unit | unit | ✅ OK |
| T17 | `service/` | unit | unit | ✅ OK |
| T19 | `service/` | unit | unit | ✅ OK |
| T20 | `controller/`, routes | none — E2E | none (E2E in T23) | ✅ OK |
| T21 | `factories/` | none (matrix has no factory row; codebase convention: untested wiring) | none | ✅ OK |
| T22 | docs | none | none | ✅ OK |
| T23 | HTTP routes (full lifecycle) | E2E | e2e | ✅ OK |

All ❌-free. No task defers required tests without a documented merge-forward target (T9 → T23, T20 → T23).

---

## Requirement Traceability (tasks coverage)

| Requirement | Task(s) |
|---|---|
| RIL-01–05 | T1, T2, T10, T11, T12, T13, T16, T20, T21, T23 |
| RIL-06–08 | T1, T2, T11, T14, T15, T19, T23 |
| RIL-09–13 | T1, T2, T5, T13, T16, T17, T20, T21, T23 |
| RIL-14–15 | T4, T6, T23 |
| RIL-16–19 | T7, T8, T9, T23 |
| RIL-20–22 | T22, T23 |
| RIL-SEC-01–05 | T20 |

---

## Next: Tools & Skills Confirmation

Before execution, confirm tool assignment per task:

- Only **T14** and **T15** propose using an MCP (`context7`, to double-check current `@langchain/openai` streaming/`withStructuredOutput` API surface before writing the node implementations). Every other task needs no MCP or skill beyond the standard editing/shell tools.
- No skills beyond this one (`tlc-spec-driven`) are relevant to this backend feature.
