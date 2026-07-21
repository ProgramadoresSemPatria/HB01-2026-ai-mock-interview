# Interview Speech-to-Text — Tasks

**Design**: `.specs/features/interview-speech-to-text/design.md`  
**Spec**: `.specs/features/interview-speech-to-text/spec.md`  
**Context**: `.specs/features/interview-speech-to-text/context.md`  
**Status**: Execute complete (T1–T10); E2E runtime pending Docker; commits deferred

**Test refs**: `backend/docs/TESTING.md`, `frontend/.specs/codebase/TESTING.md`

---

## Execution Plan

### Phase 1: Foundation (Parallel OK)

```
T1 [P] ──┐
         ├──→ Phase 2
T2 [P] ──┘
```

### Phase 2: Backend core + FE building blocks (Parallel OK)

```
        ┌→ T3 [P] ─┐
T1,T2 ──┤          │
        └→ T4 [P] ─┼──→ Phase 3
                   │
(no BE deps) ──────┼→ T6 [P]
                   ├→ T7 [P]
                   └→ T8 [P]
```

### Phase 3: HTTP API + Mic UI (Parallel OK across BE/FE)

```
T1,T3,T4 ──→ T5          ┐
                         ├──→ Phase 4
T6,T7,T8 ──→ T9 [P]      ┘
```

### Phase 4: Wire chat parents (Sequential)

```
T9 → T10
```

---

## Task Breakdown

### T1: Env schema + `GatewayTimeoutError` + test env stubs [P]

**What**: Add `ASSEMBLYAI_API_KEY` and `TRANSCRIBE_MAX_BYTES` to server env schema / `.env.example`; add `GatewayTimeoutError` (504); stub the new env key in Vitest unit/e2e setups and `server-schema.test.ts`.
**Where**: `backend/src/config/env/server-schema.ts`, `backend/src/config/env/server-schema.test.ts`, `backend/.env.example`, `backend/src/shared/errors/http-errors.ts`, `backend/vitest.setup.ts`, `backend/vitest.e2e.setup.ts`
**Depends on**: None
**Reuses**: `OPENAI_API_KEY` / `RESUME_MAX_BYTES` patterns; existing `HttpError` subclasses
**Requirement**: STT-12, STT-14, STT-DEC-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `ASSEMBLYAI_API_KEY: z.string().min(1)` and `TRANSCRIBE_MAX_BYTES` default `5_242_880` in schema
- [x] `.env.example` documents both vars
- [x] `GatewayTimeoutError` extends `HttpError` with status `504`
- [x] Unit + e2e Vitest env stubs include dummy `ASSEMBLYAI_API_KEY` so boot does not fail
- [x] Gate check passes: `cd backend && bun run check-types && bun run test -- src/config/env/server-schema.test.ts`

**Tests**: unit (existing schema test updated)
**Gate**: quick

**Verify**:
`cd backend && bun run test -- src/config/env/server-schema.test.ts`

**Commit**: `feat(transcribe): add AssemblyAI env and GatewayTimeoutError`

---

### T2: `ISpeechToText` protocol [P]

**What**: Create port + DTOs `SpeechToTextInput`, `SpeechToTextResult`, `ISpeechToText` with single `transcribe()` method per design.
**Where**: `backend/src/modules/transcribe/protocols/speech-to-text.ts`
**Depends on**: None
**Reuses**: `modules/resumes/protocols/object-storage.ts` style
**Requirement**: STT-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Types and interface match design (camelCase domain result)
- [x] Exported for service/adapter use
- [x] Gate check passes: `cd backend && bun run check-types`

**Tests**: none (protocol / types only — matrix N/A for pure type files)
**Gate**: build

**Verify**:
`cd backend && bun run check-types`

**Commit**: `feat(transcribe): add ISpeechToText port`

---

### T3: AssemblyAI adapter + unit tests [P]

**What**: Implement `AssemblyAiSpeechToTextAdapter` (upload → create transcript with `language_detection` + `expected_languages: ["pt","en"]` → poll 1.5s / timeout 60s); map errors to `BadGatewayError` / `GatewayTimeoutError`; unit-test with mocked `fetch`.
**Where**: `backend/src/infrastructure/speech-to-text/assemblyai-speech-to-text-adapter.ts`, `assemblyai-speech-to-text-adapter.test.ts`, constants for poll/timeout as needed
**Depends on**: T1, T2
**Reuses**: Infrastructure adapter folder pattern; design REST/SDK choice (adapter-only)
**Requirement**: STT-10, STT-11, STT-12, STT-13, STT-14

**Tools**:

