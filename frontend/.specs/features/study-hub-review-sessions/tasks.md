# Study Hub & Review Sessions — Tasks

**Design**: `.specs/features/study-hub-review-sessions/design.md`
**Spec**: `.specs/features/study-hub-review-sessions/spec.md`
**Status**: Draft

---

## Test Coverage Matrix (source: `.specs/codebase/TESTING.md`)

| Code layer | Test type | File suffix | Runner | Parallel-Safe |
|---|---|---|---|---|
| `src/types/` | none | — | — | N/A |
| `src/lib/api/` | none (recommended: unit) | `*.ts` | — | Yes |
| `src/lib/query/hooks/` | none (recommended: unit) | `*.ts` | — | Yes |
| `src/features/` | none (recommended: component) | `*.tsx` | — | Yes |
| `src/app/` (pages) | none (recommended: E2E) | `page.tsx` | — | Yes |

**Gate check commands:**

| Gate | Command |
|---|---|
| `quick` | `bun run lint && bun run check-types` |
| `build` | `bun run lint && bun run check-types && bun run build` |

> No frontend test runner configured. Tasks use `quick` for incremental changes and `build` before merge / end of feature.

---

## Cross-Repo Dependency

**BE-STUDY-01** must complete in `Backend/` before frontend tasks **T8**, **T28**, and **T29** can be verified end-to-end. Frontend may stub `apply`/`applyKeepalive` methods earlier (types + client shape) but report UI must not ship until BE-STUDY-01 is live.

---

## Execution Plan

### Phase 0: Backend prerequisite (cross-repo)

```
BE-STUDY-01
```

### Phase 1: Types + SSE foundation (parallel)

```
T1 [P] ──┐
T2 [P] ──┼──→ T5, T6, T9, T15
T3 [P] ──┘
         └──→ T4
```

### Phase 2: API + query layer

```
T4 ──→ T7
T5 ──→ T10
T6 ──→ T11 [P]
T9 ──┘
T11 ──→ T12

BE-STUDY-01 ──→ T8 ──→ T28
```

### Phase 3: Shared UI + study lib (parallel branches)

```
T13 [P] ──→ T14, T18, T27
T15 [P] ──────────────→ T28
T16 [P] ──→ T25
T17 [P] ──┐
T19 [P] ──┼──→ T21
T18 ──────┘
T12 ──→ T20 ──→ T21 ──→ T22
T23 [P] (sidebar — parallel after T9)
```

### Phase 4: Review Session routes

```
T24 [P] ──→ T25 ──→ T26
T27 ──→ T28 ──→ T29
```

### Phase 5: Integration + docs

```
T10 includes call-site updates
T30 [P] ──→ T31
T26, T29, T22 complete ──→ T31
```

---

## Task Breakdown

### BE-STUDY-01: Backend bulk apply endpoint (cross-repo)

**What**: Add `POST /api/review-sessions/:id/apply`; remove per-item `confirm`; update API docs and E2E.
**Where**: `Backend/src/modules/review-sessions/` (see `design.md` BE-STUDY-01 sketch)
**Depends on**: Backend feature `review-items-learned-status` (already executed)
**Reuses**: `ReviewMergeService.applyReviewSessionConfirmation`, existing Zod patterns
**Requirement**: STUDY-20–25 (unblocks), STUDY-DEC-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `POST /api/review-sessions/:id/apply` accepts `{ items: [{ reviewSessionItemId, status, priority? }] }` with all items required
- [ ] Session transitions to `completed`; underlying `review_items` updated per item
- [ ] Per-item `POST .../items/:itemId/confirm` route removed
- [ ] `Backend/docs/frontend-mock-interview-api.md` updated
- [ ] Backend E2E updated and passing: `bun run test:e2e` (review-sessions suite)

**Tests**: e2e (backend)
**Gate**: backend e2e

**Commit**: `feat(review-sessions): add bulk apply endpoint and remove per-item confirm`

---

### T1: Extend `review-items` types [P]

