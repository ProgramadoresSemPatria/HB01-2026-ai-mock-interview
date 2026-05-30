import { AIMessage, AIMessageChunk } from "@langchain/core/messages";
import { describe, expect, it } from "vitest";

import {
  extractStreamTokenFromChunk,
  resolveCompletedAiMessage,
} from "./stream-message-tokens";

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
      [
        new AIMessageChunk({ content: "Hi" }),
        { langgraph_node: "interviewer" },
      ],
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

describe("resolveCompletedAiMessage", () => {
  it("returns content and id when the last message is AI", () => {
    const messages = [
      new AIMessage({ content: "Complete response", id: "msg-123" }),
    ];

    expect(resolveCompletedAiMessage(messages)).toEqual({
      content: "Complete response",
      langGraphMessageId: "msg-123",
    });
  });

  it("returns undefined when the last message is not AI", () => {
    const messages = [
      new AIMessage({ content: "Earlier" }),
      { getType: () => "human", content: "Question" } as never,
    ];

    expect(resolveCompletedAiMessage(messages)).toBeUndefined();
  });
});