- MCP: `user-context7` (AssemblyAI API if needed during implement)
- Skill: `context7-mcp` (optional)

**Done when**:

- [x] Adapter implements `ISpeechToText`; no AssemblyAI imports outside this file (+ factory later)
- [x] Uses `env.ASSEMBLYAI_API_KEY`; poll ~1500ms; timeout 60s → `GatewayTimeoutError`
- [x] Provider `error` / HTTP failures → `BadGatewayError` without leaking API key/stack
- [x] Maps `text`, `language_code`, `language_confidence` → domain result
- [x] Unit tests: completed success, provider error status, poll timeout (≥3 cases)
- [x] Gate check passes: `cd backend && bun run lint && bun run check-types && bun run test -- src/infrastructure/speech-to-text/assemblyai-speech-to-text-adapter.test.ts`
- [x] Test count: ≥3 new unit tests

**Tests**: unit
**Gate**: quick

**Verify**:
`cd backend && bun run test -- src/infrastructure/speech-to-text/assemblyai-speech-to-text-adapter.test.ts`

**Commit**: `feat(transcribe): add AssemblyAI speech-to-text adapter`

---

### T4: `TranscribeService` + unit tests [P]

**What**: Implement service validation (missing file, allowed mime types) + delegate to `ISpeechToText`; empty trimmed text → `BadGatewayError`.
**Where**: `backend/src/modules/transcribe/service/transcribe-service.ts`, `transcribe-service.test.ts`
**Depends on**: T2
**Reuses**: `resume-service.test.ts` fake-port pattern
**Requirement**: STT-09, STT-11, STT-12, STT-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Missing file → `BadRequestError`
- [x] Rejects disallowed mime types with `BadRequestError`
- [x] Success returns port result; empty text → `BadGatewayError`
- [x] Unit tests with `vi.fn()` fake `ISpeechToText` (≥4 cases: success, missing, bad mime, empty text)
- [x] Gate check passes: `cd backend && bun run lint && bun run check-types && bun run test -- src/modules/transcribe/service/transcribe-service.test.ts`
- [x] Test count: ≥4 new unit tests

**Tests**: unit
**Gate**: quick

**Verify**:
`cd backend && bun run test -- src/modules/transcribe/service/transcribe-service.test.ts`

**Commit**: `feat(transcribe): add TranscribeService`

---

### T5: Upload middleware + factories + route + E2E (stubbed STT)

**What**: Wire `POST /api/transcribe/` with multer memory (`audio`), AI rate limiter, controller DTO mapping (snake_case response), factories; E2E with `vi.mock` of speech-to-text factory (no live AssemblyAI). Cover auth 401, success 200, missing file 400, oversize 400; optionally one 429 AI limit case.
**Where**:  
`backend/src/modules/transcribe/middlewares/audio-upload-middleware.ts`  
`backend/src/modules/transcribe/controllers/transcribe-controller.ts`  
`backend/src/modules/transcribe/routes/transcribe-routes.ts`  
`backend/src/factories/transcribe/*`  
`backend/src/shared/middlewares/error-handler-middleware.ts` (audio-friendly oversize message if needed)  
`backend/src/test/e2e/transcribe.e2e.test.ts`
**Depends on**: T1, T3, T4
**Reuses**: `resumes-routes.ts`, `resumes.e2e.test.ts` FormData + `vi.mock` patterns
**Requirement**: STT-09, STT-10, STT-11, STT-12, STT-13, STT-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Route auto-mounts at `/api/transcribe`; field name `audio`; middleware order rate-limit → multer → controller
- [x] 200 body `{ text, language_code, language_confidence }`
- [x] Factories: `createAssemblyAiSpeechToText` / `makeTranscribeService` / `makeTranscribeController`
- [x] E2E mocks STT port/factory; small fixture buffer; no real AssemblyAI calls
- [x] Cases: 401 unauthenticated, 200 success, 400 no file, 400 oversize
- [ ] Gate check passes: `cd backend && bun run lint && bun run check-types && bun run test && bun run test:e2e -- src/test/e2e/transcribe.e2e.test.ts` — unit/lint/types green; **E2E blocked: Docker Desktop not running**
- [x] Test count: ≥4 new e2e cases written; unit suite still green (no silent deletions)

**Tests**: e2e (HTTP route layer; controller covered by e2e per TESTING.md)
**Gate**: full

**Verify**:
`cd backend && bun run test:e2e -- src/test/e2e/transcribe.e2e.test.ts`

**Commit**: `feat(transcribe): expose POST /api/transcribe with e2e coverage`

---

### T6: STT copy map (EN/PT) [P]

