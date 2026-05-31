import { MemorySaver } from "@langchain/langgraph";

import { describe, expect, it, vi } from "vitest";

import {
  buildInterviewGraph,
  buildInterviewGraphForTest,
  createInterviewGraphConfig,
} from "./build-interview-graph";

vi.mock("./nodes/interviewer-node", () => ({
  createInterviewerNode: () => async () => ({ messages: [] }),
}));

describe("buildInterviewGraph", () => {
  it("compiles a graph with only the interviewer LLM node", () => {
    const checkpointer = new MemorySaver();

    const graph = buildInterviewGraphForTest({ checkpointer });

    const drawable = graph.getGraph();

    const nodeIds = new Set(Object.keys(drawable.nodes));

    expect(nodeIds.has("interviewer")).toBe(true);

    expect(nodeIds.has("closing_feedback")).toBe(false);

    expect(nodeIds.has("tool_executor")).toBe(false);

    expect(typeof graph.stream).toBe("function");

    const config = createInterviewGraphConfig(
      "550e8400-e29b-41d4-a716-446655440000",
    );

    expect(config.configurable?.thread_id).toBe(
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("returns an IInterviewGraph with streamMessages", () => {
    const adapter = buildInterviewGraph(new MemorySaver());

    expect(typeof adapter.streamMessages).toBe("function");
  });
});
