# External Integrations

All backend communication goes through `NEXT_PUBLIC_SERVER_URL` (validated in `src/config/env.ts`).

## Backend API (Hone Express)

**Service:** Hone backend (`Backend/`)  
**Purpose:** Auth, resume processing, mock interviews, review items  
**Implementation:** `src/lib/api/*` + TanStack Query hooks  
**Configuration:** `NEXT_PUBLIC_SERVER_URL` in `.env.local` (default `http://localhost:3000`)  
**Authentication:** JWT Bearer token on protected routes; refresh via `POST /api/auth/refresh`

Frontend dev server runs on port **3001**. Backend `CORS_ORIGIN` must include `http://localhost:3001`.

## API Integrations

### Auth (`src/lib/api/auth.ts`)

**Purpose:** User registration, login, token refresh, password reset  
**Authentication:** Public for signup/login/reset; refresh uses refresh token in body  
**Key endpoints:**

| Method | Path | Used by |
| --- | --- | --- |
| POST | `/api/auth/signup` | Sign-up flow |
| POST | `/api/auth/login` | Sign-in flow |
| POST | `/api/auth/refresh` | `fetchWithAuth` 401 retry |
| POST | `/api/auth/request-password-reset` | Available in API client (UI TBD) |
| POST | `/api/auth/reset-password` | Available in API client (UI TBD) |

### Resumes (`src/lib/api/resumes.ts`)

**Purpose:** PDF upload, status polling, list, delete  
**Authentication:** Bearer token  
**Key endpoints:**

| Method | Path | Used by |
| --- | --- | --- |
| POST | `/api/resumes/` | Multipart upload |
| GET | `/api/resumes/` | `useResumes` list |
| GET | `/api/resumes/:id` | `useResume` detail/poll |
| DELETE | `/api/resumes/:id` | Resume management UI |

**Polling:** `useResumes` refetches every 3s while any resume has `status: processing`.

### Interview (`src/lib/api/interview.ts`, `interview-stream.ts`)

**Purpose:** Session lifecycle, message history, SSE streaming  
**Authentication:** Bearer token  
**Key endpoints:**

| Method | Path | Used by |
| --- | --- | --- |
| POST | `/api/interview/sessions` | Create session (`/practice/new`) |
| GET | `/api/interview/sessions` | Dashboard, practice, interview pages |
| GET | `/api/interview/sessions/:id/messages` | `useSessionMessages` |
| POST | `/api/interview/sessions/:id/stream` | SSE turn streaming |

**SSE events:** `token` (content chunks), `meta` (turnCount, maxTurns, isFinished), `error`, `data: [DONE]`.

### Review items (`src/lib/api/review-items.ts`)

**Purpose:** Study backlog after completed interviews  
**Authentication:** Bearer token  
**Key endpoints:**

| Method | Path | Used by |
| --- | --- | --- |
| GET | `/api/review-items` | Dashboard, feedback page, review panel |

## Client-Side Storage

**localStorage** (`src/features/auth/session-storage.ts`):

| Key | Content |
| --- | --- |
| `hone_access_token` | JWT access token |
| `hone_refresh_token` | Refresh token |
| `hone_user` | Serialized user JSON |
| `hone_resume_id` | Last selected resume ID |

No httpOnly cookies for auth — tokens are fully client-managed.

## Deployment

**Frontend:** Vercel (per root README — [hone-mock-interview.vercel.app](https://hone-mock-interview.vercel.app/))  
**Backend:** Railway (API + worker) — not configured in frontend repo

## Webhooks / Background Jobs

None on the frontend. Resume async processing and LangGraph orchestration run entirely in the backend worker.

## Contract Documentation

- Frontend integration map: `docs/api-integration.md`
- Backend API contract: `../Backend/docs/frontend-mock-interview-api.md`

**Note:** `api-integration.md` states resume list endpoint was omitted; code now calls `GET /api/resumes/` via `listResumes()` — doc may be stale.

## Intentionally Omitted UI (per integration doc)

Features not exposed by backend and not built in UI:

- Numeric interview scores
- Topic mastery percentages
- Syllabus, resources, upgrade flows

Dashboard metrics are derived client-side from sessions and review-items lists.