**What**: Add `getSttCopy(locale)` with all mic/transcription strings from design.
**Where**: `frontend/src/features/interview/stt-copy.ts`
**Depends on**: None
**Reuses**: `InterviewLocale` / `"en" | "pt"` from interview-locale feature
**Requirement**: STT-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] EN and PT maps include: record, stop, transcribe, discard, tooShort, permissionDenied, transcribing, success, genericError, rateLimited, unsupported, cancel (and timeout if used)
- [x] Gate check passes: `cd frontend && bun run check-types`

**Tests**: none (FE matrix: features → none)
**Gate**: quick

**Verify**:
`cd frontend && bun run check-types`

**Commit**: `feat(interview): add STT locale copy map`

---

### T7: `useAudioRecorder` hook [P]

**What**: Implement MediaRecorder hook with idle/recording/pendingConfirm, 60s auto-stop, discard, track cleanup, mime fallback, MIN_MS awareness helpers.
**Where**: `frontend/src/features/interview/use-audio-recorder.ts`
**Depends on**: None
**Reuses**: None (new); keep browser APIs out of presentational components
**Requirement**: STT-01, STT-02, STT-03, STT-07, STT-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] States and API match design (`start`/`stop`/`discard`, `blob`, `elapsedMs`, errors)
- [x] Max 60_000 ms auto-stop → `pendingConfirm` (no auto-upload)
- [x] Releases media tracks on stop/discard/unmount
- [x] Gate check passes: `cd frontend && bun run lint && bun run check-types`

**Tests**: none (FE matrix)
**Gate**: quick

**Verify**:
`cd frontend && bun run lint && bun run check-types`

**Commit**: `feat(interview): add useAudioRecorder hook`

---

### T8: `transcribeAudio` API client [P]

**What**: FormData upload to `/api/transcribe/` with Bearer token, AbortSignal, ~65s timeout, `ApiError` mapping (mirror resumes).
**Where**: `frontend/src/lib/api/transcribe.ts`
**Depends on**: None
**Reuses**: `frontend/src/lib/api/resumes.ts` multipart pattern
**Requirement**: STT-06, STT-09, STT-DEC-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Appends field `audio`; does not set JSON Content-Type
- [x] Returns `{ text, language_code, language_confidence }`
- [x] Supports `signal` for cancel; client timeout ~65s
- [x] Gate check passes: `cd frontend && bun run check-types`

**Tests**: none (FE matrix: `lib/api` → none)
**Gate**: quick

**Verify**:
`cd frontend && bun run check-types`

**Commit**: `feat(interview): add transcribeAudio client`

---

### T9: `InterviewMicControl` + extend `InterviewChatInput` [P]

**What**: Build mic UI (timer, pulse, Transcribe + X, Cancel while uploading) and integrate into `InterviewChatInput` with locale copy, blocking input/Send, toasts, abort, short-audio guard.
**Where**: `frontend/src/features/interview/interview-mic-control.tsx`, `frontend/src/features/interview/interview-chat-input.tsx`
**Depends on**: T6, T7, T8
**Reuses**: sonner toasts; existing composer styles
**Requirement**: STT-01, STT-02, STT-03, STT-04, STT-05, STT-06, STT-07, STT-08, STT-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Props include `locale`, token/access for upload (or callback), `onTranscript(text)`, disabled when streaming/STT busy
- [x] Append semantics left to parent via `onTranscript` (no auto-send)
- [x] Discard via visible X; Cancel aborts fetch during transcribing
- [x] Success/error toasts from `getSttCopy`
- [x] Gate check passes: `cd frontend && bun run lint && bun run check-types`

**Tests**: none (FE matrix)
**Gate**: quick

**Verify**:
`cd frontend && bun run lint && bun run check-types`

**Commit**: `feat(interview): add mic control to chat input`

---

### T10: Wire Practice + Review session parents

**What**: Pass locale, auth token, STT blockers, and draft-append handler into `InterviewChatInput` from `interview-chat.tsx` and `review-session-chat.tsx`.
**Where**: `frontend/src/features/interview/interview-chat.tsx`, `frontend/src/features/study/review-session-chat.tsx`
**Depends on**: T9
**Reuses**: `useInterviewLocale`, `useAuth` / `getAccessToken`
**Requirement**: STT-01, STT-04, STT-05, STT-DEC-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Both parents append transcript: `prev.trim() ? \`${prev.trim()} ${text}\` : text`
- [x] Input/Send disabled while recording, pendingConfirm, or transcribing (in addition to streaming)
- [x] Study hub unchanged (no mic)
- [x] Gate check passes: `cd frontend && bun run lint && bun run check-types && bun run build`

