# Hackathon 2026 — Project Vision

## Problem

Developers preparing for technical interviews lack realistic, personalized practice that reflects their actual experience and produces actionable feedback they can revisit over time.

## Solution

An AI-powered mock interview platform where authenticated users upload a resume, select a seniority level, and conduct a streamed technical interview with an AI Tech Lead. At the end, the system generates structured feedback and persists improvement topics in a personal review list.

## Goals

- Deliver a complete backend for resume ingestion, async processing, LangGraph-orchestrated interviews, and review-item persistence
- Integrate with existing JWT auth and module-based Express architecture
- Support real-time interview UX via Server-Sent Events (SSE)

## Users

- **Primary**: Software developers practicing for technical interviews
- **Secondary**: Platform operators (monitoring processing failures, storage)

## Success Metrics

- User can upload PDF → receive structured resume summary within acceptable async window
- User can complete a full interview session (entry/mid/senior turn limits) with streamed AI responses
- Finished sessions produce deduplicated review items linked to the user
- All endpoints enforce ownership via JWT `userId`

## Constraints

- Backend: TypeScript, Express 5, Bun runtime, Prisma + PostgreSQL
- Agent: LangChain JS + LangGraph JS with PostgresSaver checkpointing
- LLM: OpenAI (GPT-5 for interview, GPT-5 mini for resume extraction)
- Storage: Cloudflare R2 for PDFs; BullMQ + Redis for async jobs
- Streaming: SSE for interview responses

## Out of Scope (Project Level)

- Frontend UI implementation (separate track; API contract defined in feature specs)
- Payment, billing, or subscription tiers
- Multi-language interview support (v1: Portuguese or English TBD in implementation)
- Admin dashboard for content moderation
