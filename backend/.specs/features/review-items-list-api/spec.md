# Review Items List API — Specification

## Problem Statement

After a mock interview ends, the backend persists personalized review topics (`review_items`) via the `review_items_generator` pipeline and `ReviewMergeService`. The closing message already directs candidates to a “review items” tab, but **there is no HTTP endpoint** to load that data. The frontend can only show a placeholder or feature flag.

This feature exposes a read-only list endpoint so the UI can render what the user should study, scoped to the authenticated user.

## Goals

- [ ] `GET /api/review-items` returns all review items for the JWT user.
- [ ] Response is stable, typed, and documented (OpenAPI + `docs/frontend-mock-interview-api.md`).
- [ ] Reuses existing `ReviewRepository.listByUserId` (no duplicate query logic).
- [ ] Follows project conventions: module auto-mount, controller → service → repository, Bearer auth.

## Out of Scope

| Item | Reason |
|------|--------|
| `POST` / `PATCH` / `DELETE` on review items | Items are created/merged only by the interview pipeline |
| Filter by `sessionId`, search, pagination | Not required for MVP; list size is bounded per user (~tens of topics) |
| Mark item as “done” / “dismissed” | No column or product rule yet |
| Including full interview transcript in response | UI only needs study topics |
| Nested module under `/api/interview/...` | User and routing convention target `/api/review-items` (dedicated module folder `review-items`) |

---

## Relationship to Existing Features

| Feature | Link | Relevance |
|---------|------|-----------|
| AI Mock Interview | [spec.md](../ai-mock-interview/spec.md) (`AMI-23`–`AMI-26`, `AMI-31`) | Defines `review_items` schema and merge rules |
| Interview Closing Feedback | [spec.md](../interview-closing-feedback/spec.md) | CTA points users to review tab; explicitly deferred GET endpoint |
| Frontend integration doc | `docs/frontend-mock-interview-api.md` | Update § “Itens de revisão” when implemented |

**Brownfield assets (already implemented):**

- Prisma model `ReviewItem` (`topic`, `description`, `priority`, `sessionId`, `userId`, timestamps).
- `ReviewRepository.listByUserId(userId)` — `orderBy: { updatedAt: "desc" }`.
- Items written on final interview turn in `InterviewStreamService`.

---

## API Contract (proposed)

