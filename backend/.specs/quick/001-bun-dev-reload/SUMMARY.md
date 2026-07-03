# Quick Task 001 — Summary

## Root cause

`bun run --hot` performs partial module hot-reload. This backend loads Express routes via dynamic `import()` in `setupRoutes` and wires LangGraph/factory singletons at startup. Bun’s HMR can leave modules half-linked after file saves (especially multi-file agent edits), producing:

```
TypeError: Requested module is not instantiated yet.
```

This matches [oven-sh/bun#23575](https://github.com/oven-sh/bun/issues/23575).

## Fix

Use `bun run --watch` for `dev` and `dev:worker` so the process fully restarts on file changes instead of partial HMR.

## Verification

- Dev server started on port 3000
- Editing `src/index.ts` triggered a clean restart with no instantiation error
- Unit tests unchanged (no application logic modified)
