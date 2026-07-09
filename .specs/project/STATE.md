# State

**Last Updated:** 2026-07-09  
**Current Work:** Interview Locale (EN | PT) — Verified (full gate green)

---

## Recent Decisions (Last 60 days)

### AD-010: Interview locale preference on User + body enum for prompts (2026-07-09)

**Decision:** `User.interviewLocale` (`en` | `pt`, nullable) for preference; create/stream require allowlisted `interviewLocale`; const map builds end-of-system-prompt language block; session column stores completion locale for metrics.  
**Reason:** Avoid prompt injection from free-text language; avoid per-turn User reads; keep UI i18n separate later.  
**Trade-off:** FE must always send locale on create/stream; mid-session change relies on next request body, not DB.  
**Impact:** Auth payload, new PATCH endpoint, Prisma on User + InterviewSession + ReviewSession, five prompt builders, FE selector on `/practice` and `/study`.  
**Spec:** `.specs/features/interview-locale/spec.md`

### AD-009: Use existing `Int` user IDs (not UUID) for FK columns (2026-05-27)

**Decision:** Aligns with current Prisma `User` model; avoids migration of auth layer.  
**Reason:** Brownfield auth.  
**Trade-off:** Entity PKs remain UUID; user FKs stay Int.  
**Impact:** All interview/resume FKs use Int `userId`.

### AD-008: Resume/session/message/review entity IDs use UUID (2026-05-27)

**Decision:** UUID PKs for interview domain entities.  
**Reason:** Matches LangGraph `thread_id` requirement.  
**Trade-off:** Mixed Int/UUID ID strategy.  
**Impact:** Session ids are UUID strings in API paths.

---

## Active Blockers

_None_

---

## Lessons Learned

### L-003: Required body fields break unrelated E2E helpers (2026-07-09)

**Context:** Validation after interview-locale made `interviewLocale` required on interview create/stream.  
**Problem:** `rate-limit-redis` and `token-usage` E2E still sent old payloads → 422 instead of 201.  
**Solution:** Added `interviewLocale: "en"` to create/stream bodies in those suites; grepped remaining E2E helpers.  
**Prevents:** “Feature E2E green, full suite red” after schema tightenings.

### L-001: Required Prisma fields break check-types before callers exist (2026-07-09)

**Context:** T1 added required `interviewLocale` on session models.  
**Problem:** `bun run check-types` failed across repos/fixtures before T6/T11 could wire params.  
**Solution:** Temporary `@default(en)` + create stubs, then replace with real params in T6/T11.  
**Prevents:** Blocking foundation commits on downstream call-site updates; plan stub→wire when schema gates include full tsc.

### L-002: Parallel subagents race git staging (2026-07-09)

**Context:** Multiple agents committing concurrently on the same branch.  
**Problem:** Accidental inclusion of unrelated WIP in commits; Soft-resets needed.  
**Solution:** Each agent stages only its file list; orchestrator serializes commits when paths overlap.  
**Prevents:** Contaminated atomic commits during parallel Execute.

---

## Quick Tasks Completed

| # | Description | Date | Commit | Status |
| --- | ---------- | ---- | ------ | ------ |
| — | — | — | — | — |

---

## Deferred Ideas

- [ ] App-wide UI i18n (`appLocale` or similar) — Captured during: interview-locale
- [ ] DB table for editable language prompt instructions — Captured during: interview-locale
- [ ] Analytics dashboard for EN vs PT session counts — Captured during: interview-locale
- [ ] Resume reprocessing endpoint (re-queue failed/processing jobs)
- [ ] Webhook or push notification when resume processing completes
- [ ] Export interview transcript as PDF

---

## Todos

- [x] Design phase for interview-locale (`design.md`)
- [x] Tasks breakdown for interview-locale (`tasks.md`)
- [x] Execute interview-locale (T1–T18)
- [x] Feature-level validation (2026-07-09)
- [x] Fix collateral E2E: rate-limit-redis + token-usage send `interviewLocale`
- [x] Align spec.md acceptance text 400 → 422 (design already documents)
- [x] Delete leftover `.tmp-wip-*` prompt scratch folders

---

## Open Questions (resolved)

| ID | Question | Status |
|----|----------|--------|
| OQ-01 | Default interview language (PT-BR vs EN)? | **Resolved** — user preference `interviewLocale`; browser bootstrap; non-EN/PT → `en` |
| OQ-02 | Review item similarity threshold for deduplication | Open — propose 0.85 cosine in Design (unrelated feature) |
| OQ-03 | Client payload for `POST .../stream` (message text field name) | Open historically; current API uses `{ content }` / `{ answer }` |

---

## Preferences

- Grill-me used for disambiguation before Specify on interview-locale
