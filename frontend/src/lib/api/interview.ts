import type {
  CreateSessionInput,
  CreateSessionResponse,
  InterviewFeedback,
  ListMessagesResponse,
  ListSessionsResponse,
  SubmitFeedbackInput,
} from "@/types/interview";

import { apiRequest } from "./client";

export const interviewApi = {
  createSession(body: CreateSessionInput, token: string) {
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

  submitFeedback(
    sessionId: string,
    body: SubmitFeedbackInput,
    token: string,
  ) {
    const payload: SubmitFeedbackInput = { rating: body.rating };
    const trimmed = body.comment?.trim();
    if (trimmed) {
      payload.comment = trimmed;
    }

    return apiRequest<InterviewFeedback>(
      `/api/interview/sessions/${sessionId}/feedback`,
      { method: "POST", body: payload, token },
    );
  },
};
