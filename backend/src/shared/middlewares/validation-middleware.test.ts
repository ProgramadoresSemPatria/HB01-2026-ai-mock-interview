import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { z } from "zod";

import { validate } from "./validation-middleware";

function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

const testSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

describe("validate", () => {
  it("calls next and assigns parsed body when validation succeeds", () => {
    const req = { body: { email: "user@example.com", name: "Jane" } } as Request;
    const res = createMockResponse();
    const next = vi.fn();

    validate(testSchema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body).toEqual({ email: "user@example.com", name: "Jane" });
  });

  it("returns 422 with treeified errors when validation fails", () => {
    const req = { body: { email: "not-an-email", name: "" } } as Request;
    const res = createMockResponse();
    const next = vi.fn();

    validate(testSchema)(req, res, next);

    const parseResult = testSchema.safeParse(req.body);
    expect(parseResult.success).toBe(false);
    const expectedErrors =
      parseResult.success === false
        ? z.treeifyError(parseResult.error)
        : undefined;

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: "Validation failed",
      errors: expectedErrors,
    });
  });
});
