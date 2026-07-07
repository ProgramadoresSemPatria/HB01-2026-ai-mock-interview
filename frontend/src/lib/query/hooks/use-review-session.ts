"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/session-provider";
import { reviewSessionsApi } from "@/lib/api/review-sessions";

import { queryKeys } from "../keys";

export function useReviewSession(sessionId: string | undefined) {
  const { fetchWithAuth, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.reviewSession(sessionId ?? ""),
    queryFn: () =>
      fetchWithAuth((token) => reviewSessionsApi.getById(token, sessionId!)),
    enabled: isAuthenticated && Boolean(sessionId),
  });
}
