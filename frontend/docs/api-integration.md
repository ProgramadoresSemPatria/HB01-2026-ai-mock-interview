# Frontend API integration

The frontend treats the backend as the single source of truth. Contract details live in [`backend/docs/frontend-mock-interview-api.md`](../../backend/docs/frontend-mock-interview-api.md).

## Environment

| Variable                 | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `NEXT_PUBLIC_SERVER_URL` | Backend origin (default `http://localhost:3000`) |

Frontend dev server runs on port **3001**. Ensure `CORS_ORIGIN` on the backend includes `http://localhost:3001`.

## Architecture

```
pages (App Router)
  → features/* (UI)
  → lib/query/hooks (TanStack Query)
  → features/auth/session-provider (Bearer token)
  → lib/api/* (fetch clients)
```

## Routes

| Route                    | Backend APIs                                           |
| ------------------------ | ------------------------------------------------------ |
| `/login`                 | `POST /api/auth/signup`, `POST /api/auth/login`        |
| `/dashboard`             | `GET /api/interview/sessions`, `GET /api/review-items` |
| `/practice`              | `POST /api/resumes`, `GET /api/resumes/:id` (poll)     |
| `/practice/new`          | `POST /api/interview/sessions`                         |
| `/interview/[sessionId]` | `GET .../messages`, `POST .../stream` (SSE)            |
| `/feedback`              | `GET /api/review-items`                                |

## Auth storage

- `localStorage`: access token, refresh token, user JSON
- `sessionStorage`: last uploaded `resumeId` (no list-resumes endpoint)

## Dashboard metrics

All overview stats are **derived** from API data (no fake KPIs):

- Sessions completed / active → session list
- Review items count → review-items list
- Highest level → max `level` among finished sessions

## Not exposed by backend (intentionally omitted from UI)

- Numeric interview scores
- Topic mastery percentages
- Syllabus, resources, upgrade flows
- Resume list endpoint
