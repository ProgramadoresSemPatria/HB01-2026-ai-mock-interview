export type InterviewLevel = "entry" | "mid" | "senior";

export type SessionSummary = {
  id: string;
  resumeId: string;
  level: InterviewLevel;
  turnCount: number;
  maxTurns: number;
  isFinished: boolean;
  createdAt: string;
};

export type SessionMessage = {
  id: string;
  role: "human" | "ai";
  content: string;
  createdAt: string;
};

export type ListSessionsResponse = {
  sessions: SessionSummary[];
};

export type CreateSessionResponse = {
  id: string;
};

export type ListMessagesResponse = {
  messages: SessionMessage[];
};

export type StreamMeta = {
  turnCount: number;
  maxTurns: number;
  isFinished: boolean;
};
