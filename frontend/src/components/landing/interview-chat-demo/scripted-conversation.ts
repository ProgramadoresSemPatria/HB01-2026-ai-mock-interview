import type { SiteMessages } from "@/features/site-locale/messages/en";

import type { DemoMessage, SessionMeta, ScriptedTurn } from "./types";

type DemoCopy = SiteMessages["interviewDemo"];

// Fixed timestamps for the opening messages (AI, candidate, AI).
const INITIAL_TIMESTAMPS = [
  "2026-07-10T10:28:00.000Z",
  "2026-07-10T10:29:00.000Z",
  "2026-07-10T10:30:00.000Z",
];

/** Scripted session in the current site language (copy in site-locale). */
export function buildScriptedConversation(copy: DemoCopy): {
  sessionMeta: SessionMeta;
  initialMessages: DemoMessage[];
  contextByState: DemoCopy["context"];
  scriptedTurns: ScriptedTurn[];
} {
  return {
    sessionMeta: copy.meta,
    initialMessages: copy.initialMessages.map((content, index) => ({
      id: `msg-${index + 1}`,
      role: index % 2 === 0 ? "ai" : "human",
      content,
      createdAt: INITIAL_TIMESTAMPS[index] ?? INITIAL_TIMESTAMPS[0],
    })),
    contextByState: copy.context,
    scriptedTurns: copy.turns,
  };
}

export const TYPING_DELAY_MS = 1200;
