import { Bot, Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type InterviewMessageBubbleProps = {
  role: "human" | "ai";
  content: string;
  isStreaming?: boolean;
  isTyping?: boolean;
};

export function InterviewMessageBubble({
  role,
  content,
  isStreaming = false,
  isTyping = false,
}: InterviewMessageBubbleProps) {
  const isHuman = role === "human";

  return (
    <div
      className={cn(
        "flex gap-3",
        isHuman ? "justify-end" : "justify-start",
      )}
    >
      {!isHuman && (
        <div className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-(--primary)/12 text-(--primary) md:flex">
          <Bot className="size-4" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-2.5 text-sm",
          isHuman
            ? "rounded-tr-md bg-(--primary) text-(--primary-foreground)"
            : "rounded-tl-md bg-(--muted) text-(--foreground)",
        )}
      >
        {isTyping ? (
          <div className="flex items-center gap-1.5 py-0.5">
            <span className="size-2 animate-pulse rounded-full bg-(--muted-foreground)/55" />
            <span className="size-2 animate-pulse rounded-full bg-(--muted-foreground)/55 [animation-delay:150ms]" />
            <span className="size-2 animate-pulse rounded-full bg-(--muted-foreground)/55 [animation-delay:300ms]" />
          </div>
        ) : (
          <>
            {content}
            {isStreaming && (
              <Loader2 className="ml-1 inline h-3 w-3 animate-spin" />
            )}
          </>
        )}
      </div>

      {isHuman && (
        <div className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-(--foreground) text-(--background) md:flex">
          <Check className="size-4" />
        </div>
      )}
    </div>
  );
}
