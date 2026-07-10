# Async Review Items Generation — Context

**Gathered:** 2026-07-09  
**Spec:** `.specs/features/async-review-items-generation/spec.md`  
**Status:** Execute complete (T1–T11) — awaiting user commit  
**Source:** Architecture discussion + user confirmation of agent-recommended gray-area decisions

---

## Feature Boundary

Decouple **review-item LLM extraction** from the final interview SSE turn: finish the conversation quickly (`isFinished` + closing feedback), enqueue generation on BullMQ in the existing `src/worker.ts`, and expose `reviewGenerationStatus` (`idle|pending|ready|failed`) so the client can poll until topics are ready. Interview turns and review-session streams stay synchronous SSE.

---

## Implementation Decisions

### Client readiness signal

- Final-turn SSE `meta` includes `reviewGenerationStatus` (`pending` or `failed` if enqueue already failed) plus `isFinished: true`
- After finish, FE **polls session GET** (same pattern as résumé `processing` → `ready`), ~2–3s interval, until status is `ready` or `failed`
- **Do not** use review-items list emptiness as the readiness signal (ambiguous vs zero topics)
- Invalidate / refresh `review-items` **only when** status becomes `ready`
- Closing feedback in chat and the feedback panel chrome may appear at `isFinished`; **review topic rows** appear when `ready`

### Manual retry in the same release

- BullMQ **automatic** retries with backoff remain required for MVP (P1)
- **Ship the manual retry endpoint in the same release** as P1/P2 (spec story labeled P3 for priority rank, but **not deferred**): `POST /api/interview/sessions/:id/review-generation/retry`
- Retry only when `isFinished=true` and `reviewGenerationStatus=failed` → set `pending`, enqueue, return updated status
- Invalid state → **409 Conflict**; ownership failures follow existing session patterns

### SSE meta shape

- `reviewGenerationStatus` appears **only on the final-turn** `meta` event
- Mid-turn `meta` stays as today (`turnCount`, `maxTurns`, `isFinished`) — no `idle` broadcast every turn

### Token quota on finish path

- API final turn: **do not** block conversation finish on review-generation quota
- Always attempt enqueue after `markFinished` (if Redis/enqueue fails → `failed`, chat still finished)
- Worker: run `assertWithinLimit` before LLM generate; on exhaustion → job fails → status `failed` with clear error
- User can use manual retry later when quota allows

### Agent's Discretion

- Exact BullMQ `attempts` / backoff numbers (suggest 3 attempts with exponential backoff; confirm in Design)
- Exact Prisma field names (`reviewGenerationStatus`, `reviewGenerationError`) as long as semantics match
- Poll interval copy/UX wording for “preparing topics…”
- Whether session list endpoints also return the new status fields (detail GET is mandatory; list is nice if cheap)

---

## Specific References

- Mirror resume pipeline: `resume-processing` queue + `src/worker.ts` + status machine
- Current FE race: `interview-chat.tsx` invalidates `["review-items"]` immediately after stream finish
- Prior decision overturned: `ICF-DEC-01` (leave chat unfinished when generator fails)

---

## Deferred Ideas

- Push/webhook when review generation completes
- Bull Board / admin queue UI
- Changing merge/similarity algorithm (OQ-02)
