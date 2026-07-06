# Job Description Personalization — Specification

## Problem Statement

Interview sessions are personalized only by résumé and level. Candidates preparing for a specific role cannot align practice questions and feedback with real job requirements.

## Goals

- [ ] JD-01: Users can optionally provide a job description when creating a session
- [ ] JD-02: Input is sanitized before persistence and prompt use
- [ ] JD-03: Interview questions are influenced by the job description
- [ ] JD-04: Agent connects candidate résumé experience to job requirements
- [ ] JD-05: Prompt injection attempts in JD are mitigated

## Requirements

| ID | Requirement |
|----|-------------|
| JD-01 | Optional `jobDescription` on `POST /api/interview/sessions` |
| JD-02 | Max 5,000 chars; sanitize at create; store sanitized value only |
| JD-03 | Inject `## Target role` block into interviewer system prompt when present |
| JD-04 | Directives to tailor questions and bridge résumé ↔ role requirements |
| JD-05 | Sanitizer + untrusted framing + delimiter fence + strengthened security block |
| JD-06 | Propagate optional JD to closing feedback and review-items prompts |
| JD-07 | `hasJobDescription` on session list; do not expose full JD text in list API |
| JD-08 | Frontend optional textarea on `/practice` and `/practice/new` |

## Acceptance Criteria

- [ ] Users can optionally provide a Job Description
- [ ] The input is sanitized before prompt generation
- [ ] Interview questions are influenced by the Job Description
- [ ] Candidate experience is connected to job requirements
- [ ] Prompt injection attempts are safely mitigated

## Out of Scope

- Editing JD after session creation
- Semantic/LLM-based input classification
- Exposing full JD text via API (v1)
