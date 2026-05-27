import { AIMessage, AIMessageChunk } from "@langchain/core/messages";
import { describe, expect, it } from "vitest";

import { extractStreamTokenFromChunk } from "./stream-message-tokens";

describe("extractStreamTokenFromChunk", () => {
  it("emits tokens only for interviewer and closing_feedback nodes", () => {
    const interviewerChunk = [
      [],
      "messages",
      [
        new AIMessageChunk({ content: "Hello" }),
        { langgraph_node: "interviewer" },
      ],
    ];
    const closingChunk = [
      [],
      "messages",
      [
        new AIMessageChunk({ content: "Obrigado" }),
        { langgraph_node: "closing_feedback" },
      ],
    ];
    const toolChunk = [
      [],
      "messages",
      [
        new AIMessageChunk({ content: "hidden" }),
        { langgraph_node: "tool_executor" },
      ],
    ];

    expect(extractStreamTokenFromChunk(interviewerChunk)).toBe("Hello");
    expect(extractStreamTokenFromChunk(closingChunk)).toBe("Obrigado");
    expect(extractStreamTokenFromChunk(toolChunk)).toBeNull();
  });

  it("supports messages tuple without namespace prefix", () => {
    const chunk = [
      "messages",
      [new AIMessage({ content: "Hi" }), { langgraph_node: "interviewer" }],
    ];

    expect(extractStreamTokenFromChunk(chunk)).toBe("Hi");
  });

  it("ignores empty content", () => {
    const chunk = [
      [],
      "messages",
      [new AIMessageChunk({ content: "" }), { langgraph_node: "interviewer" }],
    ];

    expect(extractStreamTokenFromChunk(chunk)).toBeNull();
  });
});
