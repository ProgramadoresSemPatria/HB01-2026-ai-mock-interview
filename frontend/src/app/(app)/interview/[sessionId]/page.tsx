"use client";

import { use } from "react";

import { AppShell } from "@/features/dashboard/app-shell";
import { InterviewChat } from "@/features/interview/interview-chat";

export default function InterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);

  return (
    <AppShell>
      <InterviewChat sessionId={sessionId} />
    </AppShell>
  );
}
