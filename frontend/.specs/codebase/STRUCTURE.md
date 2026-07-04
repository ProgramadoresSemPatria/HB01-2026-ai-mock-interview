# Project Structure

**Root:** `frontend/` (monorepo sibling: `Backend/`)

## Directory Tree

```
frontend/
├── docs/
│   └── api-integration.md
├── src/
│   ├── app/
│   │   ├── (app)/              # Authenticated routes
│   │   │   ├── dashboard/
│   │   │   ├── feedback/
│   │   │   ├── interview/[sessionId]/
│   │   │   ├── practice/ (+ new/)
│   │   │   ├── profile/
│   │   │   ├── resumes/
│   │   │   └── layout.tsx      # AuthGuard wrapper
│   │   ├── login/
│   │   ├── layout.tsx          # Root layout, fonts, Providers
│   │   └── page.tsx            # Marketing landing
│   ├── components/
│   │   ├── ui/                 # shadcn primitives
│   │   ├── patterns/           # Marketing/product patterns
│   │   ├── sections/           # Landing page sections
│   │   ├── shells/             # Auth/marketing layouts
│   │   └── providers.tsx
│   ├── config/
│   │   └── env.ts
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── interview/
│   ├── lib/
│   │   ├── api/
│   │   └── query/
│   ├── types/
│   └── index.css
├── components.json             # shadcn config
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Module Organization

### App Router (`src/app/`)

**Purpose:** URL mapping, page composition, route-level layouts.  
**Key files:** `page.tsx` per route, `(app)/layout.tsx` for auth protection.

### Features (`src/features/`)

**Purpose:** Domain-specific UI and client logic.

| Feature | Key files |
| --- | --- |
| `auth/` | `session-provider.tsx`, `session-storage.ts`, `auth-guard.tsx` |
| `dashboard/` | `app-shell.tsx`, `app-sidebar.tsx`, `sessions-table.tsx`, `review-items-grid.tsx`, `lib/stats.ts` |
| `interview/` | `interview-chat.tsx`, message list/bubble/input, review panel |

### Shared components (`src/components/`)

**Purpose:** Design system, marketing site, global providers.

- `ui/` — Button, Card, Input, etc. (shadcn)
- `sections/` — Hero, FAQ, Features (landing page)
- `patterns/` — Feature cards, marketing nav, chat preview
- `shells/` — Auth and marketing page wrappers

### Library (`src/lib/`)

**Purpose:** Cross-cutting utilities and data access.

- `api/` — REST/SSE clients per backend module
- `query/` — TanStack Query keys and hooks
- `utils.ts` — `cn()` helper
- `query-client.ts` — Global QueryClient config

### Types (`src/types/`)

**Purpose:** Shared interfaces: `auth.ts`, `interview.ts`, `review-items.ts`.

## Where Things Live

**Authentication:**

- UI: `src/app/login/page.tsx`, `src/components/sign-in-form.tsx`
- Session logic: `src/features/auth/`
- API: `src/lib/api/auth.ts`

**Mock interview (chat + stream):**

- UI: `src/features/interview/`, `src/app/(app)/interview/[sessionId]/`, embedded in `practice/page.tsx`
- Streaming: `src/lib/api/interview-stream.ts`
- Hooks: `use-session-messages.ts`, `use-sessions.ts`

**Resume upload:**

- UI: `src/app/(app)/practice/page.tsx`, `src/app/(app)/resumes/page.tsx`
- API: `src/lib/api/resumes.ts`
- Hooks: `use-resumes.ts`, `use-resume.ts`

**Dashboard & feedback:**

- UI: `src/app/(app)/dashboard/page.tsx`, `feedback/page.tsx`
- Stats derivation: `src/features/dashboard/lib/stats.ts`
- Hooks: `use-sessions.ts`, `use-review-items.ts`

**Marketing landing:**

- UI: `src/app/page.tsx` + `src/components/sections/*`
- Shell: `src/components/shells/marketing-shell.tsx`

**Configuration:**

- Env: `src/config/env.ts`, `.env.example`
- Next: `next.config.ts`
- Tailwind/shadcn: `src/index.css`, `components.json`, `postcss.config.mjs`

## Special Directories

**`src/app/(app)/`:** Route group — does not affect URL; applies `AuthGuard` to all nested app routes.

**`src/components/ui/`:** Generated/maintained shadcn components — prefer extending via variants over one-off duplicates.

**`docs/`:** Frontend-specific integration notes (`api-integration.md`); backend contract in `Backend/docs/frontend-mock-interview-api.md`.

**`.specs/codebase/`:** Brownfield analysis for this frontend package (this folder).
