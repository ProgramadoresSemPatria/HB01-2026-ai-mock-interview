# Expansão de Cenários de Teste — Tasks

**Design**: `.specs/features/test-scenario-coverage/design.md`
**Spec**: `.specs/features/test-scenario-coverage/spec.md`
**Status**: Complete

---

## Gate Check Commands

| Gate | Command | Requires Docker | When |
|------|---------|-----------------|------|
| **quick** | `bun run test` | No | Após cada task unit |
| **integration** | `bun run test:integration` | Yes | Após T7–T8 |
| **e2e** | `bun run test:e2e` | Yes | Após cada bloco E2E ou T12 |
| **full** | `bun run test:all` | Yes | Validação final T13 |

---

## Execution Plan

### Phase 1: Unit (parallel)

```
┌→ T1 [P] ─┐
├→ T2 [P] ─┼──→ (quick gate)
└→ T3 [P] ─┘
```

### Phase 2: Integration (sequential)

```
T4 ──→ T5 ──→ (integration gate)
```

### Phase 3: E2E helpers + P1 (sequential per file)

```
T6 ──→ T7 ──→ T8 ──→ T9 ──→ (e2e gate parcial)
```

### Phase 4: E2E P2 (sequential per file)

```
T10 ──→ T11 ──→ (e2e gate)
```

### Phase 5: Docs + full validation

```
T12 ──→ T13
```

---

## Task Breakdown

### T1: Unit tests for validation-middleware

**What**: Create `validation-middleware.test.ts` with valid/invalid body cases.
**Where**: `src/shared/middlewares/validation-middleware.test.ts`
**Depends on**: None
**Reuses**: Pattern from `error-handler-middleware.test.ts`
**Requirements**: COV-U-01

**Done when**:

- [ ] 2+ `it` cases: success calls `next`, failure returns 422 with `errors`
- [ ] `bun run test -- src/shared/middlewares/validation-middleware.test.ts` passes

**Tests**: unit (this task)
**Gate**: quick

**Commit**: `test(unit): add validation-middleware tests`

---

### T2: Unit tests for review-items-generator-prompt

**What**: Create colocated prompt tests (empty existing items, serialized items, headers).
**Where**: `src/modules/interview/prompts/review-items-generator-prompt.test.ts`
**Depends on**: None
**Reuses**: `interviewer-system-prompt.test.ts`
**Requirements**: COV-U-02

**Done when**:

- [ ] `(none)` branch covered
- [ ] Non-empty `existingItems` covered
- [ ] quick gate on file passes

**Tests**: unit
**Gate**: quick

**Commit**: `test(unit): add review-items-generator-prompt tests`

---

### T3: Unit tests for closing-feedback-prompt

**What**: Create colocated tests for `entry`/`mid`/`senior` levels and guardrails.
**Where**: `src/modules/interview/prompts/closing-feedback-prompt.test.ts`
**Depends on**: None
**Reuses**: `interviewer-system-prompt.test.ts`
**Requirements**: COV-U-03

**Done when**:

- [ ] `it.each` for three levels
- [ ] Guardrails section present in output
- [ ] quick gate passes

**Tests**: unit
**Gate**: quick

**Commit**: `test(unit): add closing-feedback-prompt tests`

---

### T4: Integration tests for SessionRepository updates

**What**: Add `incrementTurnCount` and `markFinished` integration cases.
**Where**: `src/modules/interview/repository/session-repository.integration.test.ts`
**Depends on**: None
**Reuses**: Existing `seedUserAndResume`
**Requirements**: COV-I-01, COV-I-02

**Done when**:

- [ ] Turn count increments from 0 → 1
- [ ] `isFinished` becomes true after `markFinished`
- [ ] `bun run test:integration -- session-repository.integration` passes

**Tests**: integration
**Gate**: integration

**Commit**: `test(integration): cover session repository turn and finish updates`

---

### T5: Integration tests for ReviewRepository lookups

