# AI quality business metrics

Minimal definitions for evaluating LLM behavior in production. These metrics answer whether the mock-interview product is behaving as designed before scaling usage.

**Related code:** `src/modules/interview/repository/session-repository.ts` (`MAX_TURNS_BY_LEVEL`), `src/modules/interview/service/stream-service.ts`, `src/modules/interview/prompts/closing-feedback-prompt.ts`, `src/infrastructure/ai/openai-models.ts`.

Automated rule-based evaluators for tone/conciseness and alignment are planned separately (`src/test/quality/`). This document defines the **business metrics** only.

---

## 1. Turn-limit adherence (`maxTurns`)

### Definition

The share of interview sessions where the product respects the configured turn budget for the session level — no extra interviewer turns after the limit, and the final turn routes to closing feedback instead of a new question.

### Business rules (source of truth)

| Level  | `maxTurns` |
| ------ | ---------- |
| `entry`  | 5          |
| `mid`    | 7          |
| `senior` | 8          |

Set at session creation (`SessionRepository.create` → `MAX_TURNS_BY_LEVEL`).

### How adherence is enforced

1. **Pre-stream guard** — `InterviewStreamService` rejects new messages when `session.isFinished` or `session.turnCount >= session.maxTurns` (`409 ConflictError`: "Interview session is finished").
2. **Final-turn routing** — `isFinalTurn = session.turnCount + 1 >= session.maxTurns` sets `runReview: true` in graph input so the last allowed user message triggers `buildClosingFeedbackPrompt()` instead of `buildInterviewerSystemPrompt()`.
3. **Interviewer context** — Non-final turns pass `turnCount` and `maxTurns` into the system prompt (`Turn N of M`) and phase hints (opening / closing wrap-up).

### How to measure

| Signal | Meaning |
| ------ | ------- |
| `turnCount <= maxTurns` at `isFinished = true` | Session completed within budget |
| HTTP `409` on `/stream` after finish | Guard working (user attempted an extra turn) |
| `runReview === true` only when `turnCount + 1 === maxTurns` | Final turn correctly routed to closing feedback |

**Formula (session-level):**

```
adherence = sessions where (final turnCount <= maxTurns AND no post-finish turns accepted) / total finished sessions
```

Target direction: **100%** — any session with `turnCount > maxTurns` or an accepted stream after `isFinished` is a regression.

### Data sources

- PostgreSQL: `interview_sessions.turn_count`, `max_turns`, `is_finished`, `level`
- Application logs / HTTP access logs: `409` responses on interview stream routes
- E2E coverage: `stream-service.test.ts` (`ConflictError` when `turnCount >= maxTurns`)

---

## 2. Closing-feedback format adherence

### Definition

The share of closing-feedback model outputs that match the structure and length constraints defined in `buildClosingFeedbackPrompt()` / `## Format` block.

### Expected format (from prompt)

| Constraint | Rule |
| ---------- | ---- |
| Language | Portuguese |
| Length | **250–280 words** maximum (body before CTA) |
| Opening | One introductory paragraph, **no heading** |
| Sections | Exactly two headings: `## O que você fez bem` and `## O que precisa trabalhar` |
| Lists | Bullet lists only with `-` (2–3 bullets per section; third optional) |
| Forbidden | Code blocks, tables, links, HTML, numbered lists, extra sections |
| Overlap | No repetition between the two sections |
| CTA | Appended **after** the model output by the backend (`appendClosingFeedbackCta` / `closingFeedbackCtaStreamSuffix`) — not part of the model metric |

Constants: `CLOSING_FEEDBACK_WENT_WELL_HEADER`, `CLOSING_FEEDBACK_WORK_ON_HEADER` in `closing-feedback-prompt.ts`.

### How to measure

**Manual / eval dataset (today):** Sample stored `ai` messages from the final turn and check word count + section headings + bullet structure.

**Automated (planned):** Rule-based evaluator counting words, verifying exact section headings, and rejecting forbidden Markdown patterns. Unit tests for prompt content live in `closing-feedback-prompt.test.ts`; output validation will live under `src/test/quality/`.

**Formula:**

```
format_adherence = closing feedback outputs passing all format rules / total closing feedback outputs
```

No fixed production target is set yet; use trend monitoring and spot checks until the automated evaluator ships.

### Data sources

- PostgreSQL: final-turn `messages` rows (`role = ai`) for sessions where `runReview` was true
- Prompt spec: `docs/prompts-catalog.md` §2 (feedback final)
- Tests: `closing-feedback-prompt.test.ts` (prompt contract, not model output)

---

## 3. Retry-exhaustion rate

### Definition

The rate at which OpenAI model calls fail **after all native retries are exhausted** (transient provider errors that did not recover within LangChain's built-in retry limit, default **6**).

This is an **operational reliability** metric, not a quality-of-text metric. High rates indicate provider instability, misconfigured limits, or capacity issues.

### How retries work

All three production model factories (`openai-models.ts`) use `ChatOpenAI` without overriding `maxRetries` — LangChain's default (**6**) applies. Transient errors (429, 5xx, network) are retried natively.

| Factory | Call site |
| ------- | --------- |
| `createInterviewModel()` | `interviewer-node` (interview + closing feedback) |
| `createReviewModel()` | `review-items-generator-node` |
| `createExtractionModel()` | `ResumeService` structured extraction |

Exhausted retries surface as thrown errors from `model.invoke()` / `structuredModel.invoke()`. There is no dedicated structured log message for exhaustion today — monitor via generic error logs or upstream HTTP/worker failure rates.

### Client-visible behavior after exhaustion

| Flow | Behavior |
| ---- | -------- |
| Interview SSE | Error propagated to client as SSE `event: error` (no stack trace) |
| Review items (final turn) | Same graph error path as interview |
| Resume extraction | `ResumeService.process` returns `{ status: "failed", error: "<message>" }`; DB `error_message` stores a single-line message (no stack) |

### How to measure

**In logs / observability backend:** Filter `level=error` on interview stream, review-items, and resume extraction paths. Group by route/worker job and error message.

**Formulas:**

```
retry_exhaustion_rate (global) = exhausted_events / total_model_invocations

retry_exhaustion_rate (by flow) = exhausted_events for flow X / invocations for flow X
```

`total_model_invocations` is not logged today — derive from successful completions + exhausted events, or add a counter later. For early monitoring, **absolute count per day per `name`** is sufficient.

**Alerting heuristic (suggested):** Investigate if any flow exceeds a small baseline (e.g. > 0.1% of invocations over a 24 h window) or spikes relative to its 7-day median.

### Data sources

- Application logs: generic error paths in `stream-service.ts`, `resume-service.ts`, worker job failures
- LangChain: `maxRetries` default `6` on `ChatOpenAI` (`@langchain/core` `AsyncCaller`)
- Tests: `resume-service.test.ts` (exhaustion → clean failure message)

---

## Summary

| Metric | Question it answers | Primary signal today |
| ------ | ------------------- | -------------------- |
| Turn-limit adherence | Are sessions bounded by level turn budget? | DB `turn_count` / `max_turns`, `409` on stream |
| Closing-feedback format adherence | Does final feedback match prompt structure? | Manual sampling; automated rules planned |
| Retry-exhaustion rate | How often do provider retries fail completely? | Error logs on stream/worker paths; no dedicated exhaustion log |
