# Testing Infrastructure

**Status:** No automated test suite exists in `frontend/` as of 2026-07-04.

## Test Frameworks

**Unit/Integration:** Not configured  
**E2E:** Not configured  
**Coverage:** Not configured

`@playwright/test` appears only as an optional peer dependency of Next.js in `package-lock.json`; no Playwright config or test files present.

## Test Organization

**Location:** N/A — no `__tests__/`, `*.test.ts`, or `e2e/` directories in frontend.  
**Naming:** N/A  
**Structure:** N/A

## Testing Patterns

No unit, integration, or E2E patterns observed in the frontend codebase.

## Test Execution

**Commands (quality gates in use today):**

| Command | Purpose |
| --- | --- |
| `bun run lint` | ESLint across project |
| `bun run check-types` | TypeScript strict check |
| `bun run build` | Next.js production build |

Root README lists these as the frontend verification steps. No `test` script in `package.json`.

**CI:** No GitHub Actions workflow targets `frontend/` (backend-only CI in `.github/workflows/`).

## Coverage Targets

**Current:** 0% automated coverage  
**Goals:** Not documented for frontend  
**Enforcement:** Manual lint + typecheck + build only

## Test Coverage Matrix

| Code Layer | Required Test Type | Location Pattern | Run Command |
| --- | --- | --- | --- |
| `src/lib/api/` | none (recommended: unit) | `src/lib/api/*.ts` | — |
| `src/lib/query/hooks/` | none (recommended: unit + MSW) | `src/lib/query/hooks/*.ts` | — |
| `src/features/` | none (recommended: component) | `src/features/**/*.tsx` | — |
| `src/components/` | none (recommended: component) | `src/components/**/*.tsx` | — |
| `src/app/` (pages) | none (recommended: E2E) | `src/app/**/page.tsx` | — |
| Auth/session | none (recommended: integration) | `src/features/auth/*` | — |
| SSE streaming | none (recommended: unit) | `src/lib/api/interview-stream.ts` | — |

> Critical untested paths flagged in `CONCERNS.md`.

## Parallelism Assessment

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
| --- | --- | --- | --- |
| Unit | N/A | N/A | No test runner configured |
| Integration | N/A | N/A | No test runner configured |
| E2E | N/A | N/A | No test runner configured |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After any frontend change | `bun run lint && bun run check-types` |
| Build | Before merge / deploy | `bun run lint && bun run check-types && bun run build` |
| Full | N/A (no tests) | Same as Build |

Recommended future additions (not yet implemented):

- Vitest + React Testing Library for API helpers and hooks
- MSW for mocking backend in component tests
- Playwright for auth flow and interview E2E against local API