**What**: Add case-insensitive and similarity search tests against real PG.
**Where**: `src/modules/interview/repository/review-repository.integration.test.ts`
**Depends on**: None
**Reuses**: Existing seed via prisma
**Requirements**: COV-I-03, COV-I-04

**Done when**:

- [ ] Case-insensitive find returns same row
- [ ] Similar topics return match (document threshold in comment)
- [ ] integration gate passes

**Tests**: integration
**Gate**: integration

**Commit**: `test(integration): cover review repository topic lookups`

---

### T6: E2E seed helpers for resume statuses

**What**: Add `seedProcessingResume` and `seedFailedResume` (or equivalent) to reduce duplication in interview E2E.
**Where**: `src/test/helpers/interview-seed-helpers.ts`
**Depends on**: None
**Reuses**: `seedReadyResume` pattern
**Requirements**: COV-E-08, COV-E-09 (enabler)

**Done when**:

- [ ] Helpers exported and used by at least one test in T7
- [ ] No production code changed

**Tests**: none (helper only)
**Gate**: none

**Commit**: `test(e2e): add resume status seed helpers`

---

### T7: E2E P1 — interview business rules

**What**: Add COV-E-07 through COV-E-09, COV-E-15 (+ 401 cases COV-E-10,11,13 as part of P1 auth story).
**Where**: `src/test/e2e/interview.e2e.test.ts`
**Depends on**: T6
**Reuses**: `authenticate`, graph mock, `truncateTables`
**Requirements**: COV-E-07, COV-E-08, COV-E-09, COV-E-10, COV-E-11, COV-E-13, COV-E-15

**Done when**:

- [ ] 7 new `it` blocks per spec table
- [ ] `bun run test:e2e -- interview.e2e.test.ts` passes

**Tests**: e2e
**Gate**: e2e (single file)

**Commit**: `test(e2e): cover interview session and stream error paths`

---

### T8: E2E P1 — resumes upload validation

**What**: Add COV-E-17, COV-E-18, COV-E-19, COV-E-22.
**Where**: `src/test/e2e/resumes.e2e.test.ts`
**Depends on**: None
**Reuses**: `minimalPdfBuffer`, `storageMock`, `authenticate`
**Requirements**: COV-E-17, COV-E-18, COV-E-19, COV-E-22

**Done when**:

- [ ] 4 new tests pass
- [ ] File-level e2e green

**Tests**: e2e
**Gate**: e2e (single file)

**Commit**: `test(e2e): cover resume upload validation and GET auth`

---

### T9: E2E P1 — auth bearer edge cases

**What**: Add COV-E-05, COV-E-06 on protected route.
**Where**: `src/test/e2e/auth.e2e.test.ts`
**Depends on**: None
**Reuses**: Existing protected-smoke pattern
**Requirements**: COV-E-05, COV-E-06

**Done when**:

- [ ] Malformed and invalid JWT tested
- [ ] auth e2e file passes

**Tests**: e2e
**Gate**: e2e (single file)

**Commit**: `test(e2e): cover bearer token validation errors`

---

### T10: E2E P2 — interview + resumes resilience

**What**: Add COV-E-12, COV-E-14, COV-E-16, COV-E-20, COV-E-21.
**Where**: `interview.e2e.test.ts`, `resumes.e2e.test.ts`
**Depends on**: T7, T8
**Reuses**: Mocks for storage/queue failure
**Requirements**: COV-E-12, COV-E-14, COV-E-16, COV-E-20, COV-E-21

**Done when**:

- [ ] 5 new tests pass
- [ ] Optional DB assert resume `failed` after 502/503

**Tests**: e2e
**Gate**: e2e

**Commit**: `test(e2e): cover interview stream validation and resume infrastructure errors`

---

### T11: E2E P2 — auth 422, refresh, review-items

**What**: Add COV-E-01–04, COV-E-02, COV-E-23, COV-E-24.
**Where**: `auth.e2e.test.ts`, `review-items.e2e.test.ts`
**Depends on**: T9
**Reuses**: `createSignupPayload`, two-user pattern from interview 404
**Requirements**: COV-E-01, COV-E-02, COV-E-03, COV-E-04, COV-E-23, COV-E-24

