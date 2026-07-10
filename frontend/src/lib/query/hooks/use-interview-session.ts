"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/session-provider";
import { interviewApi } from "@/lib/api/interview";

import { queryKeys } from "../keys";

export function useInterviewSession(sessionId: string | null) {
  const { fetchWithAuth, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const prevStatusRef = useRef<string | undefined>(undefined);

  const query = useQuery({
    queryKey: queryKeys.session(sessionId ?? ""),
    queryFn: () =>
      fetchWithAuth((token) => interviewApi.getSession(sessionId!, token)),
    enabled: isAuthenticated && Boolean(sessionId),
    refetchInterval: (q) => {
      if (q.state.data?.reviewGenerationStatus === "pending") return 3000;
      return false;
    },
  });

  useEffect(() => {
    const status = query.data?.reviewGenerationStatus;
    const prev = prevStatusRef.current;
    if (prev === "pending" && status === "ready") {
      void queryClient.invalidateQueries({ queryKey: ["review-items"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    }
    prevStatusRef.current = status;
  }, [query.data?.reviewGenerationStatus, queryClient]);

  return query;
}
