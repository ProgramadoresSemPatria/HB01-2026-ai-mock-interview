"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/session-provider";
import { reviewItemsApi } from "@/lib/api/review-items";
import type { ReviewItemsStatusFilter } from "@/types/review-items";

import { queryKeys } from "../keys";

export function useReviewItems(status: ReviewItemsStatusFilter = "active") {
  const { fetchWithAuth, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.reviewItems(status),
    queryFn: () => fetchWithAuth((token) => reviewItemsApi.list(token, status)),
    enabled: isAuthenticated,
  });
}