**What**: Add `ReviewItemStatus`, `ReviewItemsStatusFilter`, `status`, `learnedAt` to review item types.
**Where**: `src/types/review-items.ts`
**Depends on**: None
**Reuses**: Existing `ReviewPriority`, `ReviewItem` shape
**Requirement**: STUDY-01–03, STUDY-06–09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `ReviewItemStatus`, `ReviewItemsStatusFilter` exported
- [ ] `ReviewItem` includes `status` and `learnedAt`
- [ ] `bun run check-types` passes

**Tests**: none
**Gate**: quick

**Commit**: `feat(types): extend review-items with status and learnedAt`

---

### T2: Create `review-sessions` types [P]

**What**: Add all Review Session types from design (session, stream meta, apply payload).
**Where**: `src/types/review-sessions.ts`
**Depends on**: None
**Reuses**: `ReviewPriority`, `ReviewItemStatus` from `review-items.ts`
**Requirement**: STUDY-10–25

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `ReviewSession`, `ReviewSessionItemReport`, `CreateReviewSessionResponse` exported
- [ ] `ReviewSessionStreamMeta` discriminated union (progress | complete) exported
- [ ] `ApplyReviewSessionRequest` / `ApplyReviewSessionItem` exported
- [ ] `bun run check-types` passes

**Tests**: none
**Gate**: quick

**Commit**: `feat(types): add review-sessions domain types`

---

### T3: Shared SSE stream reader [P]

**What**: Extract `readSseStream()` from interview stream logic into a shared module.
**Where**: `src/lib/api/sse-stream.ts` (new)
**Depends on**: None
**Reuses**: Parser logic from `src/lib/api/interview-stream.ts`
**Requirement**: STUDY-14–16, STUDY-DES-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `SseStreamCallbacks` and `readSseStream(response, callbacks)` exported
- [ ] Handles `token`, `meta`, `error` events and `[DONE]` terminal
- [ ] `bun run check-types` passes

**Tests**: none
**Gate**: quick

**Commit**: `refactor(api): extract shared SSE stream reader`

---

### T4: Refactor `interview-stream.ts` to use `sse-stream`

**What**: Replace inline SSE parsing in `streamInterviewTurn` with `readSseStream`; behavior unchanged.
**Where**: `src/lib/api/interview-stream.ts`
**Depends on**: T3
**Reuses**: `readSseStream`, existing `StreamTurnCallbacks`
**Requirement**: STUDY-DES-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `streamInterviewTurn` delegates parsing to `readSseStream`
- [ ] No duplicate buffer/split logic remains in `interview-stream.ts`
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `refactor(api): use shared SSE reader in interview stream`

---

### T5: Extend `review-items` API client

**What**: Add `list(token, status?)`, `patchStatus`, `delete` methods.
**Where**: `src/lib/api/review-items.ts`
**Depends on**: T1
**Reuses**: `apiRequest`, existing `list` pattern
**Requirement**: STUDY-02–03, STUDY-06–08

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `list` appends `?status=` when filter provided (default active via hook, not client)
- [ ] `patchStatus(token, id, status)` → `PATCH /api/review-items/:id`
- [ ] `delete(token, id)` → `DELETE /api/review-items/:id`
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(api): extend review-items client with filter patch and delete`

---

### T6: Create `review-sessions` API client (create + getById) [P]

**What**: REST client for session creation and report fetch.
**Where**: `src/lib/api/review-sessions.ts` (new)
**Depends on**: T2
**Reuses**: `apiRequest`, `ApiError`
**Requirement**: STUDY-10–11, STUDY-20

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `reviewSessionsApi.create(token, reviewItemIds)` → `POST /api/review-sessions`
- [ ] `reviewSessionsApi.getById(token, sessionId)` → `GET /api/review-sessions/:id`
- [ ] Exported as `reviewSessionsApi` object (matches `reviewItemsApi` convention)
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(api): add review-sessions create and getById client`

---

### T7: Review session SSE stream client

