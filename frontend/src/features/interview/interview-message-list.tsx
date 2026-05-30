"use client";

import { useEffect, useRef } from "react";

import type { SessionMessage } from "@/types/interview";

import { InterviewMessageBubble } from "./interview-message-bubble";

const WELCOME_MESSAGE =
  "Welcome to your mock interview. When you're ready, send your first message to begin.";

export type DisplayMessage =
  | SessionMessage
  | {
      id: string;
      role: "human" | "ai";
      content: string;
      createdAt: string;
      streaming?: boolean;
      typing?: boolean;
    };

type InterviewMessageListProps = {
  messages: DisplayMessage[];
  showWelcome: boolean;
};

export function InterviewMessageList({
  messages,
  showWelcome,
}: InterviewMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-(--border) bg-(--card) p-4"
    >
      {showWelcome && (
        <div className="rounded-lg bg-(--muted)/50 px-4 py-3 text-sm text-(--muted-foreground)">
          {WELCOME_MESSAGE}
        </div>
      )}

      {messages.map((msg) => (
        <InterviewMessageBubble
          key={msg.id}
          role={msg.role}
          content={msg.content}
          isStreaming={"streaming" in msg && Boolean(msg.streaming)}
          isTyping={"typing" in msg && Boolean(msg.typing)}
        />
      ))}

      <div ref={bottomRef} aria-hidden />
    </div>
  );
}
