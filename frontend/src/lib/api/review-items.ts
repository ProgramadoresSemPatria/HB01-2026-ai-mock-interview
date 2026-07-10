import type {
  ListReviewItemsResponse,
  ReviewItem,
  ReviewItemStatus,
  ReviewItemsStatusFilter,
} from "@/types/review-items";

import { apiRequest } from "./client";

export const reviewItemsApi = {
  list(token: string, status?: ReviewItemsStatusFilter) {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiRequest<ListReviewItemsResponse>(`/api/review-items${query}`, {
      token,
    });
  },

  patchStatus(token: string, id: string, status: ReviewItemStatus) {
    return apiRequest<ReviewItem>(`/api/review-items/${id}`, {
      method: "PATCH",
      body: { status },
      token,
    });
  },

  delete(token: string, id: string) {
    return apiRequest<void>(`/api/review-items/${id}`, {
      method: "DELETE",
      token,
    });
  },
};
