# Async Review Items Generation — Specification

## Problem Statement

On the final interview turn, `InterviewStreamService` runs closing feedback **and then** a second LLM call (`reviewItemsGenerator`) + merge **inside the same SSE request** before emitting `meta.isFinished`. That couples conversation completion to batch extraction: the last turn is slow, OpenAI failures can leave the session in limbo (`turnCount >= maxTurns` with `isFinished=false` → further streams return 409), and the architecture diverges from the resume pipeline which already uses BullMQ + a separate worker.

## Goals

- [x] Final interview turn closes the **conversation** quickly (closing feedback + `isFinished`) without waiting for review-item LLM generation
- [x] Review-item extraction runs as an **async BullMQ job** on the existing worker process (`src/worker.ts`), mirroring resume processing
- [x] Clients can observe generation progress via an explicit session status (`pending` → `ready` | `failed`)
- [x] Failures of review generation never undo conversation finish; automatic BullMQ retries plus a manual retry endpoint recover from `failed`
- [x] Generation remains idempotent per session and continues to use `ReviewMergeService` / `IReviewItemsGenerator`

## Out of Scope

| Item | Reason |
| ---- | ------ |
| Moving interview **turns** (SSE interviewer/closing) onto a queue | Interactive UX; must stay in API process |
| Moving review-**session** Q&A streams onto a queue | Same interactive pattern as interview |
| New microservice / separate deployable for review only | Same Bun worker entry; reuse Redis/BullMQ |
| Changing merge/dedupe algorithm or topic similarity threshold | Separate concern (OQ-02); keep `insertNewTopicsOnly` behavior |
| Push/webhook/email when review items are ready | Deferred; resume has the same gap |
| Admin UI / Bull Board for ops | Nice-to-have later |
| Backfilling historical sessions that finished under the sync path | Not required for v1; only migration defaults (see Edge Cases) |

---

## User Stories

### P1: Finish conversation independently of review generation ⭐ MVP

**User Story**: As a candidate on the last interview turn, I want closing feedback streamed and the chat locked as finished without waiting for review-topic extraction, so that the session ends quickly and cannot get stuck if extraction fails.

**Why P1**: Fixes limbo sessions and last-turn latency; prerequisite for reliable production.

**Acceptance Criteria**:

1. WHEN the client streams the final turn (`turnCount + 1 >= maxTurns`) THEN the system SHALL stream closing-feedback tokens via existing SSE `token` events (unchanged interview UX)
2. WHEN closing feedback has been persisted and the turn count incremented on the final turn THEN the system SHALL mark the session finished (`isFinished = true`, update `interviewLocale` from the stream body) **before** waiting for review-item LLM completion
3. WHEN the session is marked finished on the final turn THEN the system SHALL set review-generation status to `pending` as part of the finish path (before or atomically with a successful enqueue; if enqueue fails see ARG / BullMQ story)
4. WHEN final-turn SSE `meta` is emitted THEN it SHALL include `isFinished: true` **without requiring** review items to already exist in the database
5. WHEN `isFinished` is `true` THEN a subsequent `POST .../stream` for that session SHALL return **409 Conflict** (unchanged)
6. WHEN review-item generation fails after the conversation is finished THEN the system SHALL NOT clear `isFinished` and SHALL NOT reopen the chat for new turns
7. WHEN the API handles the final turn THEN it SHALL NOT block finish on review-generation token quota; quota for review generation SHALL be enforced only on the worker path

**Independent Test**: Force final turn with a mocked/failing review generator after finish is queued; SSE still ends with `isFinished: true`; session row stays finished; stream again → 409. Over-quota user still finishes chat; worker later sets `failed` if quota blocks generate.

**Supersedes**: `ICF-DEC-01` / closing-feedback ICF-11 sync “generate then markFinished” ordering for review items (conversation finish is no longer gated on generator success).

---

### P1: Enqueue review generation on BullMQ (same worker) ⭐ MVP

**User Story**: As the platform, I want review-item extraction enqueued like résumé processing so that retries, isolation from API latency, and horizontal worker scale work the same way.

