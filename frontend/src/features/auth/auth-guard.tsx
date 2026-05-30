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
      <div className="flex h-screen items-center justify-center bg-(--background) text-sm text-(--muted-foreground)">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