**What**: `streamReviewSessionTurn()` using shared SSE reader.
**Where**: `src/lib/api/review-session-stream.ts` (new)
**Depends on**: T2, T4
**Reuses**: `readSseStream`, `env.NEXT_PUBLIC_SERVER_URL`, `ApiError`
**Requirement**: STUDY-14–18

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `POST /api/review-sessions/:id/stream` with optional `{ answer }` body
- [ ] `onToken` / `onMeta` callbacks typed with `ReviewSessionStreamMeta`
- [ ] HTTP errors and `event: error` throw `ApiError`
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(api): add review-session SSE stream client`

---

### T8: Add bulk apply methods to `review-sessions` API

**What**: `apply()` via `apiRequest` and `applyKeepalive()` via raw `fetch` with `keepalive: true`.
**Where**: `src/lib/api/review-sessions.ts`
**Depends on**: T6, BE-STUDY-01
**Reuses**: `apiRequest`, `env`, Bearer header pattern from SSE clients
**Requirement**: STUDY-20–25, STUDY-DES-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `apply(token, sessionId, body)` → `POST .../apply` returns parsed response
- [ ] `applyKeepalive(token, sessionId, body)` fires request without awaiting body (best-effort on unload)
- [ ] Gate check passes: `bun run lint && bun run check-types`
- [ ] Manual smoke: apply call succeeds against local backend with `pending_review` session

**Tests**: none
**Gate**: quick (+ manual smoke against BE-STUDY-01)

**Commit**: `feat(api): add review-session bulk apply client`

---

### T9: Extend TanStack Query keys

**What**: Parametric `reviewItems(status)` key and `reviewSession(sessionId)` key.
**Where**: `src/lib/query/keys.ts`
**Depends on**: T1
**Reuses**: Existing `as const` key pattern
**Requirement**: STUDY-01–03

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `queryKeys.reviewItems(status)` defaults to `"active"`
- [ ] `queryKeys.reviewSession(sessionId)` added
- [ ] Gate check passes: `bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(query): add review-items status and review-session keys`

---

### T10: Parametric `useReviewItems` + update call sites

**What**: `useReviewItems(status?)` hook; fix dashboard, feedback, interview-review-panel imports.
**Where**: `src/lib/query/hooks/use-review-items.ts`, call sites in `dashboard-stats.ts`, `feedback/page.tsx`, `interview-review-panel.tsx`
**Depends on**: T5, T9
**Reuses**: `fetchWithAuth`, existing hook pattern
**Requirement**: STUDY-01–03, STUDY-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Hook accepts optional `ReviewItemsStatusFilter` (default `"active"`)
- [ ] Dashboard uses appropriate filter (`"active"` or `"all"` — match current count semantics)
- [ ] Feedback and interview review panel still load items (default active is fine for session filter client-side)
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(query): parametric useReviewItems and update call sites`

---

### T11: `useReviewSession` hook [P]

**What**: Query hook wrapping `reviewSessionsApi.getById`.
**Where**: `src/lib/query/hooks/use-review-session.ts` (new)
**Depends on**: T6, T9
**Reuses**: `useAuth`, `useQuery`
**Requirement**: STUDY-20, STUDY-26–27

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `useReviewSession(sessionId)` enabled when authenticated and id present
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(query): add useReviewSession hook`

---

### T12: Session storage + `useOpenReviewSession`

**What**: `review-session-storage.ts` helpers and hook for resume banner.
**Where**: `src/features/study/lib/review-session-storage.ts`, `src/lib/query/hooks/use-open-review-session.ts`
**Depends on**: T11
**Reuses**: `sessionStorage`, `useReviewSession`
**Requirement**: STUDY-26–28, STUDY-DES-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `getLastReviewSessionId` / `setLastReviewSessionId` / `clearLastReviewSessionId` exported
- [ ] `useOpenReviewSession()` returns open session when status is `in_progress` or `pending_review`
- [ ] On 404 from fetch, clears storage
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(study): add open review session storage and hook`

---

### T13: `ReviewPriorityBadge` component [P]

