# Borderless Auth via better-auth — Tasks

**Spec**: `.specs/features/borderless-better-auth/spec.md`  
**Design**: `.specs/features/borderless-better-auth/design.md`

---

## Execution Plan

```
Phase 1 — Schema & BE auth core
  T1 → T2 → T3 → T4

Phase 2 — Remove local auth + adapt tests
  T5 → T6

Phase 3 — Frontend better-auth
  T7 → T8 → T9

Phase 4 — Verify
  T10
```

---

## Tasks

### T1: Prisma User.externalId + nullable password; drop RefreshToken

**What:** Migrate schema per design.  
**Where:** `backend/prisma/schema/user.prisma` + migration  
**Depends on:** —  
**Reuses:** Existing User model  
**Done when:** `prisma generate` succeeds; `externalId` unique; `password` optional; no RefreshToken model  
**Tests:** none (schema)  
**Gate:** `cd backend && bun run db:generate`  
**Req:** AUTH-04

---

### T2: Borderless token verifier port + JWT adapter

**What:** `IBorderlessTokenVerifier` + JWT implementation reading `BORDERLESS_JWT_SECRET` / JWKS.  
**Where:** `backend/src/modules/auth/protocols/`, adapter under auth or shared  
**Depends on:** T1 (env may land with T3)  
**Done when:** Unit tests cover valid/invalid/expired/missing-claim tokens  
**Tests:** unit co-located  
**Gate:** vitest on verifier file  
**Req:** AUTH-03

---

### T3: UserRepository upsert + UserSyncService

**What:** `getByExternalId`, `upsertFromBorderless`; sync service preserves `interviewLocale`.  
**Where:** repository + new service  
**Depends on:** T1  
**Done when:** Unit/integration covers create + update name/email without wiping locale  
**Tests:** unit or integration  
**Gate:** vitest  
**Req:** AUTH-04, AUTH-09

---

### T4: Replace check-auth middleware + factory + env

**What:** Middleware verifies Borderless JWT → sync → `req.userId`; PUBLIC_ROUTES = health only; env schema for Borderless JWT; remove JWT_SECRET requirement for auth if unused.  
**Where:** middleware, factory, `server-schema.ts`, `.env.example`  
**Depends on:** T2, T3  
**Done when:** Middleware unit tests pass with stub verifier  
**Tests:** unit (rewrite check-auth-middleware.test.ts)  
**Gate:** vitest middleware  
**Req:** AUTH-03, AUTH-04, AUTH-08

---

### T5: Remove local auth routes/controller/service wiring

**What:** Delete or gut auth routes, AuthService signup/login/refresh/reset, controller, related validations/factories; stop mounting `/api/auth/*` local handlers. Keep users module + UserRepository sync methods.  
**Where:** `modules/auth/**`, factories  
**Depends on:** T4  
**Done when:** No local auth endpoints; app boots; domain routes still protected  
**Tests:** update/remove auth-service tests  
**Gate:** `bun run check-types` in backend  
**Req:** AUTH-07

---

### T6: Rewrite E2E/auth helpers for Borderless JWT

**What:** `seedAuthenticatedUser(app)` creates DB user with `externalId` + returns signed JWT; rewrite e2e suites that used signup/login. Remove obsolete auth.e2e local-auth cases or replace with middleware smoke.  
**Where:** `backend/src/test/helpers/auth-helpers.ts`, e2e files  
**Depends on:** T5  
**Done when:** `bun run test:e2e` auth-dependent suites pass (env/Docker permitting)  
**Tests:** e2e  
**Gate:** vitest e2e (or unit+integration if e2e infra down)  
**Req:** AUTH-03, AUTH-07

---

### T7: better-auth server + credentials → Borderless + API route

**What:** Install deps; `auth.ts` + `[...all]/route.ts`; env for BETTER_AUTH_* and BORDERLESS_API_BASE; store accessToken in session.  
**Where:** `frontend/src/lib/auth/*`, `frontend/src/app/api/auth/[...all]/route.ts`, `frontend/src/config/env.ts`  
**Depends on:** — (parallel with Phase 1 after T1 conceptually; can start after T5 for integration)  
**Done when:** Route responds; credentials callback wired  
**Tests:** none (manual / typecheck)  
**Gate:** `bun run check-types` frontend  
**Req:** AUTH-01, AUTH-02, AUTH-05

---

### T8: Rewrite session provider + login-only UI

**What:** Session from better-auth; `getAccessToken` = Borderless token; no refresh; logout; login page without signup; remove/dead-code local auth API client.  
**Where:** session-provider, login page, sign-in-form, remove sign-up usage  
**Depends on:** T7  
**Done when:** Types clean; AuthGuard still works  
**Tests:** none  
**Gate:** frontend check-types  
**Req:** AUTH-02, AUTH-05, AUTH-06, AUTH-07, AUTH-08

---

### T9: Align FE user types with Borderless session shape

**What:** Update `UserWithoutPassword` / consumers if id becomes string externally while local APIs still use Int via Bearer-only identity; ensure interviewLocale flow still works via `/api/users/me`.  
**Where:** `frontend/src/types/auth.ts`, session provider, dashboard greetings  
**Depends on:** T8  
**Done when:** No type errors; locale hook still compiles  
**Gate:** check-types  
**Req:** AUTH-02, AUTH-09

---

### T10: Full gate + STATE/ROADMAP status

**What:** Run backend unit tests + frontend check-types; update spec traceability; mark ROADMAP/STATE.  
**Depends on:** T6, T9  
**Done when:** Gates green (or documented infra blockers); STATE current work updated  
**Req:** all

---

## Traceability

| Req ID | Tasks |
| ------ | ----- |
| AUTH-01 | T7, T8 |
| AUTH-02 | T7, T8, T9 |
| AUTH-03 | T2, T4, T6 |
| AUTH-04 | T1, T3, T4 |
| AUTH-05 | T7, T8 |
| AUTH-06 | T8 |
| AUTH-07 | T5, T6, T8 |
| AUTH-08 | T4, T8 |
| AUTH-09 | T3, T9 |
