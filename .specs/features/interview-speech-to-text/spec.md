# Interview Speech-to-Text — Specification

## Problem Statement

Candidates answering mock interviews (Practice) and focused review sessions must type every response. Speaking is faster and closer to a real interview, but the product has no microphone capture or transcription path. We need browser recording plus server-side speech-to-text (AssemblyAI, async/batch — no streaming) that fills the existing answer draft so users can edit and send as today.

## Goals

- [ ] User can record up to 1 minute of audio from the mic on **Practice** and **Review session** composers and get transcribed text into the answer draft
- [ ] Transcription runs on the backend via an isolated speech-to-text port; AssemblyAI is one adapter and can be swapped without changing route/service contracts
- [ ] Language is auto-detected (`pt` | `en`); API returns detected language metadata for future use; no language selector for STT
- [ ] Failures (permission, short audio, upload, transcription, timeout, rate limit) surface clear, locale-aware messages without breaking the chat send path after recovery

## Out of Scope

| Item | Reason |
| ---- | ------ |
| Streaming / real-time partial transcripts | Brief requires async/batch only |
| Auto-send of transcribed answer | User must edit draft and press Send (grill) |
| Mic on Study hub (`/study`) list UI | No answer composer there; only review-session + practice |
| Separate transcript panel / dedicated Copy button | Draft fill + success feedback only |
| Forcing language from frontend | Detection-only on AssemblyAI |
| Persisting audio blobs or transcripts as first-class entities | Ephemeral upload → text into draft |
| App-wide i18n framework | Local EN/PT string map keyed by `interviewLocale` for this feature’s copy only |
| Changing interview/review stream contracts (`content` / `answer`) | STT only fills draft before existing Send |
| Webhook-based AssemblyAI completion | Sync poll inside request for ≤1 min audio |

---

## User Stories

### P1: Record and confirm transcription into draft ⭐ MVP

**User Story**: As a candidate in Practice or a Review session, I want to record my spoken answer (up to 1 minute), confirm transcription, and see the text in the draft so I can edit and send it like a typed answer.

**Why P1**: Core value; vertical slice across FE capture + BE transcribe + draft integration.

**Acceptance Criteria**:

1. WHEN the user is on Practice (`/practice`) or Review session (`/review-session/:id`) with an active composer THEN the system SHALL show a microphone control on the shared interview composer
2. WHEN the user activates record THEN the system SHALL request microphone permission via the browser and start `MediaRecorder` capture (prefer `audio/webm` / opus when supported)
3. WHEN recording is active THEN the system SHALL show a clear recording state (e.g. pulsing control) and a timer from `0:00` up to `1:00`
4. WHEN the user stops recording OR the timer reaches `1:00` THEN the system SHALL stop capture, retain the audio blob locally, and SHALL NOT upload until the user confirms
5. WHEN recording has stopped with a retained blob THEN the mic control SHALL present a **Transcribe** action; the user SHALL be able to discard via long-press or an explicit discard control (“X”)
6. WHEN the user confirms **Transcribe** THEN the system SHALL upload the audio as `multipart/form-data` field `audio` to `POST /api/transcribe` with the user’s Bearer token
7. WHEN transcription succeeds THEN the system SHALL append the returned `text` to the existing draft (concatenate with a separating space if the draft is non-empty) and SHALL show a short success feedback that transcription completed
8. WHEN transcription succeeds THEN the response payload SHALL include `text`, `language_code`, and `language_confidence` (frontend MAY ignore language fields in v1 beyond optional logging)
9. WHEN recording or transcription is in progress THEN the system SHALL disable typing in the draft input and disable Send until that phase ends (success, error, cancel, or discard)
10. WHEN the user cancels during “Transcribing…” THEN the system SHALL abort the in-flight request and return the composer to an idle usable state without applying partial text
11. WHEN recorded audio is empty or shorter than ~0.5s THEN the system SHALL NOT call the API and SHALL show a friendly “recording too short” message
12. WHEN microphone permission is denied THEN the system SHALL show a friendly message and SHALL NOT start recording

