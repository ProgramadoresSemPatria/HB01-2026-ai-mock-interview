import { MemorySaver } from "@langchain/langgraph";

import { describe, expect, it, vi } from "vitest";



import {

  buildInterviewGraph,

  buildInterviewGraphForTest,

  createInterviewGraphConfig,

  routeFromStart,

} from "./build-interview-graph";

import { createInitialInterviewState } from "./interview-state";



vi.mock("./nodes/interviewer-node", () => ({

  createInterviewerNode: () => async () => ({ messages: [] }),

}));



vi.mock("./nodes/closing-feedback-node", () => ({

  createClosingFeedbackNode: () => async () => ({ messages: [] }),

}));



describe("buildInterviewGraph", () => {

  it("compiles a graph with interviewer and closing_feedback nodes only", () => {

    const checkpointer = new MemorySaver();



    const graph = buildInterviewGraphForTest({ checkpointer });

    const drawable = graph.getGraph();



    const nodeIds = new Set(Object.keys(drawable.nodes));



    expect(nodeIds.has("interviewer")).toBe(true);

    expect(nodeIds.has("closing_feedback")).toBe(true);

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



describe("routeFromStart", () => {

  const baseState = createInitialInterviewState({

    turnCount: 0,

    maxTurns: 5,

    level: "entry",

    userId: 1,

    resumeSummary: {

      personal_info: { name: "A", title: "B" },

      skills: [],

      experiences: [],

      projects: [],

    },

  });



  it("routes to closing_feedback when runReview is true", () => {

    expect(routeFromStart({ ...baseState, runReview: true })).toBe(

      "closing_feedback",

    );

  });



  it("routes to interviewer when runReview is false", () => {

    expect(routeFromStart({ ...baseState, runReview: false })).toBe(

      "interviewer",

    );

  });

});

