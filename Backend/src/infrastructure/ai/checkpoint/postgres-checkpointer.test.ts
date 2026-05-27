import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSetup = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockFromConnString = vi.hoisted(() => vi.fn());

vi.mock("@langchain/langgraph-checkpoint-postgres", () => ({
  PostgresSaver: {
    fromConnString: mockFromConnString,
  },
}));

vi.mock("@/config/env", () => ({
  env: {
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/test",
  },
}));

describe("postgres-checkpointer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFromConnString.mockReturnValue({ setup: mockSetup });
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("getCheckpointer returns a singleton PostgresSaver", async () => {
    const { getCheckpointer } = await import("./postgres-checkpointer");

    const first = getCheckpointer();
    const second = getCheckpointer();

    expect(first).toBe(second);
    expect(mockFromConnString).toHaveBeenCalledTimes(1);
    expect(mockFromConnString).toHaveBeenCalledWith(
      "postgresql://postgres:postgres@localhost:5432/test",
    );
  });

  it("setup delegates to checkpointer.setup and is safe to call repeatedly", async () => {
    const { setup } = await import("./postgres-checkpointer");

    await setup();
    await setup();

    expect(mockSetup).toHaveBeenCalledTimes(2);
  });
});
