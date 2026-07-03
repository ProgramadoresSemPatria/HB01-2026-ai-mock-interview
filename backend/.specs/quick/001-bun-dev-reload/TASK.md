# Quick Task 001: Bun dev reload crash

**Date:** 2026-05-31
**Status:** Done

## Description

`bun run dev` uses `--hot`, which partially reloads modules. After agent/file edits, the server crashes with `TypeError: Requested module is not instantiated yet` (same stack as Bun #23575 with Express + dynamic `import()` route discovery).

## Files Changed

- `package.json` — use `--watch` instead of `--hot` for `dev` and `dev:worker`

## Verification

- [x] `bun run dev` starts successfully
- [x] Saving a source file restarts the process without the instantiation error
- [x] `bun run test` still passes (no runtime change to app code)

## Commit

(pending)
