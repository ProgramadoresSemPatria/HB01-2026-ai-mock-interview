"use client";

import { useEffect } from "react";

import { ApiError } from "@/lib/api/client";
import {
  clearLastReviewSessionId,
  getLastReviewSessionId,
} from "@/features/study/lib/review-session-storage";

import { useReviewSession } from "./use-review-session";

export function useOpenReviewSession() {
  const storedId = getLastReviewSessionId();
  const query = useReviewSession(storedId ?? undefined);

  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 404) {
      clearLastReviewSessionId();
    }
  }, [query.error]);

  const session = query.data;
  const isOpen =
    session?.status === "in_progress" || session?.status === "pending_review";

  return {
    session: isOpen ? session : null,
    isLoading: Boolean(storedId) && query.isLoading,
    clear: clearLastReviewSessionId,
  };
}
