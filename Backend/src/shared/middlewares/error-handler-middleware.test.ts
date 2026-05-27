import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { MulterError } from "multer";

import { BadRequestError, NotFoundError } from "../errors/http-errors";
import { errorHandler } from "./error-handler-middleware";

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

describe("errorHandler", () => {
  it("maps HttpError to its status code and message", () => {
    const res = createMockResponse();
    const next = vi.fn();

    errorHandler(new NotFoundError("Resume not found"), {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Resume not found" });
  });

  it("maps Multer LIMIT_FILE_SIZE to 400 Bad Request", () => {
    const res = createMockResponse();
    const next = vi.fn();
    const err = new MulterError("LIMIT_FILE_SIZE");

    errorHandler(err, {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "PDF file exceeds maximum allowed size",
    });
  });

  it("maps other Multer errors to 400 with the multer message", () => {
    const res = createMockResponse();
    const next = vi.fn();
    const err = new MulterError("LIMIT_UNEXPECTED_FILE", "file");

    errorHandler(err, {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: err.message });
  });

  it("returns 500 for unknown errors", () => {
    const res = createMockResponse();
    const next = vi.fn();

    errorHandler(new Error("boom"), {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error" });
  });

  it("passes through BadRequestError from application code", () => {
    const res = createMockResponse();
    const next = vi.fn();

    errorHandler(
      new BadRequestError("Only PDF files are allowed"),
      {} as Request,
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Only PDF files are allowed",
    });
  });
});
