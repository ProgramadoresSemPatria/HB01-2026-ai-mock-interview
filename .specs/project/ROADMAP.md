# Roadmap

| Priority | Feature | Status | Spec |
|----------|---------|--------|------|
| P1 | AI Mock Interview (backend) | Specified | [spec.md](../features/ai-mock-interview/spec.md) |
| P2 | AI Mock Interview (frontend) | Pending | — |
| P2 | Interview Human Feedback (frontend integration) | Specified | [spec.md](../../frontend/.specs/features/interview-human-feedback/spec.md) |

## Milestones

### M1 — Backend Foundation
- [ ] Data model (resumes, interview_sessions, interview_messages, review_items)
- [ ] R2 + BullMQ + Redis infrastructure
- [ ] Resume upload & async processing

### M2 — Interview Core
- [ ] LangGraph agent with PostgresSaver
- [ ] SSE streaming endpoint
- [ ] Turn control & session finalization

### M3 — Feedback Loop
- [ ] Review generator node
- [ ] Review items API (read/list)
- [ ] Conversation history endpoints

### M4 — Frontend Integration
- [ ] Resume upload UI
- [ ] Interview chat with SSE
- [ ] Review list display