**Tests**: none (FE matrix: pages/features → none; manual UAT)
**Gate**: build

**Verify**:
`cd frontend && bun run build`  
Manual: Practice + Review session — record → Transcribe → draft append → Send.

**Commit**: `feat(interview): enable speech-to-text on practice and review session`

---

## Parallel Execution Map

```
Phase 1 (Parallel):
  ├── T1 [P]
  └── T2 [P]

Phase 2 (Parallel):
  ├── T3 [P]  (needs T1, T2)
  ├── T4 [P]  (needs T2)
  ├── T6 [P]
  ├── T7 [P]
  └── T8 [P]

Phase 3 (Parallel across stacks):
  ├── T5       (needs T1, T3, T4) — e2e; do not parallel with other e2e suites
  └── T9 [P]   (needs T6, T7, T8)

Phase 4 (Sequential):
  T9 → T10
```

**Parallelism notes**:

- Unit tasks (T3, T4) are parallel-safe per backend unit suite.
- T5 is the only new e2e suite — run alone vs other e2e files in the same agent turn if sharing Docker/Testcontainers.
- FE has no automated tests; `[P]` limited by file ownership only (T6/T7/T8 touch different files).

---

## Validation Gates (pre-approval)

### Check 1: Task Granularity

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | Env + one error class + test stubs | ✅ Cohesive foundation |
| T2 | One protocol file | ✅ Granular |
| T3 | One adapter + its unit tests | ✅ Granular |
| T4 | One service + its unit tests | ✅ Granular |
| T5 | Route wiring + e2e (merge controller/middleware — e2e is the gate) | ✅ OK (cohesive HTTP slice) |
| T6 | One copy module | ✅ Granular |
| T7 | One hook | ✅ Granular |
| T8 | One API client | ✅ Granular |
| T9 | Mic control + composer props (same UX surface) | ✅ OK cohesive |
| T10 | Two parent wirings (same feature slice) | ✅ OK cohesive |

### Check 2: Diagram ↔ Depends On

| Task | Depends On (body) | Diagram shows | Status |
| ---- | ----------------- | ------------- | ------ |
| T1 | None | Phase 1 root | ✅ |
| T2 | None | Phase 1 root | ✅ |
| T3 | T1, T2 | From Phase 1 → T3 | ✅ |
| T4 | T2 | From T2 → T4 | ✅ |
| T5 | T1, T3, T4 | Phase 2 → T5 | ✅ |
| T6 | None | Phase 2 root | ✅ |
| T7 | None | Phase 2 root | ✅ |
| T8 | None | Phase 2 root | ✅ |
| T9 | T6, T7, T8 | → T9 | ✅ |
| T10 | T9 | T9 → T10 | ✅ |

### Check 3: Test Co-location

| Task | Code layer | Matrix requires | Task says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1 | env schema (+ error class) | unit for schema test update | unit | ✅ |
| T2 | protocol types | none | none | ✅ |
| T3 | pure infra adapter | unit | unit | ✅ |
| T4 | service | unit | unit | ✅ |
| T5 | HTTP routes (+ thin controller/middleware/factories) | e2e for routes; controller none | e2e | ✅ |
| T6–T10 | FE features / lib / pages | none | none | ✅ |

---

## Requirement Traceability (Tasks)

| Requirement | Tasks |
| ----------- | ----- |
| STT-01 | T7, T9, T10 |
| STT-02 | T7, T9 |
| STT-03 | T7, T9 |
| STT-04 | T9, T10 |
| STT-05 | T9, T10 |
| STT-06 | T8, T9 |
| STT-07 | T7, T9 |
| STT-08 | T7, T9 |
| STT-09 | T4, T5, T8 |
| STT-10 | T3, T5 |
| STT-11 | T3, T4, T5 |
| STT-12 | T1, T3, T4, T5 |
| STT-13 | T2, T3, T4, T5 |
| STT-14 | T1, T3, T5 |
| STT-15 | T6, T9 |
| STT-DEC-01…04 | T1, T5, T8, T10 |

**Coverage:** 15 requirements mapped; 0 unmapped ⚠️

---

## Manual UAT (after T10)

- [ ] Practice: grant mic → record → stop → Transcribe → draft append → Send
- [ ] Review session: same flow
- [ ] Auto-stop at 1:00 leaves pending confirm (no auto-upload)
- [ ] Discard (X); short recording toast; deny mic toast
- [ ] Cancel during Transcribing… (no draft change)
- [ ] `ASSEMBLYAI_API_KEY` set locally for live provider smoke (optional outside CI)
