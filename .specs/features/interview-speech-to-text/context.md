# Interview Speech-to-Text — Context

**Gathered:** 2026-07-21  
**Spec:** `.specs/features/interview-speech-to-text/spec.md`  
**Status:** Tasks drafted — awaiting approval → Execute
**Source:** Grill-me session (decisions locked before Specify)

---

## Feature Boundary

Add **browser mic recording** + **backend batch transcription** so Practice and Review session composers can fill the answer **draft** with speech-to-text. Provider is AssemblyAI (async upload + job + poll), isolated behind a port/adapter. No streaming STT, no auto-send, no Study hub mic, no separate transcript panel.

---

## Implementation Decisions

### Where text lands

- Transcription **appends** to the existing `draft` (space-separated if non-empty)
- User **edits** and presses **Send** as today → Practice `content` / Review `answer` unchanged
- Success = draft update + short “transcription completed” feedback (no Copy panel)

### Surfaces

- **In scope:** `/practice` and `/review-session/:id` via shared composer (`InterviewChatInput` or composition beside it)
- **Out:** `/study` hub (no answer composer)

### Language

- **Detection only** on provider: `language_detection` with expected `pt` / `en`
- No FE language selector / no language field on `POST /api/transcribe`
- Response includes `language_code` + `language_confidence` for future use (logging/UI later)

### Recording UX

- Max duration **1:00** with visible timer `0:00` → `1:00`
- Stop or auto-stop **does not** upload; control becomes **Transcribe**; discard via **long-press or “X”**
- Recording / transcribing: **block** draft typing and Send
- Empty / &lt; ~0.5s: **no API**; friendly message
- Cancel during transcribe: **abort fetch** (allowed)

### API / transport

- `POST /api/transcribe`, multipart field `audio`
- Success `200`: `{ text, language_code, language_confidence }`
- Errors: HTTP status + `{ message }`
- Auth: Bearer; rate limit: **`makeAiRateLimiter`** keyed by `userId`
- Sync wait in API process (poll ~1.5s, timeout 60s); FE fetch ~65s
- Max upload **~5 MB**
- Prefer multer **memory** storage if consistent with résumé upload; else disk + always cleanup

### Provider isolation (non-negotiable)

- Port in module `protocols/` (e.g. `ISpeechToText`)
- AssemblyAI adapter in `infrastructure/` (or `shared/adapters/`)
- Factory wires adapter → service → route
- `ASSEMBLYAI_API_KEY` only in env schema + adapter/factory — never FE
- Route/service must remain provider-agnostic so AssemblyAI can be replaced later

### UI copy locale

- STT chrome strings from a **local EN/PT map** keyed by current `interviewLocale`
- Does **not** introduce app-wide i18n (still deferred)

### Agent's Discretion

- Exact protocol method names (`transcribe(buffer, mimeType)` vs split upload/create/poll on port — prefer **one** high-level `transcribe` on the port; keep multi-step inside the adapter)
- Exact module name (`transcribe` vs nest under `interview`) — follow Backend module mounting conventions (`/api/<module>`)
- Visual styling of pulse/timer/discard (must meet AC semantics)
- Whether `language_confidence` is normalized to 0–1 float in the DTO
- Exact HTTP status mapping for provider errors (keep consistent with existing error middleware)

---

## Specific References

- Shared composer: `frontend/src/features/interview/interview-chat-input.tsx`
- Practice / Review session chats already share draft → stream pattern
- Isolation precedents: `IObjectStorage` → R2; `IMailer` → Nodemailer; `IReviewItemsGenerator` → LangGraph adapter
- Env: `backend/src/config/env/server-schema.ts`
- Rate limit: `makeAiRateLimiter` / `aiRateLimitKeyGenerator` in `backend/src/shared/middlewares/rate-limit-middleware.ts`

---

## Deferred Ideas

- Persist audio or transcripts for analytics/replay
- Use `language_code` to suggest switching `interviewLocale`
- Streaming / partial transcripts
- Auto-send after transcription
- Dedicated Copy button / transcript side panel
- Provider webhooks instead of in-request polling
- App-wide UI i18n framework
