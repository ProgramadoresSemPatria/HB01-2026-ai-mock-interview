# AI Mock Interview

Full-stack TypeScript project for technical mock interviews driven by AI. The repository contains a production-oriented backend for resume processing and interview orchestration, plus a frontend shell for the public landing page and app dashboard.

## Repository layout

- `backend/` - Express API, Prisma, PostgreSQL, BullMQ worker, LangChain, LangGraph
- `frontend/` - Next.js App Router frontend
- `.specs/` - brownfield notes, feature specs, roadmap, and decision memory

## Product flow

1. The user uploads a resume PDF.
2. The backend stores the file in Cloudflare R2 and enqueues asynchronous processing.
3. A worker extracts PDF text and generates a structured resume summary with OpenAI.
4. The user creates an interview session for `entry`, `mid`, or `senior`.
5. The backend streams interview turns over SSE and enforces turn limits server-side.
6. On the final turn, the backend generates review items and persists the user's study backlog.

## Backend stack

| Concern | Technology |
| --- | --- |
| Runtime | Bun |
| HTTP | Express 5 |
| Validation | Zod |
| Persistence | Prisma 7 + PostgreSQL |
| Queue | BullMQ + Redis |
| Storage | Cloudflare R2 |
| AI | OpenAI, LangChain JS, LangGraph JS |
| Checkpointing | `@langchain/langgraph-checkpoint-postgres` |
| Tests | Vitest + Supertest |

## Frontend direction

- `/` is the public landing page.
- Authenticated routes (`/dashboard`, `/practice`, `/interview/[id]`, `/feedback`) call the backend API (no mocked data).
- Integration map: [`frontend/docs/api-integration.md`](frontend/docs/api-integration.md).
- API contract: [`backend/docs/frontend-mock-interview-api.md`](backend/docs/frontend-mock-interview-api.md).

## Getting started

### 1. Install dependencies

```bash
cd backend
bun install

cd ../frontend
bun install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Required infrastructure for full backend behavior:

- PostgreSQL
- Redis
- Cloudflare R2 bucket
- OpenAI API key

### 3. Start local services

```bash
cd backend
bun run db:start
bun run db:push
```

### 4. Run the apps

API server:

```bash
cd backend
bun run dev
```

Resume worker:

```bash
cd backend
bun run dev:worker
```

Frontend:

```bash
cd frontend
bun run dev
```

## Main API surface

- `POST /api/resumes`
- `GET /api/resumes/:id`
- `POST /api/interview/sessions`
- `GET /api/interview/sessions`
- `GET /api/interview/sessions/:sessionId/messages`
- `POST /api/interview/sessions/:sessionId/stream`

Auth routes remain under `/api/auth/*`.

Detailed frontend-consumption notes live in [backend/docs/frontend-mock-interview-api.md](/C:/Users/Vinícius/Desktop/Codes/hackathon2026-frontend-setup/backend/docs/frontend-mock-interview-api.md).

## Verification

Backend:

```bash
cd backend
bun run test
bun run test:e2e
bun run check-types
```

Frontend:

```bash
cd frontend
bun run lint
bun run check-types
bun run build
```

## Current constraints

- Frontend auth protection for `/dashboard` is deferred.
- The dashboard intentionally uses product-faithful mock states until upload and stream UI wiring lands.
- Interview ownership, turn control, and review generation remain backend-controlled.
