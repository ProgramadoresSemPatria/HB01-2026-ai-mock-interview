export const queryKeys = {
  sessions: ["interview", "sessions"] as const,
  sessionMessages: (sessionId: string) =>
    ["interview", "sessions", sessionId, "messages"] as const,
  reviewItems: ["review-items"] as const,
  resume: (id: string) => ["resumes", id] as const,
  resumes: ["resumes"] as const,
};
