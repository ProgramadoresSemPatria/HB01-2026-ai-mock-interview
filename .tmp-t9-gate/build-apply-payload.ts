import type { ApplyReviewSessionRequest } from "@/types/review-sessions";

import type { ReportCardState } from "./report-card-state";

export class ApplyPayloadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApplyPayloadValidationError";
  }
}

export function buildApplyPayload(
  cards: ReportCardState[],
): ApplyReviewSessionRequest {
  for (const card of cards) {
    if (card.status === "active" && card.priority === null) {
      throw new ApplyPayloadValidationError(
        `Active card "${card.topic}" is missing priority`,
      );
    }
  }

  return {
    items: cards.map((card) => ({
      reviewSessionItemId: card.reviewSessionItemId,
      status: card.status,
      ...(card.status === "active" ? { priority: card.priority! } : {}),
    })),
  };
}