**Independent Test**: On Practice and Review session, record ~10s → Transcribe → draft gains text → edit → Send still uses existing stream APIs. Auto-stop at 1:00 leaves blob pending confirm. Deny mic → message, no hang.

---

### P1: Backend transcribe API with polling ⭐ MVP

**User Story**: As the platform, I want a authenticated `POST /api/transcribe` that accepts audio, runs speech-to-text asynchronously on the provider side (upload + job + poll), and returns transcript text plus detected language, so the frontend never holds provider secrets.

**Why P1**: Security and the required AssemblyAI batch flow.

**Acceptance Criteria**:

1. WHEN an authenticated user `POST`s multipart audio to `/api/transcribe` THEN the system SHALL accept field `audio`, enforce a max upload size of **5 MB**, and reject oversized/invalid payloads with a clear error
2. WHEN `ASSEMBLYAI_API_KEY` is missing or invalid at runtime for a real transcription THEN the system SHALL fail closed with a clear server/config error (not a silent empty transcript)
3. WHEN audio is accepted THEN the system SHALL upload it to the speech-to-text provider, create a transcription job with automatic language detection constrained to expected languages **`pt`** and **`en`**, poll status about every **1.5s**, and return when status is `completed` or `error`
4. WHEN polling exceeds **60s** without completion THEN the system SHALL abort waiting and return a timeout error useful to the client
5. WHEN transcription completes successfully THEN the system SHALL respond **200** with JSON `{ "text": string, "language_code": string, "language_confidence": number }` (confidence type as returned/normalized by the adapter)
6. WHEN upload, provider job, or transcription fails THEN the system SHALL return an appropriate HTTP status and `{ "message": string }` without leaking the API key or raw provider stack traces to the client
7. WHEN temporary audio is written to disk THEN the system SHALL delete/cleanup that file after processing (success or failure); memory storage is preferred when aligned with existing upload patterns
8. WHEN the route is called THEN it SHALL require the same Bearer auth as other interview APIs and SHALL apply `makeAiRateLimiter` keyed by `userId`
9. WHEN the client does not send a language field THEN the system SHALL still transcribe using provider language detection only

**Independent Test**: Authenticated curl/Postman with a short webm → 200 + text + language fields. Unauthenticated → 401. Oversize → 413/400 with message. Missing key in test double → controlled error. Rate limit excess → 429.

---

### P1: Isolatable speech-to-text port (swap provider) ⭐ MVP

**User Story**: As a developer, I want AssemblyAI behind a port/adapter like other external services so I can replace the provider later without rewriting the HTTP route or application service.

**Why P1**: Explicit product constraint; matches R2 / mailer / review-generator isolation.

**Acceptance Criteria**:

1. WHEN application code transcribes audio THEN it SHALL depend only on a module **protocol/port** (e.g. `ISpeechToText` / equivalent) — not on AssemblyAI SDK types or URLs
2. WHEN AssemblyAI is the active provider THEN an **adapter** under infrastructure (or shared adapters) SHALL implement that port (upload + create transcript + poll + map result/errors)
3. WHEN wiring the feature THEN a **factory** in the composition root SHALL inject the adapter into the service used by the route
4. WHEN swapping providers later THEN replacing the adapter + factory binding SHALL be sufficient; route handlers and FE contracts (`/api/transcribe` response shape) SHALL remain stable
5. WHEN env is configured THEN `ASSEMBLYAI_API_KEY` SHALL be registered in the backend env schema (Zod) and read only inside the AssemblyAI adapter (or its factory), never sent to the frontend

**Independent Test**: Unit-test the service with a fake `ISpeechToText`; route still returns mapped DTO. Grep application/service layer for `assemblyai` / AssemblyAI URLs → no matches outside adapter + factory.

---

### P2: Locale-aware STT UI copy

**User Story**: As a candidate using EN or PT interview locale, I want mic/transcription messages in that language so feedback matches the session language preference.

**Why P2**: Grill decision; keeps UX coherent without waiting for full app i18n.

**Acceptance Criteria**:

