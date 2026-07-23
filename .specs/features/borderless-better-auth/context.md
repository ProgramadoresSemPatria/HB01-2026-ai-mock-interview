# Borderless Auth via better-auth — Context

**Gathered:** 2026-07-23  
**Spec:** `.specs/features/borderless-better-auth/spec.md`  
**Status:** Ready for design

---

## Feature Boundary

Replace local JWT auth with better-auth (Next.js) that proxies email/password to Borderless `POST /api/auth/signin`. The Borderless `accessToken` is the Bearer for all Express APIs. Local signup/login/refresh/password-reset are removed. Signup/reset remain outside this app until Borderless documents them.

---

## Locked Decisions

| ID | Decision |
| -- | -------- |
| CTX-01 | **1B:** Borderless `accessToken` is the Bearer for Express (not a separate local JWT) |
| CTX-02 | **Auth completa:** Remove local signup, login, refresh, password-reset |
| CTX-03 | better-auth hosts on Next.js (`/api/auth/[...all]`) for same-origin session cookies |
| CTX-04 | Keep Prisma `User.id` Int for FKs; map Borderless string user id → `User.externalId` |
| CTX-05 | Login-only UI; no in-app signup/reset |
| CTX-06 | No local refresh; 401 → clear session → `/login` |
| CTX-07 | Borderless does **not** share `JWT_SECRET`. Express decodes Bearer JWT claims (`jwt.decode`) + checks `exp` if present; no signature verification until introspect/`me` exists |

---

## Agent Discretion

- Exact JWT claim names (`sub` vs `id`, email/name fields) — probe flexibly, prefer `sub` then `id`
- better-auth session storage for `accessToken` (additional session/account fields vs custom session plugin)
- Whether to delete `RefreshToken` Prisma model in the same migration as `externalId`

---

## Deferred Ideas

- Borderless signup / password-reset in-app when APIs exist
- Borderless refresh token flow
- httpOnly cookie passthrough of Borderless token (today: session holds token, FE sends Bearer)
