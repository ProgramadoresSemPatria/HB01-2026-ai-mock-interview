"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/session-provider";
import { getResume } from "@/lib/api/resumes";

import { queryKeys } from "../keys";

export function useResume(resumeId: string | null) {
  const { getAccessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.resume(resumeId ?? ""),
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token || !resumeId) throw new Error("Missing auth or resume id");
      return getResume(resumeId, token);
    },
    enabled: isAuthenticated && Boolean(resumeId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "processing") return 3000;
      return false;
    },
  });
}
