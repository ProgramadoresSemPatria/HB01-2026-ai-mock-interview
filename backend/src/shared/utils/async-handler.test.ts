import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

import { asyncHandler } from "./async-handler";

describe("asyncHandler", () => {
  it("does not call next with error when handler resolves", async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn();

    const handler = asyncHandler(async () => {});

    handler(req, res, next);

    await Promise.resolve();
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next with error when handler rejects", async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn();
    const error = new Error("handler failed");

    const handler = asyncHandler(async () => {
      throw error;
    });

    handler(req, res, next);

    await vi.waitFor(() => {
      expect(next).toHaveBeenCalledOnce();
    });
    expect(next).toHaveBeenCalledWith(error);
  });
});
