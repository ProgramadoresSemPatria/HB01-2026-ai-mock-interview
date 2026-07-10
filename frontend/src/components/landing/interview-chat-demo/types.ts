export type DemoMessageRole = "ai" | "human";

export type DemoMessage = {
  id: string;
  role: DemoMessageRole;
  content: string;
  createdAt: string;
  typing?: boolean;
};

export type SessionMeta = {
  level: string;
  role: string;
  company: string;
  difficulty: string;
  duration: string;
  focusAreas: string;
};

export type ContextState = "idle" | "typing" | "complete";

export type ScriptedTurn = {
  aiResponse: string;
  contextText: string;
};
