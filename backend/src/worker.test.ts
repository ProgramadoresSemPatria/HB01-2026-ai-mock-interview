import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/shared";

vi.mock("@/infrastructure/queue/resume-queue", () => ({
  RESUME_QUEUE_NAME: "resume-processing",
  redisConnection: {},
}));

vi.mock("@/factories/resumes/resume-service-factory", () => ({
  makeResumeService: vi.fn(() => ({ process: vi.fn() })),
}));

vi.mock("bullmq", () => ({
  Worker: vi.fn().mockImplementation(() => ({ on: vi.fn() })),
}));

import {
  logResumeJobResult,
  processResumeJob,
} from "./worker";

describe("processResumeJob", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("delegates to resumeService.process and returns the result", async () => {
    const ready = { status: "ready" as const, resumeId: "resume-1" };
    const process = vi.fn().mockResolvedValue(ready);

    const result = await processResumeJob("resume-1", { process });

    expect(process).toHaveBeenCalledWith("resume-1");
    expect(result).toEqual(ready);
  });
});

describe("logResumeJobResult", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs info when processing succeeds", () => {
    const infoSpy = vi.spyOn(logger, "info");

    logResumeJobResult("job-1", {
      status: "ready",
      resumeId: "resume-1",
    });

    expect(infoSpy).toHaveBeenCalledWith(
      "Resume job job-1 succeeded (resume resume-1)",
    );
  });

  it("logs error with stack meta when processing fails", () => {
    const errorSpy = vi.spyOn(logger, "error");
    const cause = new Error("parse failed");

    logResumeJobResult("job-2", {
      status: "failed",
      resumeId: "resume-2",
      error: "parse failed",
      cause,
    });

    expect(errorSpy).toHaveBeenCalledWith(
      "Resume job job-2 failed (resume resume-2): parse failed",
      {
        resumeId: "resume-2",
        error: "parse failed",
        stack: cause.stack,
      },
    );
  });

  it("logs warn when resume was skipped (not found)", () => {
    const warnSpy = vi.spyOn(logger, "warn");

    logResumeJobResult("job-3", {
      status: "skipped",
      resumeId: "resume-3",
      reason: "not_found",
    });

    expect(warnSpy).toHaveBeenCalledWith(
      "Resume job job-3 skipped: resume resume-3 not found",
    );
  });
});
