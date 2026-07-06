"use client";

import * as React from "react";

import { MarketingNav } from "@/components/patterns/marketing-nav";

function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="marketing-cosmos dark relative min-h-screen overflow-x-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 dot-field opacity-20" />
      <MarketingNav />
      <div className="relative z-10">{children}</div>
    </main>
  );
}

export { MarketingShell };
