"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import SignInForm from "@/components/auth/sign-in-form";
import SignUpForm from "@/components/auth/sign-up-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { useAuth } from "@/features/auth/session-provider";

export default function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(false);
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isReady, isAuthenticated, router]);

  return (
    <AuthShell mode={showSignIn ? "signin" : "signup"}>
      {showSignIn ? (
        <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
      ) : (
        <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
      )}
    </AuthShell>
  );
}
