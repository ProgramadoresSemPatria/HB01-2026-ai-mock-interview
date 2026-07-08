"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/session-provider";
import { ReviewReportCard } from "@/features/study/review-report-card";
import { ApiError } from "@/lib/api/client";
import { reviewSessionsApi } from "@/lib/api/review-sessions";
import { useReviewSession } from "@/lib/query/hooks/use-review-session";
import { queryKeys } from "@/lib/query/keys";

import {
  ApplyPayloadValidationError,
  buildApplyPayload,
} from "./lib/build-apply-payload";
import { clearLastReviewSessionId } from "./lib/review-session-storage";
import {
  initReportCardState,
  updateReportCardState,
  type ReportCardState,
  type ReportCardStatePatch,
} from "./lib/report-card-state";

type ReviewSessionReportProps = {
  sessionId: string;
};

export function ReviewSessionReport({ sessionId }: ReviewSessionReportProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getAccessToken, accessToken } = useAuth();
  const sessionQuery = useReviewSession(sessionId);

  const [cards, setCards] = useState<ReportCardState[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  const appliedRef = useRef(false);
  const applyingRef = useRef(false);
  const cardsRef = useRef(cards);
  cardsRef.current = cards;

  useEffect(() => {
    const session = sessionQuery.data;
    if (!session || session.status !== "pending_review") {
      return;
    }

    setCards(session.items.map(initReportCardState));
  }, [sessionQuery.data]);

  useEffect(() => {
    const session = sessionQuery.data;
    if (!session) {
      return;
    }

    if (session.status === "pending_review") {
      return;
    }

    if (session.status === "in_progress") {
      router.replace(`/review-session/${sessionId}`);
      return;
    }

    router.replace("/study");
  }, [sessionQuery.data, sessionId, router]);

  useEffect(() => {
    if (
      sessionQuery.error instanceof ApiError &&
      sessionQuery.error.status === 404
    ) {
      toast.error("Review session not found");
      clearLastReviewSessionId();
      router.replace("/study");
    }
  }, [sessionQuery.error, router]);

  const tryKeepaliveApply = useCallback(() => {
    if (appliedRef.current || applyingRef.current) {
      return;
    }

    const token = accessToken;
    if (!token) {
      return;
    }

    try {
      const payload = buildApplyPayload(cardsRef.current);
      reviewSessionsApi.applyKeepalive(token, sessionId, payload);
    } catch {
      // Best-effort auto-apply; validation failures are ignored on leave.
    }
  }, [accessToken, sessionId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      tryKeepaliveApply();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      tryKeepaliveApply();
    };
  }, [tryKeepaliveApply]);

  const handleCardChange = (reviewSessionItemId: string, patch: ReportCardStatePatch) => {
    setCards((current) =>
      current.map((card) =>
        card.reviewSessionItemId === reviewSessionItemId
          ? updateReportCardState(card, patch)
          : card,
      ),
    );
  };

  const handleApply = async () => {
    if (appliedRef.current || applyingRef.current) {
      return;
    }

    let payload;
    try {
      payload = buildApplyPayload(cards);
    } catch (error) {
      if (error instanceof ApplyPayloadValidationError) {
        toast.error(error.message);
        return;
      }
      throw error;
    }

    const token = await getAccessToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    applyingRef.current = true;
    setIsApplying(true);

    try {
      await reviewSessionsApi.apply(token, sessionId, payload);
      appliedRef.current = true;
      toast.success("Review suggestions applied");
      clearLastReviewSessionId();
      void queryClient.invalidateQueries({ queryKey: ["review-items"] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.reviewSession(sessionId),
      });
      router.push("/study");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to apply review suggestions",
      );
    } finally {
      applyingRef.current = false;
      setIsApplying(false);
    }
  };

  if (sessionQuery.isLoading || sessionQuery.data?.status !== "pending_review") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-(--muted-foreground)">
        <Loader2 className="h-5 w-5 animate-spin text-(--primary)" />
        Loading review report…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-(--foreground)">
          Review suggestions
        </h1>
        <p className="text-sm text-(--muted-foreground)">
          Adjust each topic if needed, then apply your choices to update your
          study list.
        </p>
      </div>

      <div className="space-y-4">
        {cards.map((card) => (
          <ReviewReportCard
            key={card.reviewSessionItemId}
            card={card}
            onChange={(patch) => handleCardChange(card.reviewSessionItemId, patch)}
          />
        ))}
      </div>

      <div className="sticky bottom-0 -mx-4 border-t border-(--border) bg-(--background) px-4 py-3 md:-mx-6 md:px-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={isApplying || cards.length === 0}
            aria-busy={isApplying}
            className="cursor-pointer flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-lg bg-(--foreground) px-4 py-2.5 text-sm font-medium text-(--background) disabled:pointer-events-none disabled:opacity-50"
          >
            {isApplying ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Applying…
              </>
            ) : (
              "Apply"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
