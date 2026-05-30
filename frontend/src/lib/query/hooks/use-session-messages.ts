"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/session-provider";
import { interviewApi } from "@/lib/api/interview";

import { queryKeys } from "../keys";

export function useSessionMessages(sessionId: string) {
  const { fetchWithAuth, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.sessionMessages(sessionId),
    queryFn: () =>
      fetchWithAuth((token) => interviewApi.getMessages(sessionId, token)),
    enabled: isAuthenticated && Boolean(sessionId),
  });
}
