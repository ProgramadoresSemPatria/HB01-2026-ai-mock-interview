# Interview module — bounded context

**Decision**: SUS-DEC-01 option A — review-item persistence lives here; `GET /api/review-items` stays in the `review-items` module (read-only HTTP).

## Ownership

| Concern | Location |
|--------|----------|
| Persistence | `repository/review-repository.ts` (`ReviewRepository`) |
| Merge / upsert after generation | `service/review-merge-service.ts` (`ReviewMergeService`) |
| Generator adapter (LangGraph) | `infrastructure/ai/langgraph/review-items-generator-adapter.ts` (wired via factories; not a public import surface) |

## HTTP API

- **List review items** (`GET /api/review-items`): owned by `src/modules/review-items` — read-only; delegates to `ReviewRepository`.

## Public surface for external modules

Only these paths may be imported from outside `interview` (e.g. `review-items`):

| Import | Path |
|--------|------|
| `ReviewRepository` | `@/modules/interview/repository/review-repository` |
| Shared schemas (`ReviewPriority`, etc.) | `@/modules/interview/validations/interview-schemas` |
| `ReviewItemRecord` | `@/modules/interview/types/review-item-record` |

## Forbidden imports (external consumers)

Do **not** import from `interview` when building other modules:

- `prompts/` — LLM prompt templates (internal to interview stream)
- `@/infrastructure/ai/langgraph` — graph nodes and adapters
- `service/stream-service.ts` (`InterviewStreamService`) — streaming/session orchestration

Violations create coupling to interview runtime and AI infrastructure; use the public surface above instead.
