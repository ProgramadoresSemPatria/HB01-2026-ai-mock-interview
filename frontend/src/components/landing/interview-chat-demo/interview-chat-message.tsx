import { CheckCheck, Sparkle, User } from "lucide-react";

import { cn } from "@/lib/utils";

import type { DemoMessageRole } from "./types";

type InterviewChatMessageProps = {
  role: DemoMessageRole;
  content: string;
  createdAt: string;
  isTyping?: boolean;
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function InterviewChatMessage({
  role,
  content,
  createdAt,
  isTyping = false,
}: InterviewChatMessageProps) {
  const isHuman = role === "human";

  return (
    <div
      className={cn(
        "flex gap-3",
        isHuman ? "flex-row-reverse justify-start" : "flex-row justify-start",
      )}
    >
      {!isHuman && (
        <div
          className="hidden size-8 shrink-0 items-center justify-center border border-white/20 bg-[#1a1a1a] md:flex"
          aria-hidden
        >
          <Sparkle className="size-3.5 text-white" strokeWidth={1.5} />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] border border-white/10 bg-[#1a1a1a] p-4",
          isHuman ? "text-right" : "text-left",
        )}
      >
        <div
          className={cn(
            "mb-2 flex items-center gap-2",
            isHuman ? "justify-end" : "justify-start",
          )}
        >
          {!isHuman && (
            <Sparkle className="size-3 text-neutral-500 md:hidden" strokeWidth={1.5} />
          )}
          <span className="manrope text-[10px] font-medium uppercase tracking-widest text-neutral-500">
            {isHuman ? "Candidate" : "AI Interviewer"}
          </span>
          {isHuman && (
            <User className="size-3 text-neutral-500" strokeWidth={1.5} />
          )}
        </div>

        {isTyping ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="interview-chat-demo__typing-dot" />
            <span className="interview-chat-demo__typing-dot" />
            <span className="interview-chat-demo__typing-dot" />
          </div>
        ) : (
          <p className="manrope text-sm leading-relaxed text-white whitespace-pre-wrap">
            {content}
          </p>
        )}

        <div
          className={cn(
            "mt-3 flex items-center gap-1.5",
            isHuman ? "justify-end" : "justify-start",
          )}
        >
          <span className="manrope text-[10px] text-neutral-500">
            {formatTimestamp(createdAt)}
          </span>
          {isHuman && !isTyping && (
            <CheckCheck className="size-3 text-neutral-500" strokeWidth={1.5} />
          )}
        </div>
      </div>
    </div>
  );
}