**Why P1**: Aligns with project constraints (BullMQ + Redis + `src/worker.ts`) and production ops model.

**Acceptance Criteria**:

1. WHEN an interview session is marked finished on the final turn THEN the API SHALL enqueue a BullMQ job containing at least `{ sessionId }` (and any minimal ids needed), using a dedicated queue name (e.g. `review-generation`) distinct from `resume-processing`
2. WHEN Redis/BullMQ enqueue fails after the conversation was marked finished THEN the system SHALL persist review-generation status as `failed` (with an error message) and SHALL still complete the SSE final turn with `isFinished: true` (conversation must not roll back)
3. WHEN the worker consumes a review-generation job THEN it SHALL `assertWithinLimit` for the user, load session + transcript + résumé summary + locale (+ job description if present), call `IReviewItemsGenerator`, merge via `ReviewMergeService.insertNewTopicsOnly`, record token usage consistently with other LLM paths, and set review-generation status to `ready`
4. WHEN the worker completes successfully with zero new topics (empty LLM list or all duplicates skipped) THEN the system SHALL still set review-generation status to `ready` (empty result is success, not failure)
5. WHEN the worker throws / LLM fails / quota fails after BullMQ retries are exhausted THEN the system SHALL set review-generation status to `failed` and persist a usable `error` / `errorMessage` field for clients/ops
6. WHEN the same `sessionId` is enqueued more than once THEN processing SHALL be idempotent (safe re-run: no duplicate topics beyond existing merge rules; job identity SHOULD use `sessionId` as BullMQ `jobId` or equivalent dedupe)
7. WHEN non-final turns complete THEN the system SHALL NOT enqueue review-generation jobs
8. Review generation SHALL run in the existing worker entry (`bun run worker` / `src/worker.ts`), not in the API request thread after SSE close
9. WHEN a review-generation job is registered THEN BullMQ SHALL be configured with automatic retries and backoff for transient failures (exact attempts/backoff in Design; default intent: ~3 attempts)

**Independent Test**: Complete final turn with Redis up → job appears on review queue → worker marks status `ready` and inserts only new topics. Kill Redis after finish → session finished + status `failed`, chat still locked. Transient LLM failure retries then succeeds or ends `failed`.

---

### P1: Expose review-generation status on the session API ⭐ MVP

**User Story**: As a frontend, I want to know whether review items for a finished session are still generating, ready, or failed, so that I can poll / show the right empty or error state instead of assuming items exist when `isFinished` is true.

**Why P1**: Without status, async generation is invisible and the current `invalidateQueries(["review-items"])` right after stream is a race.

**Acceptance Criteria**:

1. WHEN an `InterviewSession` exists THEN it SHALL expose a review-generation status with values at least: `idle` | `pending` | `ready` | `failed` (naming may use Prisma enum; semantics fixed)
2. WHEN a session is created / in progress (not yet final-finished) THEN status SHALL be `idle`
3. WHEN the session finishes and a job is successfully enqueued THEN status SHALL be `pending`
4. WHEN the worker finishes successfully THEN status SHALL be `ready`
5. WHEN enqueue fails hard or the worker exhausts retries THEN status SHALL be `failed`
6. WHEN the client fetches session detail (GET session-by-id; list endpoints SHOULD include the same fields when returning session objects) THEN the response SHALL include `reviewGenerationStatus` (and `reviewGenerationError` when `failed`, otherwise null/omitted consistently)
7. WHEN final-turn SSE `meta` is emitted THEN it SHALL include `reviewGenerationStatus` set to `"pending"` on successful enqueue, or `"failed"` if enqueue already failed
8. WHEN non-final-turn SSE `meta` is emitted THEN it SHALL NOT be required to include `reviewGenerationStatus` (mid-turn meta unchanged aside from existing fields)

**Independent Test**: After final turn, meta has `reviewGenerationStatus`; GET session → `isFinished: true`, status `pending`; after worker → `ready`; inject worker failure → `failed` + error string. Mid-turn meta has no new status field requirement.

