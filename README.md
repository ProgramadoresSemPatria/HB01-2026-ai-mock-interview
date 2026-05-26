# hackathon2026

Full-stack TypeScript app split into two standalone projects in one Git repository:

- **Backend/** — Express REST API, Prisma, PostgreSQL
- **Front/** — Next.js App Router (port 3001)

There is no Turborepo, no npm workspaces, and no tRPC. The Front talks to the Backend over HTTP JSON.

## Getting started

### Backend

```bash
cd Backend
cp .env.example .env   # edit DATABASE_URL and secrets
bun install
bun run db:start       # optional: Docker Postgres
bun run db:push
bun run dev            # http://localhost:3000
```

### Front

```bash
cd Front
cp .env.example .env.local
bun install
bun run dev            # http://localhost:3001
```

Set `NEXT_PUBLIC_SERVER_URL` in `Front/.env.local` to the Backend base URL (default `http://localhost:3000`).

Set `CORS_ORIGIN` in `Backend/.env` to the Front origin (default `http://localhost:3001`).

## Scripts (per project)

| Project  | Dev              | Build           | Tests           |
|----------|------------------|-----------------|-----------------|
| Backend  | `bun run dev`    | `bun run build` | `bun run test`  |
| Front    | `bun run dev`    | `bun run build` | —               |

## Lint and format

Run inside each project:

```bash
cd Backend && bun run lint && bun run format:check
cd Front && bun run lint && bun run format:check
```

Git hooks: `cd Backend && bun install` configures Husky automatically. The pre-commit hook runs Backend tests.

## Auth API (REST)

| Method | Path |
|--------|------|
| POST | `/api/auth/signup` |
| POST | `/api/auth/login` |
| POST | `/api/auth/refresh` |
| POST | `/api/auth/request-password-reset` |
| POST | `/api/auth/reset-password` |

Health: `GET /` returns `OK`.
