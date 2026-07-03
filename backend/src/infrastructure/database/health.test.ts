import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
}));

vi.mock("./index", () => ({
  prisma: {
    $queryRaw: mocks.queryRawMock,
  },
}));

import { pingDatabase } from "./health";

describe("pingDatabase", () => {
  it("runs SELECT 1 against the database", async () => {
    mocks.queryRawMock.mockResolvedValueOnce([{ "?column?": 1 }]);

    await pingDatabase();

    expect(mocks.queryRawMock).toHaveBeenCalledOnce();
  });

  it("propagates database errors", async () => {
    mocks.queryRawMock.mockRejectedValueOnce(new Error("connection refused"));

    await expect(pingDatabase()).rejects.toThrow("connection refused");
  });
});
