import { env } from "@/config/env";
import type {
  ApplyReviewSessionRequest,
  CreateReviewSessionInput,
  CreateReviewSessionResponse,
  ReviewSession,
} from "@/types/review-sessions";

import { apiRequest } from "./client";

export const reviewSessionsApi = {
  create(token: string, body: CreateReviewSessionInput) {
    return apiRequest<CreateReviewSessionResponse>("/api/review-sessions", {
      method: "POST",
      body,
      token,
    });
  },

  getById(token: string, sessionId: string) {
    return apiRequest<ReviewSession>(`/api/review-sessions/${sessionId}`, {
      token,
    });
  },

  apply(token: string, sessionId: string, body: ApplyReviewSessionRequest) {
    return apiRequest<ReviewSession>(
      `/api/review-sessions/${sessionId}/apply`,
      {
        method: "POST",
        body,
        token,
      },
    );
  },

  applyKeepalive(
    token: string,
    sessionId: string,
    body: ApplyReviewSessionRequest,
  ): void {
    void fetch(
      `${env.NEXT_PUBLIC_SERVER_URL}/api/review-sessions/${sessionId}/apply`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        keepalive: true,
      },
    );
  },
};
