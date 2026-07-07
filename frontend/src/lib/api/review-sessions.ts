import { env } from "@/config/env";
import type {
  ApplyReviewSessionRequest,
  CreateReviewSessionResponse,
  ReviewSession,
} from "@/types/review-sessions";

import { apiRequest } from "./client";

export const reviewSessionsApi = {
  create(token: string, reviewItemIds: string[]) {
    return apiRequest<CreateReviewSessionResponse>("/api/review-sessions", {
      method: "POST",
      body: { reviewItemIds },
      token,
    });
  },

  getById(token: string, sessionId: string) {
    return apiRequest<ReviewSession>(`/api/review-sessions/${sessionId}`, {
      token,
    });
  },
};
