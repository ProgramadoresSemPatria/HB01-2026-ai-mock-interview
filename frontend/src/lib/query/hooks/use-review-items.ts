"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/session-provider";
import { reviewItemsApi } from "@/lib/api/review-items";

import { queryKeys } from "../keys";

export function useReviewItems() {
  const { fetchWithAuth, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.reviewItems,
    queryFn: () => fetchWithAuth((token) => reviewItemsApi.list(token)),
    enabled: isAuthenticated,
  });
}
