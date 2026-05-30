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

export default function SignUpForm({
  onSwitchToSignIn,
}: {
  onSwitchToSignIn: () => void;
}) {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      await signup(name, email, password, confirmPassword);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to create account";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card variant="glass" radius="xl">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Create your practice workspace</CardTitle>
          <CardDescription>
            Upload your resume and start AI mock interviews.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="signup-name" className="text-text-base">
              Name
            </Label>
            <Input
              id="signup-name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-text-base">
              Email
            </Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="candidate@hone.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password" className="text-text-base">
              Password
            </Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-confirm" className="text-text-base">
              Confirm password
            </Label>
            <Input
              id="signup-confirm"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
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
            {isSubmitting ? "Creating…" : "Create account"}
          </Button>
          <Button
            type="button"
            variant="link"
            onClick={onSwitchToSignIn}
            className="justify-center sm:justify-end"
          >
            Already have an account? Sign in
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
