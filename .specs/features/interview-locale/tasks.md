# Interview Locale (EN | PT) — Tasks

**Design**: `.specs/features/interview-locale/design.md`  
**Spec**: `.specs/features/interview-locale/spec.md`  
**Status**: Draft

**Test refs**: `backend/docs/TESTING.md`, `frontend/.specs/codebase/TESTING.md`

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2
```

### Phase 2: User preference API (Sequential)

```
T2 → T3 → T4
```

### Phase 3: Prompt + schema units (Parallel after T2)

```
T2 ──┬→ T5  [P]
     ├→ T7  [P]
     ├→ T10 [P]
     └→ T12 [P]
```

### Phase 4: Repositories (Sequential — integration not parallel-safe)

```
T1 → T6 → T11
```

### Phase 5: Interview + review services (Parallel after deps)

```
T5,T6,T7  → T8  → T9
T10,T11,T12 → T13 → T14
```

### Phase 6: Frontend (Sequential)

```
T15 → T16 → T17 → T18
```

---

## Task Breakdown

### T1: Prisma `InterviewLocale` + User/session columns + migration

**What**: Add `enum InterviewLocale { en pt }`, nullable `User.interviewLocale`, required `interviewLocale` on `InterviewSession` and `ReviewSession`, generate client, migration with backfill `en` for existing session rows.
**Where**: `Backend/prisma/schema/user.prisma`, `Backend/prisma/schema/ai-mock-interview.prisma`, `Backend/prisma/migrations/*`
**Depends on**: None
**Reuses**: Existing Prisma multi-file schema layout
**Requirement**: LOC-01, LOC-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Enum and three fields exist with `@map("interview_locale")` as in design
- [ ] Migration applies; existing sessions (if any) backfilled to `en`; users remain `null`
- [ ] `bun run db:generate` succeeds
- [ ] Gate check passes: `bun run check-types` (from `Backend/`)

**Tests**: none  
**Gate**: build

**Verify**:
`cd Backend && bun run db:generate && bun run check-types` — exits 0; generated client exports `InterviewLocale`.

**Commit**: `feat(db): add InterviewLocale to user and sessions`

---

### T2: Shared `interview-locale` module (Zod + prompt map + closing copy)

**What**: Create `interviewLocaleSchema`, `InterviewLocale` type, `buildInterviewLocalePromptBlock`, and `getClosingFeedbackCopy` (EN/PT headings, CTA, reply instruction).
**Where**: `Backend/src/shared/interview-locale/interview-locale.ts`, `Backend/src/shared/interview-locale/interview-locale.test.ts`, export from `Backend/src/shared/index.ts` if barrel is used
**Depends on**: T1
**Reuses**: Section-header style from `interviewer-system-prompt.ts`; `Record<Enum, string>` pattern like `LEVEL_INSTRUCTIONS`
**Requirement**: LOC-04, LOC-11, LOC-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `z.enum(["en","pt"])` rejects aliases (`EN`, `pt-BR`) and free text
- [ ] `buildInterviewLocalePromptBlock` returns a `## Language` (or equivalent) block forcing EN or PT only
- [ ] `getClosingFeedbackCopy("pt")` / `("en")` return distinct headings + CTA + reply instruction
- [ ] Unit tests cover accept/reject + both locale copies
- [ ] Gate check passes: `bun run lint && bun run check-types && bun run test -- src/shared/interview-locale/interview-locale.test.ts`
- [ ] Test count: ≥4 new tests pass

**Tests**: unit  
**Gate**: quick

**Verify**:
`cd Backend && bun run test -- src/shared/interview-locale/interview-locale.test.ts`

**Commit**: `feat(shared): add interview locale schema and prompt map`

---

### T3: Auth `User` type + `UserRepository.updateInterviewLocale`

**What**: Extend domain `User` / `UserWithoutPassword` with `interviewLocale`; add `updateInterviewLocale(userId, locale)` on `UserRepository`; ensure login/signup responses include the field via `toUserWithoutPassword`.
**Where**: `Backend/src/modules/auth/types/user.ts`, `Backend/src/modules/auth/repository/user-repository.ts`, `Backend/src/modules/auth/repository/user-repository.integration.test.ts`, auth service tests if they assert user shape
**Depends on**: T1, T2
**Reuses**: `toUserWithoutPassword`; existing repository integration patterns
**Requirement**: LOC-02, LOC-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `UserWithoutPassword` includes `interviewLocale: InterviewLocale | null`
- [ ] `updateInterviewLocale` persists and returns updated user/locale
- [ ] Integration test: create user → update locale → `getById`/`getByEmail` reflects value
- [ ] Gate check passes: `bun run test:integration -- src/modules/auth/repository/user-repository.integration.test.ts`
- [ ] Test count: existing repo tests + ≥1 new case (no silent deletions)

**Tests**: integration  
**Gate**: full

**Verify**:
`cd Backend && bun run test:integration -- src/modules/auth/repository/user-repository.integration.test.ts`

**Commit**: `feat(auth): persist and expose user interviewLocale`

---

### T4: `users` module — `PATCH /me/interview-locale` + E2E

**What**: Add `modules/users` (schema, service, controller, routes) mounting `PATCH /api/users/me/interview-locale` with auth + `validate`; E2E for 200/401/422; assert login/signup payload includes `interviewLocale`.
**Where**: `Backend/src/modules/users/**`, `Backend/src/test/e2e/users.e2e.test.ts` (or extend `auth.e2e.test.ts` for login field + new users e2e)
**Depends on**: T2, T3
**Reuses**: `makeCheckAuth`, `validate()`, `UserRepository.updateInterviewLocale`, route auto-mount
**Requirement**: LOC-02, LOC-03, LOC-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `PATCH /api/users/me/interview-locale` with valid body → 200 `{ interviewLocale }`
- [x] Invalid body → 422; no auth → 401
- [x] Login/signup E2E response `user` includes `interviewLocale` (null or set)
- [x] Gate check passes: `bun run test:e2e -- src/test/e2e/users.e2e.test.ts` (and auth e2e if extended)
- [x] Test count: ≥3 new E2E cases

**Tests**: e2e
**Gate**: full

**Verify**:
`cd Backend && bun run test:e2e -- src/test/e2e/users.e2e.test.ts`

**Commit**: `feat(users): add PATCH interview-locale endpoint`

---

### T5: Interview create/stream Zod schemas require `interviewLocale` [P]

**What**: Add required `interviewLocale: interviewLocaleSchema` to `createSessionSchema` and `streamMessageSchema`; update unit schema tests.
**Where**: `Backend/src/modules/interview/validations/interview-schemas.ts`, `Backend/src/modules/interview/validations/interview-schemas.test.ts` (create if missing)
**Depends on**: T2
**Reuses**: `interviewLocaleSchema` from shared module
**Requirement**: LOC-07, LOC-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Valid bodies with `en`/`pt` parse; missing/invalid fail
- [ ] Exported `CreateSessionInput` / `StreamMessageInput` include `interviewLocale`
- [ ] Gate check passes: `bun run test -- src/modules/interview/validations/interview-schemas.test.ts`
- [ ] Test count: ≥4 cases covering create + stream accept/reject

**Tests**: unit  
**Gate**: quick

**Verify**:
`cd Backend && bun run test -- src/modules/interview/validations/interview-schemas.test.ts`

**Commit**: `feat(interview): require interviewLocale on create and stream schemas`

---

### T6: `SessionRepository` create + `markFinished` persist locale

**What**: Extend `CreateSessionParams` / `create` to store `interviewLocale`; change `markFinished(id, interviewLocale)` to set `isFinished` and overwrite `interviewLocale`.
**Where**: `Backend/src/modules/interview/repository/session-repository.ts`, `Backend/src/modules/interview/repository/session-repository.integration.test.ts`
**Depends on**: T1
**Reuses**: Existing repository integration tests for create/markFinished
**Requirement**: LOC-15, LOC-16

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Create persists locale from params
- [ ] `markFinished` updates locale to the argument (can differ from create)
- [ ] Integration tests cover both
- [ ] Gate check passes: `bun run test:integration -- src/modules/interview/repository/session-repository.integration.test.ts`
- [ ] Test count: existing + ≥2 new assertions/cases

**Tests**: integration  
**Gate**: full

**Verify**:
`cd Backend && bun run test:integration -- src/modules/interview/repository/session-repository.integration.test.ts`

**Commit**: `feat(interview): store interviewLocale on session create and finish`

---

### T7: Interview prompts — locale at end + localized closing [P]

**What**: Parameterize interviewer, closing-feedback, and review-items-generator prompts with `interviewLocale`; remove mid-prompt `buildLanguageBlock()`; append `buildInterviewLocalePromptBlock` last; localize closing headings/CTA/format via `getClosingFeedbackCopy`.
**Where**: `Backend/src/modules/interview/prompts/interviewer-system-prompt.ts`, `closing-feedback-prompt.ts`, `review-items-generator-prompt.ts`, colocated `*.test.ts`
**Depends on**: T2
**Reuses**: Shared locale helpers; existing prompt unit tests
**Requirement**: LOC-11, LOC-12, LOC-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Built system strings end with the locale language block
- [ ] No hardcoded “English only” mid-block; no PT-only closing when locale is `en`
- [ ] Resume extraction prompt untouched
- [ ] Unit tests assert last section + EN/PT closing copy
- [ ] Gate check passes: `bun run test -- src/modules/interview/prompts`
- [ ] Test count: existing prompt tests updated/passing + new locale cases

**Tests**: unit  
**Gate**: quick

**Verify**:
`cd Backend && bun run test -- src/modules/interview/prompts`

**Commit**: `feat(interview): localize LLM prompts via interviewLocale`

---

### T8: Interview graph state + node + session/stream services

**What**: Add `interviewLocale` to graph state; pass from `streamTurn` body into graph and review-items generator; wire `session-service.create` and `markFinished(..., locale)` on final turn; update controller signatures; unit-test stream/session services.
**Where**: `Backend/src/infrastructure/ai/langgraph/interview-state.ts`, `nodes/interviewer-node.ts`, `modules/interview/service/session-service.ts`, `stream-service.ts`, controllers/factories as needed, `*.test.ts`
**Depends on**: T5, T6, T7
**Reuses**: Existing stream SSE flow; mocked graph in unit tests
**Requirement**: LOC-07, LOC-08, LOC-11, LOC-14, LOC-16

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `streamTurn` accepts `{ content, interviewLocale }` and does not read `User.interviewLocale`
- [ ] Graph invoke includes `interviewLocale`; prompts receive it
- [ ] Final turn calls `markFinished(sessionId, interviewLocale)` with stream body locale
- [ ] Review-items `generate` receives same final-turn locale
- [ ] Unit tests updated for new signatures and final-turn locale update
- [ ] Gate check passes: `bun run lint && bun run check-types && bun run test -- src/modules/interview/service`
- [ ] Test count: existing service tests pass with updates (no silent deletions)

**Tests**: unit  
**Gate**: quick

**Verify**:
`cd Backend && bun run test -- src/modules/interview/service/stream-service.test.ts`

**Commit**: `feat(interview): thread interviewLocale through stream and finish`

---

### T9: Interview E2E — require locale on create/stream

**What**: Update `interview.e2e.test.ts` (and seed helpers) so create/stream send `interviewLocale`; add 422 cases when omitted; assert finished session row has final locale when exercisable.
**Where**: `Backend/src/test/e2e/interview.e2e.test.ts`, `Backend/src/test/helpers/interview-seed-helpers.ts`
**Depends on**: T8
**Reuses**: Existing interview E2E + mocks for graph/LLM
**Requirement**: LOC-07, LOC-08, LOC-16

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Happy-path create/stream include `interviewLocale`
- [ ] Omit locale → 422 on create and stream
- [ ] Gate check passes: `bun run test:e2e -- src/test/e2e/interview.e2e.test.ts`
- [ ] Test count: existing suite green + ≥2 new 422 cases

**Tests**: e2e  
**Gate**: full

**Verify**:
`cd Backend && bun run test:e2e -- src/test/e2e/interview.e2e.test.ts`

**Commit**: `test(interview): cover interviewLocale on create and stream`

---

### T10: Review-session create/stream Zod schemas require `interviewLocale` [P]

**What**: Add required `interviewLocale` to `createReviewSessionSchema` and `reviewSessionStreamBodySchema`; unit tests.
**Where**: `Backend/src/modules/review-sessions/validations/review-session-schemas.ts`, `*.test.ts`
**Depends on**: T2
**Reuses**: Shared `interviewLocaleSchema`
**Requirement**: LOC-09, LOC-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Accept `en`/`pt`; reject missing/invalid
- [ ] Gate check passes: `bun run test -- src/modules/review-sessions/validations`
- [ ] Test count: ≥4 accept/reject cases

**Tests**: unit  
**Gate**: quick

**Verify**:
`cd Backend && bun run test -- src/modules/review-sessions/validations`

**Commit**: `feat(review-sessions): require interviewLocale on create and stream schemas`

---

### T11: `ReviewSessionRepository` create + `markPendingReview` persist locale

**What**: Store `interviewLocale` on create; `markPendingReview(sessionId, interviewLocale)` writes status + locale.
**Where**: `Backend/src/modules/review-sessions/repository/review-session-repository.ts`, `*.integration.test.ts`
**Depends on**: T6 (sequential after T6 to avoid parallel integration)
**Reuses**: Existing review-session repository integration tests
**Requirement**: LOC-15, LOC-17

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Create persists locale; pending_review update overwrites with argument
- [x] Integration tests cover both
- [x] Gate check passes: `bun run test:integration -- src/modules/review-sessions/repository/review-session-repository.integration.test.ts`
- [x] Test count: existing + ≥2 new cases

**Tests**: integration  
**Gate**: full

**Verify**:
`cd Backend && bun run test:integration -- src/modules/review-sessions/repository/review-session-repository.integration.test.ts`

**Commit**: `feat(review-sessions): store interviewLocale on create and pending_review`

---

### T12: Review-session question + evaluation prompts [P]

**What**: Append `buildInterviewLocalePromptBlock` at end of question and evaluation system prompts; unit tests.
**Where**: `Backend/src/modules/review-sessions/prompts/review-session-question-prompt.ts`, `review-session-evaluation-prompt.ts`, `*.test.ts`
**Depends on**: T2
**Reuses**: Shared locale block helper
**Requirement**: LOC-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Both builders take `interviewLocale` and end with language block
- [x] Unit tests assert last-section locale text for `en` and `pt`
- [x] Gate check passes: `bun run test -- src/modules/review-sessions/prompts`
- [x] Test count: ≥2 new cases (or updated suite green)

**Tests**: unit  
**Gate**: quick

**Verify**:
`cd Backend && bun run test -- src/modules/review-sessions/prompts`

**Commit**: `feat(review-sessions): localize question and evaluation prompts`

---

### T13: Review-session services — thread locale to prompts and pending_review

**What**: Wire create/stream services and LangGraph nodes to pass `interviewLocale`; call `markPendingReview(sessionId, interviewLocale)` on completion; unit-test stream service.
**Where**: `review-sessions-service.ts`, `review-session-stream-service.ts`, question/evaluation nodes, controllers, `*.test.ts`
**Depends on**: T10, T11, T12
**Reuses**: Existing stream evaluation completion path
**Requirement**: LOC-09, LOC-10, LOC-14, LOC-17

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Create/stream require locale from body; no User read for prompt language
- [x] Question/eval generators receive locale; pending_review persists stream locale
- [x] Unit tests updated for new signatures
- [x] Gate check passes: `bun run lint && bun run check-types && bun run test -- src/modules/review-sessions/service`
- [x] Test count: existing service tests pass with updates

**Tests**: unit  
**Gate**: quick

**Verify**:
`cd Backend && bun run test -- src/modules/review-sessions/service`

**Commit**: `feat(review-sessions): thread interviewLocale through stream and pending_review`

---

### T14: Review-sessions E2E — require locale

**What**: Update `review-sessions.e2e.test.ts` to send `interviewLocale` on create/stream; add 422 omit cases.
**Where**: `Backend/src/test/e2e/review-sessions.e2e.test.ts`
**Depends on**: T13
**Reuses**: Existing review-sessions E2E helpers/mocks
**Requirement**: LOC-09, LOC-10, LOC-17

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Happy paths include locale; omit → 422
- [ ] Gate check passes: `bun run test:e2e -- src/test/e2e/review-sessions.e2e.test.ts`
- [ ] Test count: suite green + ≥2 new 422 cases

**Tests**: e2e  
**Gate**: full

**Verify**:
`cd Backend && bun run test:e2e -- src/test/e2e/review-sessions.e2e.test.ts`

**Commit**: `test(review-sessions): cover interviewLocale on create and stream`

---

### T15: Frontend types + `mapBrowserLocale` + users API client

**What**: Add `interviewLocale` to `UserWithoutPassword`; implement `mapBrowserLocale`; add `usersApi.patchInterviewLocale`.
**Where**: `frontend/src/types/auth.ts`, `frontend/src/features/interview-locale/map-browser-locale.ts`, `frontend/src/lib/api/users.ts`
**Depends on**: None (API contract from design; prefer after T4 when exercising live Backend)
**Reuses**: `authApi` / `apiRequest` patterns
**Requirement**: LOC-02, LOC-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Types include `interviewLocale: "en" | "pt" | null`
- [ ] `mapBrowserLocale`: `en*`→`en`, `pt*`→`pt`, else `en`
- [ ] PATCH client posts `{ interviewLocale }` to `/api/users/me/interview-locale`
- [ ] Gate check passes: `cd frontend && bun run lint && bun run check-types`

**Tests**: none (FE matrix)  
**Gate**: quick

**Verify**:
`cd frontend && bun run lint && bun run check-types`

**Commit**: `feat(frontend): add interviewLocale types and users API`

---

### T16: `updateUser` on session + `useInterviewLocale` hook

**What**: Allow merging `user.interviewLocale` into stored session; hook reads auth user, bootstraps once when null (map + PATCH), exposes `setLocale`.
**Where**: `frontend/src/features/auth/session-provider.tsx`, `session-storage.ts` (if needed), `frontend/src/features/interview-locale/use-interview-locale.ts`
**Depends on**: T15
**Reuses**: `useAuth`, `setStoredSession`
**Requirement**: LOC-05, LOC-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `updateUser` (or equivalent) persists merged user to localStorage
- [ ] Hook bootstraps only when `interviewLocale === null` on practice/study usage
- [ ] `setLocale` PATCHes and updates stored user; mid-session change allowed
- [ ] Gate check passes: `cd frontend && bun run lint && bun run check-types`

**Tests**: none  
**Gate**: quick

**Verify**:
`cd frontend && bun run lint && bun run check-types`

**Commit**: `feat(frontend): add useInterviewLocale bootstrap and setter`

---

### T17: `InterviewLocaleSelector` on `/practice` and `/study`

**What**: Segmented EN|PT control (practice level-button styles); mount in practice sidebar and study hub header; wired to `useInterviewLocale`.
**Where**: `frontend/src/features/interview-locale/interview-locale-selector.tsx`, `frontend/src/app/(app)/practice/page.tsx`, `frontend/src/features/study/study-hub-content.tsx`
**Depends on**: T16
**Reuses**: Practice level segmented button `cn(...)` styles
**Requirement**: LOC-18

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Selector visible on practice and study
- [ ] Changing selection calls `setLocale`
- [ ] Gate check passes: `cd frontend && bun run lint && bun run check-types`

**Tests**: none  
**Gate**: quick

**Verify**:
`cd frontend && bun run lint && bun run check-types`

**Commit**: `feat(frontend): add EN/PT selector on practice and study`

---

### T18: Wire create/stream clients to always send `interviewLocale`

**What**: Extend interview + review-session API/stream helpers and call sites to require/pass `interviewLocale` from the hook/selector.
**Where**: `frontend/src/lib/api/interview.ts`, `interview-stream.ts`, `review-sessions.ts`, `review-session-stream.ts`, types, practice/study/review-session call sites
**Depends on**: T16, T17
**Reuses**: Existing API client patterns
**Requirement**: LOC-19, LOC-07–10 (client side)

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] All create/stream request bodies include `interviewLocale`
- [ ] Call sites use current selector/hook value (never omit)
- [ ] Gate check passes: `cd frontend && bun run lint && bun run check-types && bun run build`

**Tests**: none  
**Gate**: build

**Verify**:
`cd frontend && bun run lint && bun run check-types && bun run build`

**Commit**: `feat(frontend): send interviewLocale on interview and review-session APIs`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2

Phase 2 (Sequential):
  T2 ──→ T3 ──→ T4

Phase 3 (Parallel units after T2):
  T2 complete, then:
    ├── T5  [P]  interview schemas
    ├── T7  [P]  interview prompts
    ├── T10 [P] review-session schemas
    └── T12 [P] review-session prompts

Phase 4 (Integration sequential):
  T1 ──→ T6 ──→ T11

Phase 5 (Services + E2E):
  T5+T6+T7   ──→ T8 ──→ T9
  T10+T11+T12 ──→ T13 ──→ T14
  (T8∥T13 allowed once respective deps met)

Phase 6 (Frontend sequential):
  T15 ──→ T16 ──→ T17 ──→ T18
  (T17 and T18 both depend on T16; run T17 then T18)
```

**Parallelism constraint:** Integration tasks (T3, T6, T11) and E2E tasks (T4, T9, T14) are not marked `[P]` with peers of the same type (`fileParallelism: false` / shared Testcontainers). Unit-only tasks T5/T7/T10/T12 are `[P]`.

---

## Validation (pre-approval gates)

### Check 1: Granularity

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | Schema + migration | ✅ Cohesive data change |
| T2 | One shared module + unit tests | ✅ |
| T3 | Auth types + one repo method + integration | ✅ |
| T4 | One endpoint module + e2e | ✅ |
| T5 | Two related schemas same file | ✅ |
| T6 | One repository API surface | ✅ |
| T7 | Three related prompt files (same concern) | ⚠️ OK cohesive |
| T8 | State + node + two services (one vertical slice) | ⚠️ OK — single wiring slice |
| T9 | One e2e file update | ✅ |
| T10 | Schemas | ✅ |
| T11 | One repository | ✅ |
| T12 | Two prompts same domain | ✅ |
| T13 | Service wiring slice | ⚠️ OK |
| T14 | One e2e file | ✅ |
| T15–T18 | One FE concern each | ✅ |

### Check 2: Diagram ↔ Depends on

| Task | Depends On (body) | Diagram shows | Status |
| ---- | ----------------- | ------------- | ------ |
| T1 | None | Phase 1 start | ✅ |
| T2 | T1 | T1→T2 | ✅ |
| T3 | T1, T2 | T2→T3 | ✅ |
| T4 | T2, T3 | T3→T4 | ✅ |
| T5 | T2 | T2→T5 | ✅ |
| T6 | T1 | T1→T6 | ✅ |
| T7 | T2 | T2→T7 | ✅ |
| T8 | T5, T6, T7 | fans into T8 | ✅ |
| T9 | T8 | T8→T9 | ✅ |
| T10 | T2 | T2→T10 | ✅ |
| T11 | T6 | T6→T11 | ✅ |
| T12 | T2 | T2→T12 | ✅ |
| T13 | T10, T11, T12 | fans into T13 | ✅ |
| T14 | T13 | T13→T14 | ✅ |
| T15 | None | Phase 6 start | ✅ |
| T16 | T15 | T15→T16 | ✅ |
| T17 | T16 | T16→T17 | ✅ |
| T18 | T16, T17 | T17→T18 | ✅ |

### Check 3: Test co-location vs matrix

| Task | Layer | Matrix requires | Task says | Status |
| ---- | ----- | --------------- | --------- | ------ |
| T1 | prisma schema | none | none | ✅ |
| T2 | shared pure + validations-like | unit | unit | ✅ |
| T3 | repository | integration | integration | ✅ |
| T4 | HTTP routes (+ controller) | e2e | e2e | ✅ |
| T5 | validations | unit | unit | ✅ |
| T6 | repository | integration | integration | ✅ |
| T7 | prompts | unit | unit | ✅ |
| T8 | service (+ thin node) | unit | unit | ✅ |
| T9 | HTTP e2e | e2e | e2e | ✅ |
| T10 | validations | unit | unit | ✅ |
| T11 | repository | integration | integration | ✅ |
| T12 | prompts | unit | unit | ✅ |
| T13 | service | unit | unit | ✅ |
| T14 | HTTP e2e | e2e | e2e | ✅ |
| T15–T18 | FE layers | none | none | ✅ |

---

## Requirement traceability (tasks)

| ID | Tasks |
| -- | ----- |
| LOC-01 | T1 |
| LOC-02 | T3, T4, T15 |
| LOC-03 | T3, T4 |
| LOC-04 | T2, T4 |
| LOC-05 | T15, T16 |
| LOC-06 | T16, T17 |
| LOC-07 | T5, T8, T9, T18 |
| LOC-08 | T5, T8, T9, T18 |
| LOC-09 | T10, T13, T14, T18 |
| LOC-10 | T10, T13, T14, T18 |
| LOC-11 | T2, T7, T12 |
| LOC-12 | T2, T7 |
| LOC-13 | T7 (explicit non-touch) |
| LOC-14 | T8, T13 |
| LOC-15 | T1, T6, T11 |
| LOC-16 | T6, T8, T9 |
| LOC-17 | T11, T13, T14 |
| LOC-18 | T17 |
| LOC-19 | T18 |

**Coverage:** 19 requirements → mapped; 0 unmapped
```