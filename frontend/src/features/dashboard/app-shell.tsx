"use client";

import { AppSidebar } from "./app-sidebar";

export function AppShell({
  children,
  header,
  noPadding = false,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-(--background) font-sans">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {header}
        <main className={`flex-1 ${noPadding ? "overflow-hidden" : "overflow-y-auto px-6 py-6"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
