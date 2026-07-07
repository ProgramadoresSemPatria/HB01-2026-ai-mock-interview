import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReviewRepository } from "@/modules/interview/repository/review-repository";
import type { ReviewMergeService } from "@/modules/interview/service/review-merge-service";
import type { ReviewItemRecord } from "@/modules/interview/types/review-item-record";
import type { ReviewSessionRepository } from "@/modules/review-sessions/repository/review-session-repository";
import type {
  ReviewSessionItemRecord,
  ReviewSessionRecord,
} from "@/modules/review-sessions/types/review-session-record";
import { BadRequestError, ConflictError, NotFoundError } from "@/shared";

import { ReviewSessionsService } from "./review-sessions-service";

const baseDate = new Date("2026-01-01T00:00:00.000Z");

function createReviewItem(
  overrides: Partial<
    Pick<ReviewItemRecord, "id" | "topic" | "description" | "priority">
  > = {},
): ReviewItemRecord {
  return {
    id: overrides.id ?? "review-item-1",
    userId: 1,
    sessionId: "interview-session-id",
    topic: overrides.topic ?? "system design",
    description: overrides.description ?? "Need to study sharding",
    priority: overrides.priority ?? "high",
    status: "active",
    learnedAt: null,
    createdAt: baseDate,
    updatedAt: baseDate,
  };
}

function createSessionItem(
  overrides: Partial<ReviewSessionItemRecord> = {},
): ReviewSessionItemRecord {
  return {
    id: overrides.id ?? "session-item-1",
    reviewSessionId: overrides.reviewSessionId ?? "review-session-id",
    reviewItemId: overrides.reviewItemId ?? "review-item-1",
    order: overrides.order ?? 0,
    topic: overrides.topic ?? "system design",
    description: overrides.description ?? "Need to study sharding",
    currentPriority: overrides.currentPriority ?? "high",
    turns: overrides.turns ?? [],
    pendingQuestion: overrides.pendingQuestion ?? null,
    suggestedStatus: overrides.suggestedStatus ?? null,
    suggestedPriority: overrides.suggestedPriority ?? null,
    confirmedStatus: overrides.confirmedStatus ?? null,
    confirmedPriority: overrides.confirmedPriority ?? null,
    confirmedAt: overrides.confirmedAt ?? null,
    createdAt: overrides.createdAt ?? baseDate,
  };
}

function createReviewSessionRecord(
  overrides: Partial<ReviewSessionRecord> = {},
): ReviewSessionRecord {
  return {
    id: overrides.id ?? "review-session-id",
    userId: overrides.userId ?? 1,
    status: overrides.status ?? "in_progress",
    createdAt: overrides.createdAt ?? baseDate,
    evaluatedAt: overrides.evaluatedAt ?? null,
    completedAt: overrides.completedAt ?? null,
    items: overrides.items ?? [createSessionItem()],
  };
}

