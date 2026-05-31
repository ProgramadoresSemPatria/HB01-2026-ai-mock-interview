"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/session-provider";
import { listResumes } from "@/lib/api/resumes";

import { queryKeys } from "../keys";

export function useResumes() {
  const { getAccessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.resumes,
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("Missing auth token");
      return listResumes(token);
    },
    enabled: isAuthenticated,
    refetchInterval: (query) => {
      const resumes = query.state.data?.resumes;
      const hasProcessing = resumes?.some((r) => r.status === "processing");
      return hasProcessing ? 3000 : false;
    },
  });
}
