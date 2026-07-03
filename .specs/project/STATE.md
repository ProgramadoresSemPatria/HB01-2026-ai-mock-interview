# Project State

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-27 | Use existing `Int` user IDs (not UUID) for FK columns | Aligns with current Prisma `User` model; avoids migration of auth layer |
| 2026-05-27 | Resume/session/message/review entity IDs use UUID | Matches LangGraph `thread_id` requirement and spec data model |
| 2026-05-27 | Backend-only scope for first implementation phase | User provided detailed backend spec; frontend is separate roadmap item |

## Open Questions

| ID | Question | Status |
|----|----------|--------|
| OQ-01 | Default interview language (PT-BR vs EN)? | Open — defer to Design |
| OQ-02 | Review item similarity threshold for deduplication | Open — propose 0.85 cosine in Design |
| OQ-03 | Client payload for `POST .../stream` (message text field name) | Open — propose `{ "message": string }` in Design |

## Blockers

_None_

## Deferred Ideas

- Resume reprocessing endpoint (re-queue failed/processing jobs)
- Webhook or push notification when resume processing completes
- Export interview transcript as PDF

## Lessons Learned

_Empty — populate during Execute phase_
