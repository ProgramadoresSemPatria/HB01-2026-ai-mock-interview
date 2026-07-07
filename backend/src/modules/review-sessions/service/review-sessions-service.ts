import type { ReviewRepository } from "@/modules/interview/repository/review-repository";
import type { ReviewMergeService } from "@/modules/interview/service/review-merge-service";
import type { ReviewSessionConfirmation as MergeConfirmation } from "@/modules/interview/service/review-merge-service";
import type { ReviewItemRecord } from "@/modules/interview/types/review-item-record";
import type { ReviewPriority } from "@/modules/interview/validations/interview-schemas";
import type { ReviewItemResponse } from "@/modules/review-items/validations/review-items-schemas";
import type { ReviewSessionRepository } from "@/modules/review-sessions/repository/review-session-repository";
import type { ReviewSessionConfirmation } from "@/modules/review-sessions/repository/review-session-repository";
import type {
  ReviewSessionItemRecord,
  ReviewSessionRecord,
} from "@/modules/review-sessions/types/review-session-record";
import type { ConfirmReviewSessionItemInput } from "@/modules/review-sessions/validations/review-session-schemas";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/shared";
import type {
  ReviewItemStatus,
  ReviewSessionStatus,
} from "../../../../prisma/generated/client";

export type ReviewSessionSummaryItem = {
  id: string;
  reviewItemId: string;
  topic: string;
  currentPriority: ReviewPriority;
};

export type ReviewSessionSummary = {
  id: string;
  status: ReviewSessionStatus;
  items: ReviewSessionSummaryItem[];
};

export type ReviewSessionReportItem = {
  id: string;
  reviewItemId: string;
  topic: string;
  currentPriority: ReviewPriority;
  suggestedStatus: ReviewItemStatus | null;
  suggestedPriority: ReviewPriority | null;
  confirmedStatus: ReviewItemStatus | null;
  confirmedPriority: ReviewPriority | null;
};

export type ReviewSessionReport = {
  id: string;
  status: ReviewSessionStatus;
  items: ReviewSessionReportItem[];
};

function toSummaryItem(
  item: ReviewSessionItemRecord,
): ReviewSessionSummaryItem {
  return {
    id: item.id,
    reviewItemId: item.reviewItemId,
    topic: item.topic,
    currentPriority: item.currentPriority,
  };
}

function toReportItem(item: ReviewSessionItemRecord): ReviewSessionReportItem {
  return {
    id: item.id,
    reviewItemId: item.reviewItemId,
    topic: item.topic,
    currentPriority: item.currentPriority,
    suggestedStatus: item.suggestedStatus,
    suggestedPriority: item.suggestedPriority,
    confirmedStatus: item.confirmedStatus,
    confirmedPriority: item.confirmedPriority,
  };
}

function toSummary(session: ReviewSessionRecord): ReviewSessionSummary {
  return {
    id: session.id,
    status: session.status,
    items: session.items.map(toSummaryItem),
  };
}

function toReport(session: ReviewSessionRecord): ReviewSessionReport {
  return {
    id: session.id,
    status: session.status,
    items: session.items.map(toReportItem),
  };
}

function toReviewItemResponse(item: ReviewItemRecord): ReviewItemResponse {
  return {
    id: item.id,
    sessionId: item.sessionId,
    topic: item.topic,
    description: item.description,
    priority: item.priority,
    status: item.status,
    learnedAt: item.learnedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function resolveConfirmation(
  action: ConfirmReviewSessionItemInput,
  item: ReviewSessionItemRecord,
): MergeConfirmation {
  if (action.action === "accept") {
    if (item.suggestedStatus === "active") {
      return {
        status: "active",
        priority: item.suggestedPriority!,
      };
    }

    return { status: "learned" };
  }

  if (action.status === "active") {
    return { status: "active", priority: action.priority };
  }

  return { status: "learned" };
}

function toSessionItemConfirmation(
  resolved: MergeConfirmation,
): ReviewSessionConfirmation {
  if (resolved.status === "active") {
    return {
      status: "active",
      priority: resolved.priority,
    };
  }

  return { status: "learned", priority: null };
}

function buildCreateInputs(
  reviewItemIds: string[],
  matches: ReviewItemRecord[],
) {
  const matchById = new Map(matches.map((item) => [item.id, item]));

  return reviewItemIds.map((id) => {
    const item = matchById.get(id)!;
    return {
      reviewItemId: item.id,
      topic: item.topic,
      description: item.description,
      currentPriority: item.priority,
    };
  });
}

export class ReviewSessionsService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly reviewSessionRepository: ReviewSessionRepository,
    private readonly reviewMergeService: ReviewMergeService,
  ) {}

  async create(
    userId: number,
    reviewItemIds: string[],
  ): Promise<ReviewSessionSummary> {
    const matches = await this.reviewRepository.findActiveByIdsAndUserId(
      userId,
      reviewItemIds,
    );

    if (matches.length !== reviewItemIds.length) {
      throw new NotFoundError("Review item not found");
    }

    const session = await this.reviewSessionRepository.create(
      userId,
      buildCreateInputs(reviewItemIds, matches),
    );

    return toSummary(session);
  }

  async getById(
    userId: number,
    sessionId: string,
  ): Promise<ReviewSessionReport> {
    const session = await this.reviewSessionRepository.findByIdAndUserId(
      sessionId,
      userId,
    );

    if (!session) {
      throw new NotFoundError("Review session not found");
    }

    return toReport(session);
  }

  async confirmItem(
    userId: number,
    sessionId: string,
    itemId: string,
    action: ConfirmReviewSessionItemInput,
  ): Promise<ReviewItemResponse> {
    const session = await this.reviewSessionRepository.findByIdAndUserId(
      sessionId,
      userId,
    );

    if (!session) {
      throw new NotFoundError("Review session not found");
    }

    const item = session.items.find((sessionItem) => sessionItem.id === itemId);

    if (!item) {
      throw new NotFoundError("Review session item not found");
    }

    if (item.confirmedStatus !== null) {
      throw new ConflictError("Review session item already confirmed");
    }

    if (action.action === "accept" && item.suggestedStatus === null) {
      throw new BadRequestError("No suggestion to accept");
    }

    const resolved = resolveConfirmation(action, item);

    const updatedReviewItem =
      await this.reviewMergeService.applyReviewSessionConfirmation(
        userId,
        item.reviewItemId,
        resolved,
      );

    await this.reviewSessionRepository.confirmItem(
      itemId,
      toSessionItemConfirmation(resolved),
    );

    await this.reviewSessionRepository.markCompletedIfAllConfirmed(sessionId);

    return toReviewItemResponse(updatedReviewItem);
  }
}