describe("ReviewSessionsService", () => {
  let reviewRepository: ReviewRepository;
  let reviewSessionRepository: ReviewSessionRepository;
  let reviewMergeService: ReviewMergeService;
  let service: ReviewSessionsService;

  beforeEach(() => {
    reviewRepository = {
      findActiveByIdsAndUserId: vi.fn(),
    } as unknown as ReviewRepository;
    reviewSessionRepository = {
      create: vi.fn(),
      findByIdAndUserId: vi.fn(),
      confirmItem: vi.fn(),
      markCompletedIfAllConfirmed: vi.fn(),
    } as unknown as ReviewSessionRepository;
    reviewMergeService = {
      applyReviewSessionConfirmation: vi.fn(),
    } as unknown as ReviewMergeService;
    service = new ReviewSessionsService(
      reviewRepository,
      reviewSessionRepository,
      reviewMergeService,
    );
  });

  describe("create", () => {
    it("creates a session when all review items are active and owned", async () => {
      const itemOne = createReviewItem({
        id: "review-item-1",
        topic: "system design",
        priority: "high",
      });
      const itemTwo = createReviewItem({
        id: "review-item-2",
        topic: "rest apis",
        description: "Practice REST semantics",
        priority: "medium",
      });

      vi.mocked(reviewRepository.findActiveByIdsAndUserId).mockResolvedValue([
        itemTwo,
        itemOne,
      ]);
      vi.mocked(reviewSessionRepository.create).mockResolvedValue(
        createReviewSessionRecord({
          items: [
            createSessionItem({
              id: "session-item-1",
              reviewItemId: "review-item-1",
              topic: "system design",
              currentPriority: "high",
            }),
            createSessionItem({
              id: "session-item-2",
              reviewItemId: "review-item-2",
              order: 1,
              topic: "rest apis",
              description: "Practice REST semantics",
              currentPriority: "medium",
            }),
          ],
        }),
      );

      const result = await service.create(1, ["review-item-1", "review-item-2"]);

      expect(reviewRepository.findActiveByIdsAndUserId).toHaveBeenCalledWith(1, [
        "review-item-1",
        "review-item-2",
      ]);
      expect(reviewSessionRepository.create).toHaveBeenCalledWith(1, [
        {
          reviewItemId: "review-item-1",
          topic: "system design",
          description: "Need to study sharding",
          currentPriority: "high",
        },
        {
          reviewItemId: "review-item-2",
          topic: "rest apis",
          description: "Practice REST semantics",
          currentPriority: "medium",
        },
      ]);
      expect(result).toEqual({
        id: "review-session-id",
        status: "in_progress",
        items: [
          {
            id: "session-item-1",
            reviewItemId: "review-item-1",
            topic: "system design",
            currentPriority: "high",
          },
          {
            id: "session-item-2",
            reviewItemId: "review-item-2",
            topic: "rest apis",
            currentPriority: "medium",
          },
        ],
      });
    });

    it("throws NotFoundError and does not create a session when any id is missing, not owned, or not active", async () => {
      vi.mocked(reviewRepository.findActiveByIdsAndUserId).mockResolvedValue([
        createReviewItem({ id: "review-item-1" }),
      ]);

      await expect(
        service.create(1, ["review-item-1", "review-item-missing"]),
      ).rejects.toBeInstanceOf(NotFoundError);

      expect(reviewSessionRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("returns the report shape for an owned session", async () => {
      vi.mocked(reviewSessionRepository.findByIdAndUserId).mockResolvedValue(
        createReviewSessionRecord({
          status: "pending_review",
          items: [
            createSessionItem({
              suggestedStatus: "active",
              suggestedPriority: "medium",
            }),
          ],
        }),
      );

      const result = await service.getById(1, "review-session-id");

      expect(reviewSessionRepository.findByIdAndUserId).toHaveBeenCalledWith(
        "review-session-id",
        1,
      );
      expect(result).toEqual({
        id: "review-session-id",
        status: "pending_review",
        items: [
          {
            id: "session-item-1",
            reviewItemId: "review-item-1",
            topic: "system design",
            currentPriority: "high",
            suggestedStatus: "active",
            suggestedPriority: "medium",
            confirmedStatus: null,
            confirmedPriority: null,
          },
        ],
      });
    });

    it("throws NotFoundError when the session is missing or not owned", async () => {
      vi.mocked(reviewSessionRepository.findByIdAndUserId).mockResolvedValue(
        null,
      );

      await expect(
        service.getById(1, "missing-session-id"),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("confirmItem", () => {
    function mockPendingSessionItem(
      overrides: Partial<ReviewSessionItemRecord> = {},
    ) {
      return createSessionItem({
        suggestedStatus: "active",
        suggestedPriority: "medium",
        ...overrides,
      });
    }

    function mockUpdatedReviewItem(
      overrides: Partial<ReviewItemRecord> = {},
    ): ReviewItemRecord {
      return {
        ...createReviewItem({
          id: overrides.id,
          topic: overrides.topic,
          description: overrides.description,
          priority: overrides.priority ?? "medium",
        }),
        ...overrides,
      };
    }

    it("accept-active applies suggested values and persists confirmation", async () => {
      const sessionItem = mockPendingSessionItem();
      vi.mocked(reviewSessionRepository.findByIdAndUserId).mockResolvedValue(
        createReviewSessionRecord({
          status: "pending_review",
          items: [sessionItem],
        }),
      );
      const updatedReviewItem = mockUpdatedReviewItem({ priority: "medium" });
      vi.mocked(
        reviewMergeService.applyReviewSessionConfirmation,
      ).mockResolvedValue(updatedReviewItem);
      vi.mocked(
        reviewSessionRepository.markCompletedIfAllConfirmed,
      ).mockResolvedValue(true);

      const result = await service.confirmItem(
        1,
        "review-session-id",
        "session-item-1",
        { action: "accept" },
      );

      expect(reviewMergeService.applyReviewSessionConfirmation).toHaveBeenCalledWith(
        1,
        "review-item-1",
        { status: "active", priority: "medium" },
      );
      expect(reviewSessionRepository.confirmItem).toHaveBeenCalledWith(
        "session-item-1",
        { status: "active", priority: "medium" },
      );
      expect(
        reviewSessionRepository.markCompletedIfAllConfirmed,
      ).toHaveBeenCalledWith("review-session-id");
      expect(result).toEqual({
        id: updatedReviewItem.id,
        sessionId: updatedReviewItem.sessionId,
        topic: updatedReviewItem.topic,
        description: updatedReviewItem.description,
        priority: "medium",
        status: "active",
        learnedAt: null,
        createdAt: baseDate.toISOString(),
        updatedAt: baseDate.toISOString(),
      });
    });

    it("accept-learned applies suggested learned status", async () => {
      const learnedAt = new Date("2026-07-07T12:00:00.000Z");
      const sessionItem = mockPendingSessionItem({
        suggestedStatus: "learned",
        suggestedPriority: null,
      });
      vi.mocked(reviewSessionRepository.findByIdAndUserId).mockResolvedValue(
        createReviewSessionRecord({
          status: "pending_review",
          items: [sessionItem],
        }),
      );
      const updatedReviewItem = mockUpdatedReviewItem({
        status: "learned",
        learnedAt,
      });
      vi.mocked(
        reviewMergeService.applyReviewSessionConfirmation,
      ).mockResolvedValue(updatedReviewItem);
      vi.mocked(
        reviewSessionRepository.markCompletedIfAllConfirmed,
      ).mockResolvedValue(true);

      const result = await service.confirmItem(
        1,
        "review-session-id",
        "session-item-1",
        { action: "accept" },
      );

      expect(reviewMergeService.applyReviewSessionConfirmation).toHaveBeenCalledWith(
        1,
        "review-item-1",
        { status: "learned" },
      );
      expect(reviewSessionRepository.confirmItem).toHaveBeenCalledWith(
        "session-item-1",
        { status: "learned", priority: null },
      );
      expect(result.status).toBe("learned");
      expect(result.learnedAt).toBe(learnedAt.toISOString());
    });

    it("override-active applies body priority verbatim", async () => {
      const sessionItem = mockPendingSessionItem();
      vi.mocked(reviewSessionRepository.findByIdAndUserId).mockResolvedValue(
        createReviewSessionRecord({
          status: "pending_review",
          items: [sessionItem],
        }),
      );
      const updatedReviewItem = mockUpdatedReviewItem({ priority: "low" });
      vi.mocked(
        reviewMergeService.applyReviewSessionConfirmation,
      ).mockResolvedValue(updatedReviewItem);
      vi.mocked(
        reviewSessionRepository.markCompletedIfAllConfirmed,
      ).mockResolvedValue(false);

      await service.confirmItem(1, "review-session-id", "session-item-1", {
        action: "override",
        status: "active",
        priority: "low",
      });

      expect(reviewMergeService.applyReviewSessionConfirmation).toHaveBeenCalledWith(
        1,
        "review-item-1",
        { status: "active", priority: "low" },
      );
      expect(reviewSessionRepository.confirmItem).toHaveBeenCalledWith(
        "session-item-1",
        { status: "active", priority: "low" },
      );
    });

    it("override-learned applies learned status without priority", async () => {
      const sessionItem = mockPendingSessionItem({
        suggestedStatus: "active",
        suggestedPriority: "high",
      });
      vi.mocked(reviewSessionRepository.findByIdAndUserId).mockResolvedValue(
        createReviewSessionRecord({
          status: "pending_review",
          items: [sessionItem],
        }),
      );
      const learnedAt = new Date("2026-07-07T12:00:00.000Z");
      const updatedReviewItem = mockUpdatedReviewItem({
        status: "learned",
        learnedAt,
      });
      vi.mocked(
        reviewMergeService.applyReviewSessionConfirmation,
      ).mockResolvedValue(updatedReviewItem);
      vi.mocked(
        reviewSessionRepository.markCompletedIfAllConfirmed,
      ).mockResolvedValue(true);

      await service.confirmItem(1, "review-session-id", "session-item-1", {
        action: "override",
        status: "learned",
      });

      expect(reviewMergeService.applyReviewSessionConfirmation).toHaveBeenCalledWith(
        1,
        "review-item-1",
        { status: "learned" },
      );
      expect(reviewSessionRepository.confirmItem).toHaveBeenCalledWith(
        "session-item-1",
        { status: "learned", priority: null },
      );
    });

    it("throws BadRequestError when accepting without a suggestion", async () => {
      vi.mocked(reviewSessionRepository.findByIdAndUserId).mockResolvedValue(
        createReviewSessionRecord({
          status: "pending_review",
          items: [
            mockPendingSessionItem({
              suggestedStatus: null,
              suggestedPriority: null,
            }),
          ],
        }),
      );

      await expect(
        service.confirmItem(1, "review-session-id", "session-item-1", {
          action: "accept",
        }),
      ).rejects.toBeInstanceOf(BadRequestError);

      expect(
        reviewMergeService.applyReviewSessionConfirmation,
      ).not.toHaveBeenCalled();
      expect(reviewSessionRepository.confirmItem).not.toHaveBeenCalled();
    });

    it("throws ConflictError when the item is already confirmed", async () => {
      vi.mocked(reviewSessionRepository.findByIdAndUserId).mockResolvedValue(
        createReviewSessionRecord({
          status: "pending_review",
          items: [
            mockPendingSessionItem({
              confirmedStatus: "active",
              confirmedPriority: "medium",
              confirmedAt: baseDate,
            }),
          ],
        }),
      );

      await expect(
        service.confirmItem(1, "review-session-id", "session-item-1", {
          action: "accept",
        }),
      ).rejects.toBeInstanceOf(ConflictError);

      expect(
        reviewMergeService.applyReviewSessionConfirmation,
      ).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when the session item is missing or not owned", async () => {
      vi.mocked(reviewSessionRepository.findByIdAndUserId).mockResolvedValue(
        null,
      );

      await expect(
        service.confirmItem(1, "review-session-id", "missing-item-id", {
          action: "accept",
        }),
      ).rejects.toBeInstanceOf(NotFoundError);

      vi.mocked(reviewSessionRepository.findByIdAndUserId).mockResolvedValue(
        createReviewSessionRecord({
          items: [mockPendingSessionItem({ id: "other-item" })],
        }),
      );

      await expect(
        service.confirmItem(1, "review-session-id", "session-item-1", {
          action: "accept",
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("marks the session completed when confirming the last unconfirmed item", async () => {
      const firstItem = mockPendingSessionItem({
        id: "session-item-1",
        reviewItemId: "review-item-1",
        confirmedStatus: "active",
        confirmedPriority: "high",
        confirmedAt: baseDate,
      });
      const lastItem = mockPendingSessionItem({
        id: "session-item-2",
        reviewItemId: "review-item-2",
        order: 1,
        topic: "rest apis",
        suggestedStatus: "learned",
        suggestedPriority: null,
      });
      vi.mocked(reviewSessionRepository.findByIdAndUserId).mockResolvedValue(
        createReviewSessionRecord({
          status: "pending_review",
          items: [firstItem, lastItem],
        }),
      );
      vi.mocked(
        reviewMergeService.applyReviewSessionConfirmation,
      ).mockResolvedValue(
        mockUpdatedReviewItem({
          id: "review-item-2",
          status: "learned",
          learnedAt: baseDate,
        }),
      );
      vi.mocked(
        reviewSessionRepository.markCompletedIfAllConfirmed,
      ).mockResolvedValue(true);

      await service.confirmItem(1, "review-session-id", "session-item-2", {
        action: "accept",
      });

      expect(
        reviewSessionRepository.markCompletedIfAllConfirmed,
      ).toHaveBeenCalledWith("review-session-id");
    });
  });
});
