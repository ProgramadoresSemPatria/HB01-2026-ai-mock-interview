"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/session-provider";
import { ApiError } from "@/lib/api/client";

export default function SignInForm({
  onSwitchToSignUp,
}: {
  onSwitchToSignUp: () => void;
}) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to sign in";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card variant="glass" radius="xl">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Sign in to continue your mock interview practice.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="signin-email" className="text-text-base">
              Email
            </Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="candidate@hone.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signin-password" className="text-text-base">
              Password
            </Label>
            <Input
              id="signin-password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </CardContent>

        <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Button
            type="submit"
            shape="pill"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in…" : "Continue"}
          </Button>
          <Button
            type="button"
            variant="link"
            onClick={onSwitchToSignUp}
            className="justify-center sm:justify-end"
          >
            Need an account? Sign up
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
