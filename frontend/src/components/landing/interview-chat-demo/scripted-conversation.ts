import type { DemoMessage, SessionMeta, ScriptedTurn } from "./types";

export const SESSION_META: SessionMeta = {
  level: "Senior Level",
  role: "Backend Engineer",
  company: "Nubank",
  difficulty: "Senior",
  duration: "45 min (Mock)",
  focusAreas: "System Design, Distributed Systems, Scalability, Trade-offs",
};

export const INITIAL_MESSAGES: DemoMessage[] = [
  {
    id: "msg-1",
    role: "ai",
    content:
      "Let's start with a system design question. Imagine you're building a distributed payment ledger at Nubank scale. How would you approach the consistency versus availability trade-off when a network partition occurs between two data centers?",
    createdAt: "2026-07-10T10:28:00.000Z",
  },
  {
    id: "msg-2",
    role: "human",
    content:
      "I'd lean toward strong consistency for financial transactions using a consensus protocol like Raft or Paxos for leader election. The trade-off is higher latency during partitions, but we avoid double-spend scenarios. For read-heavy paths, I'd use follower replicas with bounded staleness.",
    createdAt: "2026-07-10T10:29:00.000Z",
  },
  {
    id: "msg-3",
    role: "ai",
    content:
      "Good framing. You mentioned leader election — how would you handle split-brain scenarios if the network partition lasts longer than your lease timeout? Walk me through your fencing strategy.",
    createdAt: "2026-07-10T10:30:00.000Z",
  },
];

export const CONTEXT_BY_STATE = {
  idle: "Analyzing candidate response for consistency versus availability trade-offs.",
  typing: "Evaluating technical depth of distributed systems answer…",
  complete: "Demo complete. Create an account to run a full personalized interview.",
} as const;

export const SCRIPTED_TURNS: ScriptedTurn[] = [
  {
    aiResponse:
      "Solid answer on fencing tokens. Now let's go deeper — if you're using a quorum-based system, what happens when you lose exactly half your nodes? How do you decide whether to accept writes?",
    contextText:
      "Probing quorum mechanics and write acceptance policies under partial failures.",
  },
  {
    aiResponse:
      "You touched on partition tolerance. In practice, how would you design your observability layer to detect and alert on split-brain before it causes data corruption? What metrics would you track?",
    contextText:
      "Assessing observability design for distributed consensus failures.",
  },
  {
    aiResponse:
      "Last question — if product asks you to relax consistency for a non-critical read path, how would you document and communicate that trade-off to stakeholders who aren't technical?",
    contextText:
      "Evaluating communication of technical trade-offs to non-technical stakeholders.",
  },
  {
    aiResponse:
      "That wraps up this demo session. You've shown strong systems thinking. Ready to practice with your own résumé and tailored questions? Create a free account to start your first real AI mock interview.",
    contextText: CONTEXT_BY_STATE.complete,
  },
];

export const TYPING_DELAY_MS = 1200;