**What**: Extract priority chip from `review-items-grid.tsx`.
**Where**: `src/features/study/review-priority-badge.tsx` (new)
**Depends on**: None
**Reuses**: `PRIORITY_STYLES` from grid, `cn()`
**Requirement**: STUDY-02, STUDY-DES-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Component accepts `priority: ReviewPriority` and optional `className`
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(study): extract ReviewPriorityBadge component`

---

### T14: Refactor `review-items-grid` to use badge

**What**: Replace inline priority styles with `ReviewPriorityBadge`.
**Where**: `src/features/dashboard/review-items-grid.tsx`
**Depends on**: T13
**Reuses**: `ReviewPriorityBadge`
**Requirement**: STUDY-DES-09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Grid imports badge; no duplicate `PRIORITY_STYLES` in grid file
- [ ] Visual output unchanged (dashboard + feedback)
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `refactor(dashboard): use shared ReviewPriorityBadge in grid`

---

### T15: Report card state helpers [P]

**What**: `initReportCardState`, `updateReportCardState`, `buildApplyPayload` with validation.
**Where**: `src/features/study/lib/report-card-state.ts`, `src/features/study/lib/build-apply-payload.ts`
**Depends on**: T2
**Reuses**: Types from `review-sessions.ts`
**Requirement**: STUDY-20–23, STUDY-DES-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `initReportCardState` handles `suggestedStatus: null` (evaluation failed)
- [ ] `buildApplyPayload` omits `priority` for learned items; throws or returns error info when active lacks priority
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(study): add report card state and apply payload helpers`

---

### T16: Review display message helpers [P]

**What**: Helpers to append human/ai/topic messages for local Q&A state.
**Where**: `src/features/study/lib/review-display-messages.ts`
**Depends on**: None
**Reuses**: `ReviewDisplayMessage` type (define in same file or types)
**Requirement**: STUDY-14–15, STUDY-DES-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] `appendHumanMessage`, `appendAiMessage`, `appendTopicDivider` (or equivalent) exported
- [ ] Gate check passes: `bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(study): add review session display message helpers`

---

### T17: `StudyTabs` component [P]

**What**: Active | Learned tab switcher (controlled).
**Where**: `src/features/study/study-tabs.tsx`
**Depends on**: None
**Reuses**: Tailwind tokens, `cn()`
**Requirement**: STUDY-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Props: `activeTab`, `onTabChange`
- [ ] English labels: "Active", "Learned"
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(study): add StudyTabs component`

---

### T18: `StudyItemCard` component

**What**: Review item card with checkbox (optional), actions, priority badge.
**Where**: `src/features/study/study-item-card.tsx`
**Depends on**: T13, T1
**Reuses**: `ReviewPriorityBadge`, `window.confirm` for delete
**Requirement**: STUDY-02–03, STUDY-06–09, STUDY-10

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Active mode: checkbox, Mark as learned, Delete
- [ ] Learned mode: shows `learnedAt`, Reactivate, Delete
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(study): add StudyItemCard component`

---

### T19: `StudySelectionBar` component [P]

**What**: Sticky footer with selected count and "Start review session" button.
**Where**: `src/features/study/study-selection-bar.tsx`
**Depends on**: None
**Reuses**: Button styling from interview chat
**Requirement**: STUDY-10–13, STUDY-DES-11

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Shows `{n} selected` and disabled state when n=0 or starting
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(study): add StudySelectionBar component`

---

### T20: `StudyResumeBanner` component

**What**: Banner CTA for `in_progress` / `pending_review` sessions.
**Where**: `src/features/study/study-resume-banner.tsx`
**Depends on**: T12
**Reuses**: `useOpenReviewSession`, `Link`
**Requirement**: STUDY-26–28

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Copy and href differ per status (Q&A vs report route)
- [ ] Hidden when no open session
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(study): add StudyResumeBanner component`

---

### T21: `StudyHubContent` page component

**What**: Wire tabs, lists, selection, PATCH/DELETE, session start, banner.
**Where**: `src/features/study/study-hub-content.tsx`
**Depends on**: T10, T6, T12, T17, T18, T19, T20
**Reuses**: `useReviewItems`, `reviewSessionsApi`, `toast`, `setLastReviewSessionId`
**Requirement**: STUDY-01–13, STUDY-06–09

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Active tab: multi-select max 10 with toast on exceed
- [ ] Start session → storage + navigate to `/review-session/[id]`
- [ ] PATCH learned/reactivate and DELETE with query invalidation
- [ ] Empty states per tab
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(study): add StudyHubContent with backlog management`

---

### T22: `/study` App Router page

**What**: Thin page wrapping `StudyHubContent` in `AppShell`.
**Where**: `src/app/(app)/study/page.tsx`
**Depends on**: T21
**Reuses**: `AppShell` pattern from `feedback/page.tsx`
**Requirement**: STUDY-01, STUDY-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Route `/study` renders hub inside `AppShell`
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(app): add /study route`

