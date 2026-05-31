import type {
  CreateSessionResponse,
  InterviewLevel,
  ListMessagesResponse,
  ListSessionsResponse,
} from "@/types/interview";

import { apiRequest } from "./client";

export const interviewApi = {
  createSession(
    body: { resumeId: string; level: InterviewLevel },
    token: string,
  ) {
    return apiRequest<CreateSessionResponse>("/api/interview/sessions", {
      method: "POST",
      body,
      token,
    });
  },

  listSessions(token: string) {
    return apiRequest<ListSessionsResponse>("/api/interview/sessions", {
      token,
    });
  },

  getMessages(sessionId: string, token: string) {
    return apiRequest<ListMessagesResponse>(
      `/api/interview/sessions/${sessionId}/messages`,
      { token },
    );
  },

  deleteSession(sessionId: string, token: string) {
    return apiRequest<void>(`/api/interview/sessions/${sessionId}`, {
      method: "DELETE",
      token,
    });
  },
};
