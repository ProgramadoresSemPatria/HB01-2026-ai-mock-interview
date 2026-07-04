# Codebase Concerns

**Analysis Date:** 2026-07-04  
**Scope:** `frontend/`

## Tech Debt

**Client-only auth protection:**

- Issue: `(app)` routes rely on client-side `AuthGuard`; no Next.js middleware or server-side session check.
- Files: `src/features/auth/auth-guard.tsx`, `src/app/(app)/layout.tsx`
- Why: Tokens live in `localStorage`; no cookie-based session for Server Components.
- Impact: Brief flash of protected shell possible; direct URL access depends on client JS; SEO/security boundary is weaker than server auth.
- Fix approach: Add `middleware.ts` with cookie-based session or move to httpOnly refresh cookie + server-validated access token.

**Stale integration documentation:**

- Issue: `docs/api-integration.md` says resume list endpoint is not exposed; `listResumes()` and `useResumes` now call `GET /api/resumes/`.
- Files: `docs/api-integration.md`, `src/lib/api/resumes.ts`
- Impact: Misleading guidance for contributors integrating new resume features.
- Fix approach: Update `api-integration.md` to reflect list/delete endpoints and remove outdated session
  storage-only note.

**TanStack Form dependency unused in auth forms:**

- Issue: `@tanstack/react-form` is installed but sign-in/sign-up use manual `useState`.
- Files: `src/components/sign-in-form.tsx`, `src/components/sign-up-form.tsx`, `package.json`
- Impact: Inconsistent form validation patterns if new forms adopt TanStack Form while auth does not.
- Fix approach: Either migrate auth forms to TanStack Form + Zod or remove unused dependency.

**README constraints outdated:**

- Issue: Root README mentions "Frontend auth protection for `/dashboard` is deferred" and "dashboard uses mock states" — code now has `AuthGuard` and live API data on dashboard.
- Files: `README.md`
- Impact: Onboarding confusion about current product state.
- Fix approach: Update README frontend section to match implemented behavior.

## Known Bugs

No reproducible bugs identified during static analysis. Runtime verification recommended for:

- SSE stream interruption mid-turn (abort handling exists but untested)
- Race when refresh token expires during concurrent queries

## Security Considerations

**JWT in localStorage:**

- Risk: XSS could exfiltrate access and refresh tokens.
- Files: `src/features/auth/session-storage.ts`
- Current mitigation: Standard React escaping; no obvious `dangerouslySetInnerHTML` in auth paths.
- Recommendations: httpOnly cookies for refresh token; short-lived access token; CSP headers on Vercel.

**Client-side-only authorization:**

- Risk: UI hides routes but backend must enforce ownership (backend does — frontend assumes this).
- Files: All `lib/api/*` callers
- Recommendations: Keep treating backend as source of truth; add middleware when cookie auth is available.

## Performance Bottlenecks

**Resume polling:**

- Issue: `useResumes` polls every 3s while any resume is `processing`.
- Files: `src/lib/query/hooks/use-resumes.ts`
- Impact: Extra API load during upload window; acceptable for single-user dev, may add up at scale.
- Fix approach: WebSocket/SSE status events or exponential backoff polling.

**Full session list on interview page:**

- Issue: `InterviewChat` loads all sessions via `useSessions()` only to find one session's metadata.
- Files: `src/features/interview/interview-chat.tsx`
- Impact: Unnecessary payload on interview route for users with long history.
- Fix approach: Add `GET /api/interview/sessions/:id` or derive meta from stream `meta` events only.

## Fragile Areas

**Manual SSE parser:**

- Issue: Custom buffer/split logic for SSE blocks — sensitive to format changes from backend.
- Files: `src/lib/api/interview-stream.ts`
- Impact: Silent parse failures or missed tokens if backend event format changes.
- Fix approach: Contract tests against backend SSE samples; consider `eventsource-parser` library.

**Optimistic message merge:**

- Issue: Complex cache manipulation with temporary IDs (`pending-human`, `optimistic-ai-*`).
- Files: `src/features/interview/interview-chat.tsx`
- Impact: Duplicate or missing messages if invalidation timing differs from server.
- Fix approach: Unit tests for merge logic; simplify to invalidate-only after stream completes.

## Test Coverage Gaps

**No automated tests:**

- Issue: Zero unit, component, or E2E tests; no frontend CI workflow.
- Files: Entire `frontend/` tree; `.github/workflows/` (backend only)
- Impact: Regressions in auth refresh, SSE parsing, and query cache logic undetected until manual QA.
- Fix approach: Add Vitest for `lib/api` and hooks; Playwright smoke test for login → practice → send message; frontend CI job running lint + types + build (+ tests when added).

Priority untested paths:

1. `interview-stream.ts` — SSE parsing
2. `session-provider.tsx` — refresh on 401
3. `interview-chat.tsx` — optimistic updates
4. `deriveDashboardStats` — stats derivation edge cases

## Dependency Risks

**Dual lockfiles:**

- Issue: Both `bun.lock` and `package-lock.json` present.
- Files: `frontend/bun.lock`, `frontend/package-lock.json`
- Impact: Divergent dependency trees between contributors using npm vs Bun.
- Fix approach: Standardize on one package manager and remove the other lockfile.

**Bleeding-edge stack:**

- Issue: Next.js 16, React 19, TypeScript 6 — recent major versions.
- Impact: Ecosystem compatibility surprises (ESLint plugins, third-party libs).
- Fix approach: Pin versions in CI; monitor Next/React release notes.

## Missing Features (documented gaps)

- Password reset UI not wired (API client methods exist)
- Profile page likely placeholder (`src/app/(app)/profile/page.tsx` — verify before extending)