---

### P2: Frontend handles pending / ready / failed after finish ⭐ (same release)

**User Story**: As a candidate, after the interview ends I want clear feedback while topics are being prepared, and I want to see topics when ready (or a recoverable error if generation failed).

**Why P2**: Backend contract is P1; FE is required for production UX. **Ship in the same release** as backend P1 for go-live.

**Acceptance Criteria**:

1. WHEN final-turn `meta.isFinished` is true THEN the UI MAY show the finished chat / feedback chrome immediately (closing feedback already streamed); it SHALL NOT treat review topic rows as complete while `reviewGenerationStatus` is `pending`
2. WHEN `reviewGenerationStatus` is `pending` THEN the UI SHALL show a preparing/in-progress state for review topics
3. WHEN status is `pending` THEN the frontend SHALL poll **session GET** on an interval (same pattern as résumé `processing` → `ready`, ~2–3s) until status is `ready` or `failed`; it SHALL NOT use an empty review-items list alone as the ready signal
4. WHEN status becomes `ready` THEN the UI SHALL invalidate/refresh review items and clear the preparing state (topics appear in feedback/dashboard/study surfaces as today)
5. WHEN status is `failed` THEN the UI SHALL show an error state, keep the interview chat locked, and expose retry via the manual retry endpoint (P3)

**Independent Test**: Finish interview with slow worker; UI shows preparing; then topics appear after `ready`. Force `failed`; UI shows error + retry; chat remains closed.

---

### P3: Manual retry of failed review generation ⭐ (same release as MVP)

**User Story**: As a candidate (owner of the session), I want to retry review generation for a finished session that failed, so that a transient OpenAI/Redis/quota blip does not permanently lose topics.

**Why P3**: Priority rank is below core pipeline, but **approved for the same production release** as P1/P2 so `failed` sessions are recoverable without DB ops. BullMQ automatic retries remain the first line of defense.

**Acceptance Criteria**:

1. WHEN an owner calls `POST /api/interview/sessions/:id/review-generation/retry` on a session with `isFinished=true` and `reviewGenerationStatus=failed` THEN the system SHALL set status to `pending`, clear or replace the prior error, enqueue a new job, and return the updated status payload
2. WHEN retry is called for a session that is not finished, or status is not `failed` (e.g. `pending` / `ready` / `idle`) THEN the system SHALL reject with **409 Conflict**
3. WHEN a non-owner calls retry THEN the system SHALL return **404** or **403** consistent with other session ownership rules

**Independent Test**: Mark session failed → retry as owner → pending → worker → ready. Retry while ready → 409.

---

## Edge Cases

