"use client";

import { useEffect, useRef } from "react";

import type { SessionMessage } from "@/types/interview";

import { InterviewMessageBubble } from "./interview-message-bubble";

const START_MESSAGE = "Hi, I'm ready for the interview!";

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
  onStart?: () => void;
};

export function InterviewMessageList({
  messages,
  showWelcome,
  onStart,
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
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <p className="text-sm text-(--muted-foreground)">
            When you're ready, click to start the interview.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="rounded-xl bg-(--primary) px-6 py-2.5 text-sm font-medium text-(--primary-foreground) cursor-pointer transition-opacity hover:opacity-90"
          >
            {START_MESSAGE}
          </button>
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
