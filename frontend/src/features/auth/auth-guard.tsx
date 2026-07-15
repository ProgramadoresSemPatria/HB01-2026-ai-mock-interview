"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "./session-provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated, router]);

  if (!isReady) {
    return (
      <div
        className="app-canvas manrope flex h-dvh items-center justify-center bg-paper-white text-sm text-text-base"
        role="status"
        aria-live="polite"
      >
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
