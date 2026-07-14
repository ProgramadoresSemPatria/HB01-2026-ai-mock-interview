"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import { InterviewChatCompose } from "./interview-chat-compose";
import { InterviewChatMessages } from "./interview-chat-messages";
import { InterviewSessionSidebar } from "./interview-session-sidebar";
import {
  CONTEXT_BY_STATE,
  INITIAL_MESSAGES,
  SCRIPTED_TURNS,
  SESSION_META,
  TYPING_DELAY_MS,
} from "./scripted-conversation";
import type { DemoMessage } from "./types";
import "./interview-chat-demo.css";
import { useScrollPassthrough } from "./use-scroll-passthrough";

export function InterviewChatDemo() {
  const prefersReducedMotion = useReducedMotion();
  const [messages, setMessages] = useState<DemoMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [contextText, setContextText] = useState<string>(CONTEXT_BY_STATE.idle);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useScrollPassthrough(rootRef);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearPendingTimeout, [clearPendingTimeout]);

  const displayMessages: DemoMessage[] = isTyping
    ? [
        ...messages,
        {
          id: "typing",
          role: "ai",
          content: "",
          createdAt: new Date().toISOString(),
          typing: true,
        },
      ]
    : messages;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || isTyping || isComplete) return;

    const humanMessage: DemoMessage = {
      id: `human-${Date.now()}`,
      role: "human",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, humanMessage]);
    setDraft("");
    setIsTyping(true);
    setContextText(CONTEXT_BY_STATE.typing);

    const turn = SCRIPTED_TURNS[scriptIndex];
    const delay = prefersReducedMotion ? 0 : TYPING_DELAY_MS;

    clearPendingTimeout();
    timeoutRef.current = setTimeout(() => {
      if (!turn) {
        setIsTyping(false);
        setIsComplete(true);
        setContextText(CONTEXT_BY_STATE.complete);
        return;
      }

      const aiMessage: DemoMessage = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: turn.aiResponse,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
      setContextText(turn.contextText);
      setScriptIndex((prev) => prev + 1);

      if (scriptIndex + 1 >= SCRIPTED_TURNS.length) {
        setIsComplete(true);
      }
    }, delay);
  }

  return (
    <div ref={rootRef} className="interview-chat-demo">
      <div className="interview-chat-demo__layout">
        <InterviewSessionSidebar meta={SESSION_META} contextText={contextText} />

        <div className="interview-chat-demo__chat-panel">
          <InterviewChatMessages messages={displayMessages} />
          <InterviewChatCompose
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={handleSubmit}
            disabled={isTyping || isComplete}
          />
        </div>
      </div>
    </div>
  );
}
