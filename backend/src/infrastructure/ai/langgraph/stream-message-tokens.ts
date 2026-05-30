import {
  AIMessage,
  AIMessageChunk,
  type BaseMessage,
} from "@langchain/core/messages";

export const STREAM_TOKEN_NODE_NAMES = [
  "interviewer",
  "closing_feedback",
] as const;

export type StreamTokenNodeName = (typeof STREAM_TOKEN_NODE_NAMES)[number];

const ALLOWED_STREAM_NODES = new Set<string>(STREAM_TOKEN_NODE_NAMES);

type MessageStreamTuple = [unknown, Record<string, unknown>];

function isAiMessageChunk(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    obj["lc"] === 1 &&
    obj["type"] === "constructor" &&
    Array.isArray(obj["id"]) &&
    (obj["id"] as string[]).at(-1) === "AIMessageChunk"
  );
}

function parseMessageStreamTuple(chunk: unknown): MessageStreamTuple | null {
  if (!Array.isArray(chunk)) return null;

  // Formato: ["messages", [mensagem, metadata]] — wrapper extra
  if (chunk.length >= 3 && chunk[1] === "messages" && Array.isArray(chunk[2])) {
    return chunk[2] as MessageStreamTuple;
  }

  // Formato: ["messages", [mensagem, metadata]]
  if (chunk.length >= 2 && chunk[0] === "messages" && Array.isArray(chunk[1])) {
    return chunk[1] as MessageStreamTuple;
  }

  // Formato real do LangGraph streamMode:"messages":
  // [AIMessageChunk_serializado, metadata] — corrigido aqui
  if (
    chunk.length >= 2 &&
    typeof chunk[1] === "object" &&
    chunk[1] !== null &&
    (isStreamableAiMessage(chunk[0]) || isAiMessageChunk(chunk[0]))
  ) {
    return [chunk[0], chunk[1] as Record<string, unknown>];
  }

  return null;
}

function isStreamableAiMessage(
  value: unknown,
): value is AIMessage | AIMessageChunk {
  return AIMessage.isInstance(value) || AIMessageChunk.isInstance(value);
}

function extractMessageContent(message: unknown): string | null {
  if (!message || typeof message !== "object") return null;

  const obj = message as Record<string, unknown>;

  // Instância real: message.content
  if (typeof obj["content"] === "string" && obj["content"].length > 0) {
    return obj["content"];
  }

  // Formato serializado: message.kwargs.content
  const kwargs = obj["kwargs"];
  if (
    kwargs &&
    typeof kwargs === "object" &&
    typeof (kwargs as Record<string, unknown>)["content"] === "string" &&
    ((kwargs as Record<string, unknown>)["content"] as string).length > 0
  ) {
    return (kwargs as Record<string, unknown>)["content"] as string;
  }

  return null;
}

function isChunkMessage(value: unknown): boolean {
  // Instância real de AIMessageChunk
  if (AIMessageChunk.isInstance(value)) return true;

  // Formato serializado — só passa se o último id for "AIMessageChunk"
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    obj["lc"] === 1 &&
    obj["type"] === "constructor" &&
    Array.isArray(obj["id"]) &&
    (obj["id"] as string[]).at(-1) === "AIMessageChunk" // "AIMessage" cai fora aqui
  );
}

export function extractStreamTokenFromChunk(chunk: unknown): string | null {
  const tuple = parseMessageStreamTuple(chunk);
  if (!tuple) return null;

  const [message, metadata] = tuple;
  const nodeName = metadata.langgraph_node;

  if (typeof nodeName !== "string" || !ALLOWED_STREAM_NODES.has(nodeName)) {
    return null;
  }

  if (!isChunkMessage(message)) return null; // bloqueia o AIMessage completo

  return extractMessageContent(message);
}

function extractPersistableMessageContent(message: BaseMessage): string {
  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((block) => {
        if (typeof block === "string") return block;
        if (
          block &&
          typeof block === "object" &&
          "text" in block &&
          typeof block.text === "string"
        ) {
          return block.text;
        }
        return "";
      })
      .join("");
  }

  return "";
}

export function resolveCompletedAiMessage(
  messages: BaseMessage[] | undefined,
): { content: string; langGraphMessageId?: string } | undefined {
  const aiMessage = messages?.at(-1);

  if (!aiMessage || aiMessage.getType() !== "ai") return undefined;

  const content = extractPersistableMessageContent(aiMessage);
  if (!content) return undefined;

  return {
    content,
    langGraphMessageId: aiMessage.id,
  };
}
