"use client";

import { use } from "react";

import { AppShell } from "@/features/dashboard/app-shell";
import { ReviewSessionReport } from "@/features/study/review-session-report";

export default function ReviewSessionReportPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);

  return (
    <AppShell>
      <ReviewSessionReport sessionId={sessionId} />
    </AppShell>
  );
}
