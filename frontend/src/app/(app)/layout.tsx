"use client";

import { AuthGuard } from "@/features/auth/auth-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-canvas">
      <AuthGuard>{children}</AuthGuard>
    </div>
  );
}