---

### T23: Sidebar Study navigation [P]

**What**: Add Study link with `BookOpen` icon after Feedback; highlight for `/study` and `/review-session/*`.
**Where**: `src/features/dashboard/app-sidebar.tsx`
**Depends on**: T9
**Reuses**: `NAV_ITEMS` pattern
**Requirement**: STUDY-05, STUDY-DES-10

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Nav item `{ label: "Study", href: "/study", icon: BookOpen }` added
- [ ] Active state matches `/study` and `/review-session` prefixes
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(nav): add Study link to app sidebar`

---

### T24: `ReviewSessionProgress` component [P]

**What**: Header showing topic/question progress from stream meta.
**Where**: `src/features/study/review-session-progress.tsx`
**Depends on**: None
**Reuses**: Design formula: `Topic ${itemIndex+1}/${totalItems} — Question ${turnsCompleted+1}/${questionsPerItem}`
**Requirement**: STUDY-16

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Renders null when meta absent
- [ ] Gate check passes: `bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(study): add ReviewSessionProgress component`

---

### T25: `ReviewSessionChat` component

**What**: Full SSE Q&A orchestrator with local messages, auto-first-question, redirect on complete.
**Where**: `src/features/study/review-session-chat.tsx`
**Depends on**: T7, T11, T16, T24
**Reuses**: `InterviewChatInput`, `InterviewMessageList`, `streamReviewSessionTurn`, `AbortController`
**Requirement**: STUDY-14–19, STUDY-DES-03, STUDY-DES-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Mount fetches first question (no answer)
- [ ] Submit answer streams next question; topic divider on `itemIndex` change
- [ ] `pending_review` meta → `router.push(.../report)`
- [ ] `409` / completed / pending_review from `getById` → correct redirect
- [ ] Abort on unmount
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(study): add ReviewSessionChat SSE orchestrator`

---

### T26: Review session Q&A page

**What**: App Router page for `/review-session/[sessionId]`.
**Where**: `src/app/(app)/review-session/[sessionId]/page.tsx`
**Depends on**: T25
**Reuses**: `AppShell`, `use(params)` pattern
**Requirement**: STUDY-14

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Page renders `ReviewSessionChat` with session id
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(app): add review-session Q&A route`

---

### T27: `ReviewReportCard` component

**What**: Editable single-item report card (priority select, learned toggle, evaluation warning).
**Where**: `src/features/study/review-report-card.tsx`
**Depends on**: T13, T15
**Reuses**: `ReviewPriorityBadge`, `ReportCardState`
**Requirement**: STUDY-21–22

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Shows current vs suggested copy
- [ ] `evaluationFailed` shows inline warning
- [ ] `onChange` updates parent card state
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(study): add ReviewReportCard component`

---

### T28: `ReviewSessionReport` component

**What**: Report page content — card list, single Apply, auto-apply on leave.
**Where**: `src/features/study/review-session-report.tsx`
**Depends on**: T8, T11, T15, T27, BE-STUDY-01
**Reuses**: `buildApplyPayload`, `apply`/`applyKeepalive`, `appliedRef` guard, query invalidation
**Requirement**: STUDY-20–25, STUDY-DES-06, STUDY-DES-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Loads session; redirects if not `pending_review`
- [ ] Apply button calls bulk apply; success → clear storage → `/study`
- [ ] Unmount / `beforeunload` triggers `applyKeepalive` when not yet applied
- [ ] Gate check passes: `bun run lint && bun run check-types`
- [ ] Manual smoke: full apply flow against backend

**Tests**: none
**Gate**: quick (+ manual smoke)

