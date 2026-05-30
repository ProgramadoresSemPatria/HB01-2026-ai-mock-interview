"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/session-provider";
import { interviewApi } from "@/lib/api/interview";

import { queryKeys } from "../keys";

export function useSessions() {
  const { fetchWithAuth, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.sessions,
    queryFn: () =>
      fetchWithAuth((token) => interviewApi.listSessions(token)),
    enabled: isAuthenticated,
  });
}
