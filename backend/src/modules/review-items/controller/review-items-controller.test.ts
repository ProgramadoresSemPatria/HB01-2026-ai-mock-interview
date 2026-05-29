import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

import type { ReviewItemsService } from "@/modules/review-items/service/review-items-service";

import { ReviewItemsController } from "./review-items-controller";

function createMockResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);

  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

describe("ReviewItemsController", () => {
  let reviewItemsService: ReviewItemsService;
  let controller: ReviewItemsController;
  let res: ReturnType<typeof createMockResponse>;
  let next: NextFunction;

  beforeEach(() => {
    reviewItemsService = {
      listForUser: vi.fn(),
    } as unknown as ReviewItemsService;

    controller = new ReviewItemsController(reviewItemsService);
    res = createMockResponse();
    next = vi.fn();
  });

  it("returns 200 with review items for authenticated user", async () => {
    const reviewItems = [
      {
        id: "review-id",
        sessionId: "session-id",
        topic: "system design",
        description: "Practice scalability",
        priority: "high" as const,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ];
    vi.mocked(reviewItemsService.listForUser).mockResolvedValue(reviewItems);

    await controller.list({ userId: 1 } as Request, res, next);

    expect(reviewItemsService.listForUser).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ reviewItems });
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards errors to next middleware", async () => {
    const error = new Error("database unavailable");
    vi.mocked(reviewItemsService.listForUser).mockRejectedValue(error);

    await controller.list({ userId: 1 } as Request, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});