**Commit**: `feat(study): add ReviewSessionReport with bulk apply`

---

### T29: Review session report page

**What**: App Router page for `/review-session/[sessionId]/report`.
**Where**: `src/app/(app)/review-session/[sessionId]/report/page.tsx`
**Depends on**: T28
**Reuses**: `AppShell`
**Requirement**: STUDY-20

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Page renders `ReviewSessionReport`
- [ ] Gate check passes: `bun run lint && bun run check-types`

**Tests**: none
**Gate**: quick

**Commit**: `feat(app): add review-session report route`

---

### T30: Update frontend API integration docs [P]

**What**: Document `/study`, review-sessions endpoints, bulk apply in `docs/api-integration.md`.
**Where**: `docs/api-integration.md`
**Depends on**: T22, T26, T29 (routes exist)
**Reuses**: Existing doc table format
**Requirement**: STUDY-05

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Routes table includes `/study`, `/review-session/[id]`, `/review-session/[id]/report`
- [ ] Notes bulk apply (not per-item confirm)
- [ ] No code gate (docs-only)

**Tests**: none
**Gate**: none

**Commit**: `docs: document study hub and review-session routes`

---

### T31: Final build gate + manual UAT

**What**: Full production build; execute manual UAT checklist from design.md.
**Where**: Entire feature
**Depends on**: T22, T26, T29, T23, T30, BE-STUDY-01
**Reuses**: Design manual UAT checklist (7 scenarios)
**Requirement**: All STUDY-*

**Tools**:
- MCP: `cursor-ide-browser` (optional — for UAT walkthrough)
- Skill: NONE

**Done when**:
- [ ] `bun run lint && bun run check-types && bun run build` passes
- [ ] Manual UAT checklist completed (document pass/fail in PR or session notes)
- [ ] No TypeScript errors on new routes

**Tests**: none (manual UAT)
**Gate**: build

**Commit**: N/A (verification task — no code commit unless fixes needed)

---

## Parallel Execution Map

```
Level 0 (Parallel):
  BE-STUDY-01 (Backend — separate repo)
  T1 [P], T2 [P], T3 [P], T13 [P], T15 [P], T16 [P], T17 [P], T19 [P], T24 [P]

Level 1:
  T4 (T3)
  T5 (T1), T6 [P] (T2), T9 (T1), T14 (T13), T18 (T13, T1)

Level 2:
  T7 (T2, T4)
  T10 (T5, T9)
  T11 [P] (T6, T9)
  T23 [P] (T9)

Level 3:
  T12 (T11)
  T8 (T6, BE-STUDY-01)
  T27 (T13, T15)

Level 4:
  T20 (T12)
  T21 (T10, T6, T12, T17, T18, T19, T20)
  T25 (T7, T11, T16, T24)

Level 5:
  T22 (T21)
  T26 (T25)
  T28 (T8, T11, T15, T27, BE-STUDY-01)

Level 6:
  T29 (T28)
  T30 [P] (T22, T26, T29)

Level 7:
  T31 (all routes + BE-STUDY-01)
```

---

## Pre-Approval Validation

### Check 1: Task Granularity

| Task | Scope | Status |
|---|---|---|
| BE-STUDY-01 | 1 backend endpoint + removal | ✅ Granular |
| T1 | 1 types file | ✅ Granular |
| T2 | 1 types file | ✅ Granular |
| T3 | 1 SSE utility | ✅ Granular |
| T4 | 1 refactor | ✅ Granular |
| T5 | 1 API file extend | ✅ Granular |
| T6 | 2 methods, 1 file | ✅ Granular |
| T7 | 1 stream client | ✅ Granular |
| T8 | 2 methods, same file | ✅ Granular |
| T9 | 1 keys file | ✅ Granular |
| T10 | 1 hook + call sites | ✅ Granular |
| T11 | 1 hook | ✅ Granular |
| T12 | storage + 1 hook | ✅ Granular |
| T13–T20 | 1 component each | ✅ Granular |
| T21 | 1 orchestrator component | ✅ Granular |
| T22, T26, T29 | 1 page each | ✅ Granular |
| T23 | 1 nav change | ✅ Granular |
| T25 | 1 chat orchestrator | ✅ Granular |
| T28 | 1 report orchestrator | ✅ Granular |
| T30 | 1 doc file | ✅ Granular |
| T31 | verification | ✅ Granular |

