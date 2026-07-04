# Architecture

**Pattern:** Feature-sliced Next.js SPA with App Router route groups; backend as external REST + SSE API.

## High-Level Structure

```
┌─────────────────────────────────────────────────────────┐
│  App Router (src/app/)                                   │
│  ├── / (marketing)                                       │
│  ├── /login (auth)                                       │
│  └── (app)/* (authenticated — AuthGuard)                 │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│  Features (src/features/) — domain UI                    │
│  auth · dashboard · interview                            │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────────┐
│ TanStack     │ │ lib/api/*   │ │ AuthSession      │
│ Query hooks  │ │ fetch/SSE   │ │ Provider         │
└──────┬───────┘ └──────┬──────┘ └────────┬─────────┘
       │                │                  │
       └────────────────┴──────────────────┘
                        │
                        ▼
              Backend API (Express)
              /api/auth · /api/resumes
              /api/interview · /api/review-items
```

## Identified Patterns

### Layered data access

**Location:** `src/lib/api/` → `src/lib/query/hooks/` → pages/features  
**Purpose:** Separate HTTP transport from caching and UI consumption.  
**Implementation:** Plain `fetch` wrappers per domain (`auth.ts`, `resumes.ts`, `interview.ts`, `review-items.ts`); TanStack Query hooks wrap authenticated calls.  
**Example:** `useSessions()` in `src/lib/query/hooks/use-sessions.ts` calls `interviewApi.listSessions` via `fetchWithAuth`.

### Centralized API client with typed errors

**Location:** `src/lib/api/client.ts`  
**Purpose:** Consistent JSON requests and error shape.  
**Implementation:** `apiRequest<T>()` prepends `NEXT_PUBLIC_SERVER_URL`, sets Bearer token, parses JSON, throws `ApiError` with status and body.  
**Example:** All auth endpoints use `apiRequest`; resume upload uses raw `fetch` for multipart.

### Auth context with token refresh

**Location:** `src/features/auth/session-provider.tsx`, `session-storage.ts`  
**Purpose:** Client-side JWT session with automatic 401 retry.  
**Implementation:** Tokens stored in `localStorage`; `useSyncExternalStore` for cross-tab sync; `fetchWithAuth` retries once after refresh.  
**Example:** Query hooks use `fetchWithAuth((token) => apiCall(token))`.

### Route-group auth guard

**Location:** `src/app/(app)/layout.tsx`, `src/features/auth/auth-guard.tsx`  
**Purpose:** Protect authenticated routes client-side.  
**Implementation:** `(app)` route group wraps children in `AuthGuard`; redirects to `/login` when no session.  
**Example:** `/dashboard`, `/practice`, `/interview/[sessionId]` all inherit the guard.

### SSE streaming (interview turns)

**Location:** `src/lib/api/interview-stream.ts`, `src/features/interview/interview-chat.tsx`  
**Purpose:** Real-time AI response tokens during mock interviews.  
**Implementation:** Manual SSE parser on `fetch` ReadableStream; events `token`, `meta`, `error`, `[DONE]`. UI merges optimistic messages and invalidates queries after each turn.  
**Example:** `streamInterviewTurn()` → `InterviewChat.sendMessage()`.

### Optimistic UI + query cache updates

**Location:** `src/features/interview/interview-chat.tsx`  
**Purpose:** Responsive chat while streaming and after turns.  
**Implementation:** Local state for pending human message and streaming AI content; `queryClient.setQueryData` for session meta; `invalidateQueries` after turn completes.  
**Example:** `updateSessionMeta`, `mergeStreamedMessages`, `invalidateAfterTurn`.

### App shell layout

**Location:** `src/features/dashboard/app-shell.tsx`, `app-sidebar.tsx`  
**Purpose:** Consistent authenticated chrome (sidebar, mobile menu, optional header slot).  
**Implementation:** Client component used by dashboard, practice, and other app pages.  
**Example:** `DashboardPage` passes tab header into `<AppShell header={...}>`.

## Data Flow

### Authentication

1. User submits credentials on `/login` (`SignInForm` / `SignUpForm`).
2. `authApi.login` or `authApi.signup` + login → `AuthSessionProvider.persistSession`.
3. Tokens and user JSON written to `localStorage` (`session-storage.ts`).
4. Router navigates to `/dashboard`.
5. Subsequent API calls attach `Authorization: Bearer {accessToken}`.
6. On 401, `fetchWithAuth` calls `authApi.refresh` and retries once.

### Resume upload → interview session

1. User uploads PDF on `/practice` via `uploadResume()` (multipart).
2. `useResumes` polls every 3s while any resume has `status: processing`.
3. User selects level; `POST /api/interview/sessions` creates session.
4. Router or in-page state navigates to chat with `sessionId`.

### Interview streaming turn

1. `InterviewChat` loads history via `useSessionMessages(sessionId)`.
2. User sends message → `streamInterviewTurn(sessionId, content, token, callbacks)`.
3. SSE `token` events append to streaming bubble; `meta` updates turn count / finished flag.
4. On completion, queries invalidated for messages, sessions, and review items.
5. Finished sessions show chat/review toggle and `InterviewReviewPanel`.

### Dashboard stats

1. `useSessions` + `useReviewItems` fetch lists in parallel.
2. `deriveDashboardStats(sessions)` computes KPIs client-side (no dedicated stats API).
3. UI renders `DashboardStats`, `SessionsTable`, `ReviewItemsGrid`.

## Code Organization

**Approach:** Hybrid — App Router for routes, feature folders for domain UI, shared `components/` for marketing and design system.

**Structure:**

| Layer | Path | Role |
| --- | --- | --- |
| Routes | `src/app/` | Page entry points, metadata, route groups |
| Features | `src/features/{auth,dashboard,interview}/` | Domain-specific UI and logic |
| Shared UI | `src/components/ui/` | shadcn primitives |
| Patterns | `src/components/patterns/` | Reusable marketing/product patterns |
| Sections | `src/components/sections/` | Landing page blocks |
| API | `src/lib/api/` | HTTP/SSE clients |
| Query | `src/lib/query/` | TanStack Query keys and hooks |
| Types | `src/types/` | Shared TypeScript interfaces |
| Config | `src/config/` | Validated environment |

**Module boundaries:** Features may import from `lib/`, `components/`, and `types/`. API modules do not import from features. Pages compose features and hooks.
