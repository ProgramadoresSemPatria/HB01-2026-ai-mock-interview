import { AIMessage, AIMessageChunk } from "@langchain/core/messages";

export const STREAM_TOKEN_NODE_NAMES = [
  "interviewer",
  "closing_feedback",
] as const;

export type StreamTokenNodeName = (typeof STREAM_TOKEN_NODE_NAMES)[number];

const ALLOWED_STREAM_NODES = new Set<string>(STREAM_TOKEN_NODE_NAMES);

type MessageStreamTuple = [unknown, Record<string, unknown>];

function parseMessageStreamTuple(chunk: unknown): MessageStreamTuple | null {
  if (!Array.isArray(chunk)) {
    return null;
  }

  if (
    chunk.length >= 3 &&
    chunk[1] === "messages" &&
    Array.isArray(chunk[2])
  ) {
    return chunk[2] as MessageStreamTuple;
  }

  if (
    chunk.length >= 2 &&
    chunk[0] === "messages" &&
    Array.isArray(chunk[1])
  ) {
    return chunk[1] as MessageStreamTuple;
  }

  if (chunk.length >= 1 && isStreamableAiMessage(chunk[0])) {
    return [chunk[0], {}];
  }

  return null;
}

function isStreamableAiMessage(value: unknown): value is AIMessage | AIMessageChunk {
  return AIMessage.isInstance(value) || AIMessageChunk.isInstance(value);
}

function extractMessageContent(message: AIMessage | AIMessageChunk): string | null {
  if (typeof message.content === "string" && message.content.length > 0) {
    return message.content;
  }

  return null;
}

/**
 * Parses a LangGraph `streamMode: "messages"` chunk and returns token text
 * only for allowed interview nodes (interviewer, closing_feedback).
 */
export function extractStreamTokenFromChunk(chunk: unknown): string | null {
  const tuple = parseMessageStreamTuple(chunk);
  if (!tuple) {
    return null;
  }

  const [message, metadata] = tuple;
  const nodeName = metadata.langgraph_node;

  if (typeof nodeName !== "string" || !ALLOWED_STREAM_NODES.has(nodeName)) {
    return null;
  }

  if (!isStreamableAiMessage(message)) {
    return null;
  }

  return extractMessageContent(message);
}