### Route

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/review-items` | `Authorization: Bearer <accessToken>` |

Mounting: new module `src/modules/review-items/routes/review-items-routes.ts` (auto-discovery maps folder name → `/api/review-items`). Handler registers `GET /` on the module router.

### Success response — `200 OK`

```json
{
  "reviewItems": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "sessionId": "660e8400-e29b-41d4-a716-446655440001",
      "topic": "system design",
      "description": "Practice scalability patterns and trade-offs you mentioned.",
      "priority": "high",
      "createdAt": "2026-05-28T12:00:00.000Z",
      "updatedAt": "2026-05-29T10:30:00.000Z"
    }
  ]
}
```

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | Stable key for React lists |
| `sessionId` | `string` (UUID) | Last session that updated this topic (merge updates `sessionId`) |
| `topic` | `string` | Normalized lowercase in DB |
| `description` | `string` | Latest LLM-generated guidance |
| `priority` | `"low"` \| `"medium"` \| `"high"` | Escalates on recurring gaps |
| `createdAt` | ISO 8601 string | First time topic appeared |
| `updatedAt` | ISO 8601 string | Last merge / upsert |

`userId` is **omitted** from the response (always the token subject).

### Empty state — `200 OK`

```json
{ "reviewItems": [] }
```

Valid when the user never finished an interview or review generation has not run yet. **Not** `404`.

### Error responses

| Status | When |
|--------|------|
| `401` | Missing/invalid token (existing `check-auth` middleware) |
| `500` | Unexpected server error |

---

## Sorting (decision required)

**REV-DEC-01 — Default list order for UI**

| Option | Behavior | Recommendation |
|--------|----------|----------------|
| A | `updatedAt` desc only (current repository) | Simplest; “most recently touched” first |
| B | `priority` desc (`high` → `medium` → `low`), then `updatedAt` desc | Better for a “what to study first” tab |

**Recommendation:** **Option B** for the list API DTO (sort in service layer after fetch, or extend repository with explicit `orderBy`). Repository default can stay for internal generator use.

---

## User Stories

### P1: List my review items — MVP

**User Story**: As a candidate who completed mock interviews, I want to see my saved review topics in the app so I know what to study next.

**Why P1**: Unblocks the review tab promised in closing feedback; data already exists in PostgreSQL.

**Acceptance Criteria**:

1. WHEN an authenticated user sends `GET /api/review-items` THEN the system SHALL return `200` with `{ reviewItems: [...] }` containing only rows where `user_id` matches the JWT `userId`.
2. WHEN the user has no review items THEN the system SHALL return `200` with `{ reviewItems: [] }`.
3. WHEN the response includes items THEN each element SHALL expose `id`, `sessionId`, `topic`, `description`, `priority`, `createdAt`, and `updatedAt` as ISO 8601 strings.
4. WHEN items are returned THEN they SHALL be ordered per **REV-DEC-01** (default recommendation: priority desc, then `updatedAt` desc).
5. WHEN the request has no valid Bearer token THEN the system SHALL respond `401` (existing auth middleware).

**Independent Test**: Finish one interview (or seed `review_items` for test user) → `GET /api/review-items` with token → non-empty array with expected fields; second user token → empty or own data only.

---

### P2: OpenAPI and frontend doc — should have

**User Story**: As a frontend developer, I want the endpoint documented next to the other mock-interview routes so integration is copy-paste friendly.

**Acceptance Criteria**:

1. WHEN Swagger is served THEN `GET /api/review-items` SHALL appear with response schema and `401`.
2. WHEN `docs/frontend-mock-interview-api.md` is updated THEN it SHALL document this route (replace “no GET yet” note) and example JSON.

**Independent Test**: Open `/api-docs` and confirm path; doc section matches live response.

---

### P3: Automated tests — should have

**User Story**: As a maintainer, I want unit and e2e coverage so regressions in auth scoping or response shape are caught.

**Acceptance Criteria**:

1. WHEN `ReviewItemsService` (or equivalent) is tested THEN it SHALL map DB entities to the public DTO and apply sort order.
2. WHEN e2e runs against the app THEN `GET /api/review-items` without token SHALL return `401`; with token and seeded data SHALL return `200` and expected shape.

---

## Edge Cases

- WHEN review generation failed on the final turn (`is_finished` may still be `false`) THEN previously merged items from **past** sessions SHALL still appear in the list (per-user aggregate, not per-session).
- WHEN the same `topic` was merged across sessions THEN only one row exists (`@@unique([userId, topic])`); `sessionId` reflects the **last** upsert.
- WHEN two requests run concurrently THEN both SHALL return a consistent snapshot (no special locking required).

---

## Implementation Notes (for Design / Execute)

Thin vertical slice — **medium scope**, design can stay inline:

```
review-items/
  routes/review-items-routes.ts   → GET /
  controller/review-items-controller.ts
  service/review-items-service.ts  → listForUser(userId), sort, map to DTO
  validations/review-items-schemas.ts  → Zod + OpenAPI (optional response schema)
factories/review-items/...
```

Reuse `ReviewRepository` from `@/modules/interview/repository/review-repository` (import from interview module or move to shared only if circular deps appear — prefer import as-is).

No migration required.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|----------------|-------|-------|--------|
| REV-01 | P1 | Execute | Verified |
| REV-02 | P1 | Execute | Verified |
| REV-03 | P1 | Execute | Verified |
| REV-04 | P1 | Execute | Verified |
| REV-05 | P1 | Execute | Verified |
| REV-06 | P2 | Execute | Verified |
| REV-07 | P2 | Execute | Verified |
| REV-08 | P3 | Execute | Verified |
| REV-09 | P3 | Execute | Verified |

**Coverage:** 9 total, 0 mapped to tasks, 9 unmapped

---

## Success Criteria

- [ ] Frontend can replace placeholder on the review tab with a single `GET /api/review-items` call after login.
- [ ] No cross-user data leakage (verified by e2e or manual two-user test).
- [ ] `docs/frontend-mock-interview-api.md` and Swagger stay in sync with the implementation.

---

## Decisions (resolved)

1. **REV-DEC-01:** Option **B** — `priority` desc, then `updatedAt` desc.
2. **Path:** `GET /api/review-items` (module `review-items`).

---

**Next steps after approval:** Skip formal `design.md` (straightforward CRUD-read). Optional `tasks.md` if you want explicit checklist; otherwise **implement** directly with atomic commits per layer (route → service → docs → tests).
