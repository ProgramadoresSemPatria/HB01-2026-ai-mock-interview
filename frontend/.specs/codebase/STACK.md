# Tech Stack

**Analyzed:** 2026-07-04  
**Scope:** `frontend/` (Hone AI Mock Interview — Next.js client)

## Core

- **Framework:** Next.js 16.2 (App Router)
- **Language:** TypeScript 6 (strict mode)
- **Runtime:** Node.js (Next.js dev/build); Bun used as package manager locally
- **Package manager:** Bun (`bun.lock`) — `package-lock.json` also present

## Frontend

- **UI Framework:** React 19.2
- **Component primitives:** Base UI (`@base-ui/react`), shadcn/ui (style: `base-lyra`)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`), CSS variables in `src/index.css`, `tw-animate-css`
- **Icons:** Lucide React
- **State Management:** TanStack Query v5 (server state); React Context for auth (`AuthSessionProvider`)
- **Form Handling:** TanStack Form in dependencies; sign-in/sign-up currently use controlled `useState` forms
- **Theming:** `next-themes` (light-only default, system disabled)
- **Notifications:** Sonner
- **Markdown:** `react-markdown` (interview/review content)
- **Env validation:** `@t3-oss/env-nextjs` + Zod 4

## Backend (external — consumed by frontend)

Not part of this package; documented for integration context:

- Express 5 API on port 3000 (Bun runtime)
- JWT auth with refresh tokens
- SSE for interview streaming
- See monorepo `Backend/` and `docs/api-integration.md`

## Testing

- **Unit:** None configured
- **Integration:** None configured
- **E2E:** None configured (Playwright appears only as optional Next.js peer dependency)

## External Services

- **Backend API:** Hone Express API (`NEXT_PUBLIC_SERVER_URL`, default `http://localhost:3000`)
- **Deployment:** Vercel (frontend per root README)

## Development Tools

- **Linting:** ESLint 10 (flat config) — `@next/eslint-plugin-next`, `typescript-eslint`, React Hooks
- **Formatting:** Prettier 3
- **Type checking:** `tsc --noEmit` via `check-types` script
- **Compiler:** React Compiler enabled (`babel-plugin-react-compiler`, `reactCompiler: true` in `next.config.ts`)
- **DevTools:** TanStack Query Devtools (included in `Providers`)
- **Path alias:** `@/*` → `src/*`

## Scripts

| Script | Command |
| --- | --- |
| `dev` | `next dev --port 3001` |
| `build` | `next build` |
| `start` | `next start` |
| `check-types` | `tsc --noEmit` |
| `lint` | `eslint .` |
| `format` | `prettier --write .` |