**Done when**:

- [ ] 6 new tests across 2 files
- [ ] Full e2e suite passes

**Tests**: e2e
**Gate**: e2e

**Commit**: `test(e2e): cover auth validation and review-items list edge cases`

---

### T12: Integration P3 null/empty cases (optional)

**What**: Add empty-list / not-found cases to existing integration files.
**Where**: `user-repository`, `resume-repository`, `message-repository` integration tests
**Depends on**: T4, T5
**Reuses**: `resetDatabase`
**Requirements**: COV-I-05

**Done when**:

- [ ] At least 3 new edge `it` cases
- [ ] integration gate passes

**Tests**: integration
**Gate**: integration

**Commit**: `test(integration): add null and empty list repository cases`

---

### T13: Full validation and TESTING.md update

**What**: Run all gates; add “Scenario coverage” subsection to `docs/TESTING.md` linking to this spec.
**Where**: `docs/TESTING.md`
**Depends on**: T1–T11 (T12 optional)
**Reuses**: Gate commands from design
**Requirements**: All COV-* success criteria

**Done when**:

- [ ] `bun run test:all` passes
- [ ] Traceability table in spec.md updated to Verified for implemented IDs
- [ ] TESTING.md lists new scenario groups

**Tests**: full suite
**Gate**: full

**Commit**: `docs(test): document expanded scenario coverage`

---

## Pre-Approval Validation

### Check 1: Task Granularity

| Task | Atomic? | Verdict |
|------|---------|---------|
| T1–T3 | One file / one concern | ✅ |
| T4–T5 | One repository file each | ✅ |
| T6 | Helpers only | ✅ |
| T7–T11 | One E2E file or logical pair | ✅ |
| T12 | Optional batch | ✅ |
| T13 | Docs + validation | ✅ |

### Check 2: Diagram ↔ Depends On

| Task | Depends on (declared) | Diagram phase | Match |
|------|----------------------|---------------|-------|
| T1–T3 | None | Phase 1 parallel | ✅ |
| T4 | None | Phase 2 | ✅ |
| T5 | None | Phase 2 after T4 | ✅ (sequential in phase) |
| T6 | None | Phase 3 start | ✅ |
| T7 | T6 | After T6 | ✅ |
| T8 | None | Phase 3 | ✅ |
| T9 | None | Phase 3 | ✅ |
| T10 | T7, T8 | Phase 4 | ✅ |
| T11 | T9 | Phase 4 | ✅ |
| T12 | T4, T5 | Optional after integration | ✅ |
| T13 | T1–T11 | Phase 5 | ✅ |

### Check 3: Test Co-location (TESTING.md)

| Task | Production change | Test type required | Co-located in task |
|------|-------------------|-------------------|-------------------|
| T1–T3 | None (tests only) | Unit | ✅ |
| T4–T5 | None | Integration | ✅ |
| T6 | Test helper | none | ✅ |
| T7–T11 | None | E2E | ✅ |
| T12 | None | Integration | ✅ |
| T13 | Docs | full gate | ✅ |

---

## Requirement → Task Mapping

| Requirement | Task |
|-------------|------|
| COV-U-01 | T1 |
| COV-U-02 | T2 |
| COV-U-03 | T3 |
| COV-I-01, COV-I-02 | T4 |
| COV-I-03, COV-I-04 | T5 |
| COV-I-05 | T12 |
| COV-E-07–11, COV-E-13, COV-E-15 | T7 |
| COV-E-17–19, COV-E-22 | T8 |
| COV-E-05, COV-E-06 | T9 |
| COV-E-12, COV-E-14, COV-E-16, COV-E-20, COV-E-21 | T10 |
| COV-E-01–04, COV-E-02, COV-E-23, COV-E-24 | T11 |
| All | T13 |

**Coverage:** 32 requirements → 13 tasks, 0 unmapped ✅
