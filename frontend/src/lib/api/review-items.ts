import type { ListReviewItemsResponse } from "@/types/review-items";

import { apiRequest } from "./client";

export const reviewItemsApi = {
  list(token: string) {
    return apiRequest<ListReviewItemsResponse>("/api/review-items", { token });
  },
};
