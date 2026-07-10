"use client";

import { useEffect, useRef } from "react";

import type { DemoMessage } from "./types";
import { InterviewChatMessage } from "./interview-chat-message";

type InterviewChatMessagesProps = {
  messages: DemoMessage[];
};

export function InterviewChatMessages({ messages }: InterviewChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="interview-chat-demo__messages space-y-5 p-4 md:p-6"
    >
      {messages.map((msg) => (
        <InterviewChatMessage
          key={msg.id}
          role={msg.role}
          content={msg.content}
          createdAt={msg.createdAt}
          isTyping={msg.typing}
        />
      ))}
    </div>
  );
}
