"use client";

import { use } from "react";

import { AppShell } from "@/features/dashboard/app-shell";
import { ReviewSessionChat } from "@/features/study/review-session-chat";

export default function ReviewSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);

  return (
    <AppShell noPadding={true}>
      <div className="flex h-full flex-col overflow-hidden p-4 md:p-6">
        <ReviewSessionChat sessionId={sessionId} />
      </div>
    </AppShell>
  );
}