1. WHEN the UI shows STT strings (record/stop/transcribe/discard, recording too short, permission denied, transcribing, success, network/transcription errors) THEN copy SHALL come from a small EN/PT map keyed by the current `interviewLocale`
2. WHEN `interviewLocale` is `pt` THEN user-visible STT messages SHALL be Portuguese; WHEN `en` THEN English
3. WHEN full app i18n does not exist yet THEN this feature SHALL NOT introduce a global i18n framework — only local maps for STT chrome

**Independent Test**: Switch locale on Practice/Study preference → STT messages follow `en`/`pt` without affecting LLM stream contracts.

---

## Edge Cases

- WHEN MediaRecorder mimeType `audio/webm` is unsupported THEN the system SHALL fall back to a browser-supported audio mimeType accepted by the provider, or show a clear unsupported-browser message
- WHEN the user navigates away mid-recording THEN the system SHALL stop tracks and release the mic; in-flight upload SHALL be aborted on unmount when possible
- WHEN the user navigates away mid-transcribe THEN the system SHALL abort the fetch and not apply text after unmount
- WHEN draft append would exceed existing answer limits (Practice content max / Review answer max) THEN the system SHALL still append in the UI but existing Send validation SHALL reject oversized content as today (no silent truncate unless Design chooses otherwise — default: no truncate)
- WHEN provider returns empty `text` with completed status THEN the system SHALL treat it as a soft failure with a friendly message (do not pretend success)
- WHEN rate limit returns 429 THEN the UI SHALL show a friendly retry-later message
- WHEN multiple rapid Transcribe confirms happen THEN the UI SHALL ignore duplicate submits while one request is in flight

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| STT-01 | P1: Record → confirm → draft | Tasks | In Tasks |
| STT-02 | P1: Timer + auto-stop at 1:00 without auto-upload | Tasks | In Tasks |
| STT-03 | P1: Transcribe / discard after stop | Tasks | In Tasks |
| STT-04 | P1: Append transcript to draft + success feedback | Tasks | In Tasks |
| STT-05 | P1: Block input/Send while recording or transcribing | Tasks | In Tasks |
| STT-06 | P1: Cancel/abort during transcribing | Tasks | In Tasks |
| STT-07 | P1: Short/empty audio guard (no API call) | Tasks | In Tasks |
| STT-08 | P1: Mic permission denied handling | Tasks | In Tasks |
| STT-09 | P1: `POST /api/transcribe` multipart + auth + AI rate limit | Tasks | In Tasks |
| STT-10 | P1: Provider upload + job + poll (1.5s) + 60s timeout | Tasks | In Tasks |
| STT-11 | P1: Language detection pt/en; return text + language fields | Tasks | In Tasks |
| STT-12 | P1: Clear errors; cleanup temp audio | Tasks | In Tasks |
| STT-13 | P1: Speech-to-text port + AssemblyAI adapter + factory | Tasks | In Tasks |
| STT-14 | P1: `ASSEMBLYAI_API_KEY` in env schema; never on FE | Tasks | In Tasks |
| STT-15 | P2: EN/PT STT UI copy via `interviewLocale` | Tasks | In Tasks |
| STT-DEC-01 | Sync HTTP wait (no job-id polling on FE); ≤1 min audio | — | Locked |
| STT-DEC-02 | Surfaces: Practice + Review session only | — | Locked |
| STT-DEC-03 | Detection-only language (no FE language field) | — | Locked |
| STT-DEC-04 | Max upload ~5 MB; fetch timeout ~65s | — | Locked |

**ID format:** `STT-[NUMBER]` / `STT-DEC-[NUMBER]`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 15 requirements + 4 locked decisions; mapped to T1–T10 in `tasks.md`

---

## Success Criteria

- [ ] Candidate can complete “speak → confirm → edit draft → send” on both Practice and Review session without typing the answer from scratch
- [ ] Backend never exposes `ASSEMBLYAI_API_KEY` to the client
- [ ] Application service tests pass with a fake speech-to-text port (no live AssemblyAI required)
- [ ] Swapping the STT provider requires a new adapter + factory binding only
- [ ] Local setup documented: set `ASSEMBLYAI_API_KEY` and exercise the full mic flow
