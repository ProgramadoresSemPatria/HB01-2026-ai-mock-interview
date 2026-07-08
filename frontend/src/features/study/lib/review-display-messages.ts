export type ReviewDisplayMessage =
  | { id: string; kind: "topic"; topic: string; itemIndex: number }
  | { id: string; kind: "human"; content: string; createdAt: string }
  | {
      id: string;
      kind: "ai";
      content: string;
      createdAt: string;
      streaming?: boolean;
    };

export function appendHumanMessage(
  messages: ReviewDisplayMessage[],
  content: string,
): ReviewDisplayMessage[] {
  return [
    ...messages,
    {
      id: crypto.randomUUID(),
      kind: "human",
      content,
      createdAt: new Date().toISOString(),
    },
  ];
}

export function appendAiMessage(
  messages: ReviewDisplayMessage[],
  content: string,
  options?: { streaming?: boolean },
): ReviewDisplayMessage[] {
  return [
    ...messages,
    {
      id: crypto.randomUUID(),
      kind: "ai",
      content,
      createdAt: new Date().toISOString(),
      ...(options?.streaming ? { streaming: true } : {}),
    },
  ];
}

export function appendTopicDivider(
  messages: ReviewDisplayMessage[],
  topic: string,
  itemIndex: number,
): ReviewDisplayMessage[] {
  return [
    ...messages,
    {
      id: crypto.randomUUID(),
      kind: "topic",
      topic,
      itemIndex,
    },
  ];
}