- WHEN the client disconnects (`aborted`) during closing-feedback **before** messages/finish are committed THEN existing abort semantics apply: no false `isFinished`, no review job
- WHEN the client disconnects **after** finish + enqueue but before SSE `DONE` THEN the session SHALL remain finished and the job SHALL still run
- WHEN two finish paths race (should not happen with turn guards) THEN at most one successful logical finish; jobId = `sessionId` prevents duplicate concurrent generators
- WHEN the user has no résumé structured summary at worker time THEN job SHALL fail → status `failed` with clear error (session was allowed to start only when ready; this is a data inconsistency guard)
- WHEN token quota is exceeded at **worker** time THEN job SHALL fail → `failed` (conversation already finished; manual retry later when under limit)
- WHEN token quota would have blocked the **old** sync review call on the API THEN the new design SHALL still finish the conversation and still enqueue (worker enforces quota)
- WHEN existing finished sessions are migrated THEN backfill SHALL set status `ready` if `isFinished` (already generated under old sync path) or `idle` if not finished

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| ARG-01 | P1: Finish independently — markFinished before review LLM completes | Execute | Verified |
| ARG-02 | P1: Finish independently — set status `pending` on finish | Execute | Verified |
| ARG-03 | P1: Finish independently — SSE `meta.isFinished` without items required | Execute | Verified |
| ARG-04 | P1: Finish independently — review failure does not clear `isFinished` | Execute | Verified |
| ARG-05 | P1: Finish independently — no API review-quota block on finish | Execute | Verified |
| ARG-06 | P1: BullMQ — enqueue on finish with `{ sessionId }` | Execute | Verified |
| ARG-07 | P1: BullMQ — enqueue failure → status `failed`, chat still finished | Execute | Verified |
| ARG-08 | P1: BullMQ — worker quota check + generate + merge + status `ready` | Execute | Verified |
| ARG-09 | P1: BullMQ — empty/all-duplicate result → `ready` | Execute | Verified |
| ARG-10 | P1: BullMQ — exhausted failure → `failed` + error | Execute | Verified |
| ARG-11 | P1: BullMQ — idempotent per `sessionId` | Execute | Verified |
| ARG-12 | P1: BullMQ — no enqueue on non-final turns | Execute | Verified |
| ARG-13 | P1: BullMQ — runs in `src/worker.ts` + automatic retries | Execute | Verified |
| ARG-14 | P1: Status API — enum `idle\|pending\|ready\|failed` on session | Execute | Verified |
| ARG-15 | P1: Status API — expose on session read model + error when failed | Execute | Verified |
| ARG-16 | P1: Status API — final-turn SSE meta includes `reviewGenerationStatus` only | Execute | Verified |
| ARG-17 | P2: FE preparing state + poll session GET + refresh items on `ready` | Execute | Verified |
| ARG-18 | P3: Manual retry endpoint for `failed` (same release) | Execute | Verified |

**ID format:** `ARG-[NUMBER]`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 18 total, 18 mapped to tasks (`tasks.md`), 0 unmapped

---

## Success Criteria

- [x] Final-turn p95 wall time excludes review LLM duration (conversation finishes after closing feedback + enqueue)
- [x] Finished session never left with `isFinished=false` solely because review generation failed
- [x] Worker processes review jobs via BullMQ with automatic retries; status converges to `ready` or `failed`
- [x] Failed sessions are recoverable via manual retry without reopening chat
- [x] Frontend polls session status after finish; does not race-invalidate review-items as the only signal
- [x] Resume and review workers coexist in one worker process without blocking interview SSE on the API

---

## Locked Decisions

| ID | Decision |
| -- | -------- |
| ARG-DEC-01 | Interview turns stay sync SSE in the API process |
| ARG-DEC-02 | Review-item extraction moves to BullMQ async job |
| ARG-DEC-03 | Same worker deployment as resumes (`src/worker.ts`), new queue name |
| ARG-DEC-04 | Conversation `isFinished` is independent of review generation success |
| ARG-DEC-05 | Status model mirrors resume: `idle` / `pending` / `ready` / `failed` |
| ARG-DEC-06 | Reuse `IReviewItemsGenerator` + `ReviewMergeService.insertNewTopicsOnly` |
| ARG-DEC-07 | Overturn prior `ICF-DEC-01` (do not keep chat unfinished when generator fails) |
| ARG-DEC-08 | Client signal: final-turn SSE meta + poll **session GET**; invalidate review-items only on `ready` |
| ARG-DEC-09 | SSE `reviewGenerationStatus` only on **final-turn** meta (not mid-turn) |
| ARG-DEC-10 | Token quota for review generation enforced on **worker only**; API always finishes chat |
| ARG-DEC-11 | Manual retry endpoint ships in the **same release** as P1/P2 (story still labeled P3 for rank) |

Gray areas from Discuss are **closed**; details in `context.md`.

---

## Related Specs

| Spec | Relationship |
| ---- | ------------ |
| `backend/.specs/features/ai-mock-interview` | Original sync final-turn review generation |
| `backend/.specs/features/interview-closing-feedback` | Closing feedback + former generate-then-finish ordering |
| `interview-locale` | Locale still passed into generator; finish still updates session locale |
| Resume BullMQ worker | Pattern to mirror (`resume-processing` queue + status machine) |
| `context.md` (this feature) | Locked UX/API decisions for Design |
