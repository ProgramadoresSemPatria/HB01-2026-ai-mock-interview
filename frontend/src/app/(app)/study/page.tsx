"use client";

import { AppShell } from "@/features/dashboard/app-shell";
import { StudyHubContent } from "@/features/study/study-hub-content";

export default function StudyPage() {
  return (
    <AppShell>
      <StudyHubContent />
    </AppShell>
  );
}
