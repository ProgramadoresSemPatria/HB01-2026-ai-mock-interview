# Quick Task 001: Closing feedback evaluates candidate only

**Date:** 2026-05-30
**Status:** Done

## Description

Fix closing interview feedback crediting the candidate for STAR examples and résumé content the interviewer provided when the user only sent minimal replies ("não sei", "teste").

## Files Changed

- `src/modules/interview/prompts/closing-feedback-prompt.ts` — candidate utterances section + evaluation guardrails
- `src/modules/interview/format/format-candidate-utterances.ts` — extract human messages for prompt
- `src/infrastructure/ai/langgraph/nodes/closing-feedback-node.ts` — pass formatted utterances
- `src/modules/interview/prompts/interviewer-system-prompt.ts` — closing phase anti-praise guardrail
- Tests for prompt and formatter

## Verification

- [x] Unit tests pass for `format-candidate-utterances` and `closing-feedback-prompt`
- [x] Prompt includes only numbered candidate lines and forbids attributing interviewer examples
- [ ] Manual: finish interview with "não sei"/"teste" only → closing feedback should note limited participation

## Commit

(pending user request)
