"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/session-provider";

export default function UserMenu() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <Link href="/login">
        <Button variant="outline">Sign In</Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/dashboard">
        <Button variant="outline">Dashboard</Button>
      </Link>
      <span className="hidden text-sm text-text-muted sm:inline">{user?.name}</span>
      <Button variant="ghost" size="sm" onClick={logout}>
        Sign out
      </Button>
    </div>
  );
}
