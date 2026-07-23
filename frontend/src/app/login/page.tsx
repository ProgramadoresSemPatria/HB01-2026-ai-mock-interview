"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import SignInForm from "@/components/auth/sign-in-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { useAuth } from "@/features/auth/session-provider";

export default function LoginPage() {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isReady, isAuthenticated, router]);

  return (
    <div className="app-canvas">
      <AuthShell mode="signin">
        <SignInForm />
      </AuthShell>
    </div>
  );
}