### Check 2: Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
|---|---|---|---|
| BE-STUDY-01 | Backend executed | Phase 0 | ✅ Match |
| T1 | None | Level 0 | ✅ Match |
| T2 | None | Level 0 | ✅ Match |
| T3 | None | Level 0 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T1 | T1 → T5 | ✅ Match |
| T6 | T2 | T2 → T6 | ✅ Match |
| T7 | T2, T4 | T4 → T7 | ✅ Match |
| T8 | T6, BE-STUDY-01 | BE → T8 | ✅ Match |
| T9 | T1 | T1 → T9 | ✅ Match |
| T10 | T5, T9 | T5,T9 → T10 | ✅ Match |
| T11 | T6, T9 | T6,T9 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | None | Level 0 | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |
| T15 | T2 | T2 → T15 | ✅ Match |
| T16 | None | Level 0 | ✅ Match |
| T17 | None | Level 0 | ✅ Match |
| T18 | T13, T1 | T13,T1 → T18 | ✅ Match |
| T19 | None | Level 0 | ✅ Match |
| T20 | T12 | T12 → T20 | ✅ Match |
| T21 | T10,T6,T12,T17,T18,T19,T20 | → T21 | ✅ Match |
| T22 | T21 | T21 → T22 | ✅ Match |
| T23 | T9 | T9 → T23 | ✅ Match |
| T24 | None | Level 0 | ✅ Match |
| T25 | T7,T11,T16,T24 | → T25 | ✅ Match |
| T26 | T25 | T25 → T26 | ✅ Match |
| T27 | T13, T15 | → T27 | ✅ Match |
| T28 | T8,T11,T15,T27,BE | → T28 | ✅ Match |
| T29 | T28 | T28 → T29 | ✅ Match |
| T30 | T22,T26,T29 | → T30 | ✅ Match |
| T31 | T22,T26,T29,T23,T30,BE | → T31 | ✅ Match |

### Check 3: Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| BE-STUDY-01 | HTTP routes (backend) | e2e | e2e | ✅ OK |
| T1–T2 | types | none | none | ✅ OK |
| T3–T8 | lib/api | none | none | ✅ OK |
| T9–T12 | query hooks | none | none | ✅ OK |
| T13–T28 | features | none | none | ✅ OK |
| T22,T26,T29 | app pages | none | none | ✅ OK |
| T30 | docs | none | none | ✅ OK |
| T31 | verification | none | manual UAT | ✅ OK |

---

## Requirement Traceability (tasks coverage)

| Requirement | Task(s) |
|---|---|
| STUDY-01–05 | T9, T10, T17, T18, T21, T22, T23 |
| STUDY-06–09 | T1, T5, T10, T18, T21 |
| STUDY-10–13 | T2, T6, T19, T21 |
| STUDY-14–19 | T3, T4, T7, T16, T24, T25, T26 |
| STUDY-20–25 | T2, T8, T15, T27, T28, T29, BE-STUDY-01 |
| STUDY-26–28 | T12, T20, T21 |

---

## Next: Tools & Skills Confirmation

Before execution, confirm per task:

| Task range | MCP | Skill |
|---|---|---|
| BE-STUDY-01 | NONE | NONE (Backend repo) |
| T1–T30 | NONE | NONE |
| T31 (UAT) | `cursor-ide-browser` (optional) | NONE |

**Suggested execution order for a single agent:**

1. **BE-STUDY-01** in Backend (blocker for report)
2. **T1–T12** foundation (can parallelize T1/T2/T3/T13)
3. **T13–T23** study hub (ship `/study` early)
4. **T24–T26** Q&A flow
5. **T8 + T27–T29** report (after BE-STUDY-01)
6. **T30–T31** docs + build/UAT

---

**Next step:** Approve tasks → **Execute** starting with BE-STUDY-01 or frontend foundation (T1–T7) in parallel if backend is delegated separately.
