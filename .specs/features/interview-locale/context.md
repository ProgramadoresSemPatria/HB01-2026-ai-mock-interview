# Interview Locale — Context

**Gathered:** 2026-07-09  
**Spec:** `.specs/features/interview-locale/spec.md`  
**Status:** Ready for execute (tasks drafted)  
**Source:** Grill-me session (decisions locked before Specify)

---

## Feature Boundary

Add EN/PT control for **LLM-generated interview and study content** only. Persist preference on `User.interviewLocale`, pass allowlisted locale on create/stream bodies, append language instructions at the end of relevant system prompts via a server-side const map, and record the locale each session **finished** with for metrics. App UI i18n is out of scope.

---

## Implementation Decisions

### Persistence of preference

- Preference lives on **`User`**, not only on the session (grill decision B)
- Field name: **`interviewLocale`** — descriptive; reserved for interview/study LLM content, not future app UI locale
- Enum Prisma + Zod: `en` | `pt`; column **nullable** until first bootstrap
- No DB table of languages; **const map in code** `Record<InterviewLocale, string>` for prompt instructions (anti-injection)

### Selector UX and when preference is written

- Global selector on **`/practice` and `/study`** that PATCHes preference immediately (grill decision A for selector placement)
- Dedicated endpoint: **`PATCH /api/users/me/interview-locale`** (not a generic catch-all profile PATCH for v1)
- Login/signup **return** `interviewLocale` on the user object; no write on auth
- Bootstrap (**lazy, grill 6B**): only when preference is `null` and user opens `/practice` or `/study` — map `navigator.language` → `en`/`pt`, else **`en`**, then PATCH once
- Changing locale mid-session is **allowed**; PATCH does **not** return 409

### Prompt language source of truth (no per-turn User read)

- Create **and** every stream body **require** `interviewLocale` (grill 8C + 12A)
- Backend validates with enum; maps to prompt text via const only
- Missing/invalid → **422** via existing `validate()` (fail closed; app not in production yet)
- Do **not** fall back to reading `User` on stream/create for prompt language

### Session metrics locale

- Column `interviewLocale` on **`InterviewSession`** and **`ReviewSession`**
- Set on **create** (initial)
- **Authoritative value** = locale at completion:
  - Interview: update on **final stream** (`isFinished`)
  - Review session: update when transitioning to **`pending_review`**
- Rationale: user may forget to switch until later in the session; what matters is the language they finished in

### Which prompts get the language block

- **Include** (language instruction **at the end** of system prompt): live interviewer, closing feedback, review-items generator, review-session question, review-session evaluation
- **Exclude**: resume extraction (preserve source language)
- Closing feedback: **headings + body + CTA** all follow locale (not body-only)

### Agent's Discretion

- Exact copy of the language instruction strings in the const map (as long as they clearly force EN or PT and sit at the end of the system prompt)
- Exact placement/visual of the EN/PT selector within `/practice` and `/study` chrome (must be visible and usable before and during sessions)
- Whether `users` module is new vs nested under `auth` for the PATCH route — follow existing Backend module conventions

---

## Specific References

- Frontend routes `/practice` and `/study` map to Backend `/api/interview`, `/api/review-items`, `/api/review-sessions`
- Today: `buildLanguageBlock()` is English-only; closing feedback is Portuguese-only — both must become locale-parameterized
- Future app UI language selector will use a **different** user field; do not overload `interviewLocale`

---

## Deferred Ideas

- App-wide UI i18n / `appLocale` (or similar) on User — separate feature
- DB-editable prompt instruction table — only if product needs runtime copy edits without deploy
- Analytics dashboard for EN vs PT session counts — metrics column enables it later
- Accept-Language header as alternate signal — rejected in favor of explicit body enum
```