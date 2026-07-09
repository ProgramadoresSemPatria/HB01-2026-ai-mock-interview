export type InterviewLevel = "entry" | "mid" | "senior";

export type InterviewLocale = "en" | "pt";

export const MAX_JOB_DESCRIPTION_LENGTH = 5_000;

export type CreateSessionInput = {
  resumeId: string;
  level: InterviewLevel;
  interviewLocale: InterviewLocale;
  jobDescription?: string;
};

export type SessionSummary = {
  id: string;
  resumeId: string;
  level: InterviewLevel;
  turnCount: number;
  maxTurns: number;
  isFinished: boolean;
  hasJobDescription: boolean;
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

export type FeedbackRating = "up" | "down";

export type SubmitFeedbackInput = {
  rating: FeedbackRating;
  comment?: string;
};

export type InterviewFeedback = {
  id: string;
  sessionId: string;
  userId: number;
  rating: FeedbackRating;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
};
