# Token Usage Limits — Specification

## Problem Statement

The platform invokes OpenAI via LangChain on every interview turn, final-turn review generation, and resume extraction, but does not track or cap token consumption per user. Request-based rate limiting (`RATE_LIMIT_AI_*`) limits call frequency, not cost. Operators need monthly per-user token budgets to prevent abuse and control API spend.

## Goals

- [ ] Track prompt and completion token usage for every LLM invocation.
- [ ] Persist cumulative usage per user per calendar month (UTC).
- [ ] Enforce a configurable monthly token cap before each LLM call.
- [ ] Return a clear `429` error when the limit is reached.
- [ ] Configure limits via environment variables.

## Out of Scope

| Item | Motivo |
|------|--------|
| Per-user tier / admin overrides | Single global env limit for all users |
| Frontend usage dashboard | Backend error message is sufficient |
| Replacing request rate limiter | Complementary protection; `RATE_LIMIT_AI_*` unchanged |
| Token limit on `POST /sessions` | No LLM call on session creation |

## Decisions

| ID | Decision |
|----|----------|
| TUL-DEC-01 | Monthly reset — usage keyed by `(userId, periodKey)` where `periodKey = "YYYY-MM"` (UTC) |
| TUL-DEC-02 | Limit metric: `promptTokens + completionTokens` vs `TOKEN_LIMIT_MONTHLY_MAX` |
| TUL-DEC-03 | Pre-check before each LLM call; record after via LangChain callbacks + metadata fallback |
| TUL-DEC-04 | `TokenLimitExceededError` → HTTP 429 with distinct message from request rate limit |

## Requirement Traceability

| ID | Description |
|----|-------------|
| TUL-01 | Usage tracked on interview stream LLM call |
| TUL-02 | Usage tracked on review-items generator LLM call |
| TUL-03 | Usage tracked on resume extraction LLM call |
| TUL-04 | Usage persisted in `user_token_usage` per user per month |
| TUL-05 | Requests rejected when at or over monthly cap |
| TUL-06 | Clear 429 error message returned to client |
| TUL-07 | `TOKEN_LIMIT_ENABLED` and `TOKEN_LIMIT_MONTHLY_MAX` env vars |
