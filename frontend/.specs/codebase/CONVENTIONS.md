# Code Conventions

Observed patterns from representative files across `frontend/src/`.

## Naming Conventions

**Files:**

- Pages: `page.tsx` (App Router convention)
- Layouts: `layout.tsx`
- Feature components: `kebab-case.tsx` (e.g. `interview-chat.tsx`, `auth-guard.tsx`)
- UI primitives: `kebab-case.tsx` under `components/ui/`
- API modules: domain noun (`auth.ts`, `interview-stream.ts`)
- Query hooks: `use-{resource}.ts` (e.g. `use-sessions.ts`)

**Functions/Methods:**

- camelCase for functions and hooks: `fetchWithAuth`, `streamInterviewTurn`, `deriveDashboardStats`
- React components: PascalCase: `InterviewChat`, `AuthGuard`, `AppShell`
- API objects: camelCase namespace exports: `authApi`, `interviewApi`

**Variables:**

- camelCase: `isStreaming`, `activeSessionId`, `readyResumes`
- Boolean prefixes: `is`, `has`, `can` — `isAuthenticated`, `canSend`, `isFinished`

**Constants:**

- SCREAMING_SNAKE for storage keys: `ACCESS_TOKEN_KEY`, `REFRESH_TOKEN_KEY`
- PascalCase for React context/type names: `AuthContextValue`, `StreamTurnCallbacks`
- `as const` for query keys and tab literals

## Code Organization

**Import/Dependency Declaration:**

1. React / Next.js
2. Third-party libraries
3. Blank line
4. Internal `@/` imports (features, lib, components, types)
5. Relative imports for co-located feature files

Example from `interview-chat.tsx`:

```typescript
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/session-provider";
import { streamInterviewTurn } from "@/lib/api/interview-stream";
// ...
import { InterviewChatInput } from "./interview-chat-input";
```

**File structure (client components):**

1. `"use client"` directive when needed (first line)
2. Imports
3. Types/constants local to file
4. Main exported component
5. Helper functions (if any) below component or inline

**Client vs Server:**

- Most interactive pages and features are Client Components (`"use client"`).
- Root `layout.tsx` is a Server Component (fonts, metadata).
- Provider tree mounted from client `Providers` component.

## Type Safety / Documentation

**Approach:** Strict TypeScript; domain types in `src/types/`; inline types for API responses in `lib/api/` when domain-specific.

- `verbatimModuleSyntax: true` — type-only imports use `import type`
- ESLint enforces `@typescript-eslint/consistent-type-imports`
- Zod validates env at build time (`src/config/env.ts`)
- Next.js `typedRoutes: true` for route type safety

Example:

```typescript
import type { StreamMeta } from "@/types/interview";
```

## Error Handling

**Pattern:** Throw `ApiError` from API layer; catch at UI boundary with `toast.error` or inline error UI.

- `apiRequest` and stream parser throw `ApiError(message, status, body)`
- Auth refresh failure clears session silently and returns null
- TanStack Query global `onError` shows toast with retry action (`query-client.ts`)
- Feature components distinguish 404 vs generic errors (e.g. interview session not found)

Example:

```typescript
} catch (err) {
  toast.error(err instanceof ApiError ? err.message : "Stream failed");
  invalidateAfterTurn();
}
```

## Styling Conventions

**Pattern:** Tailwind utility classes; CSS variable tokens via parenthesis syntax: `text-(--foreground)`, `bg-(--card)`, `border-(--border)`.

- `cn()` from `lib/utils` merges conditional classes
- shadcn variants via `class-variance-authority` on UI components
- Responsive breakpoints: `md:` prefix common for layout shifts

## Comments / Documentation

**Style:** Minimal — code is self-explanatory; comments used for non-obvious behavior only.

Examples:

- `/** Stable snapshot for useSyncExternalStore — avoids infinite re-renders. */` in session provider
- Section comments in longer pages (e.g. practice page effects)

## ESLint / Formatting

- Unused vars prefixed with `_` are allowed
- Prettier + `eslint-config-prettier` (no conflicting style rules)
- Ignores: `.next/`, `node_modules/`, `dist/`, `coverage/`
