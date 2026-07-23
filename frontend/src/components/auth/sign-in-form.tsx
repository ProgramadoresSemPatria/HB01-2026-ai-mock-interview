"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { BorderlessMark } from "@/components/auth/borderless-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { env } from "@/config/env";
import {
  extractErrorMessage,
  useAuth,
} from "@/features/auth/session-provider";

const authInputClassName =
  "manrope h-12 rounded-[var(--radius-inputs)] border-[var(--color-border-hairline)] bg-[var(--color-paper-white)] text-sm text-[var(--color-ink-black)] shadow-none placeholder:text-[var(--text-base)] focus-visible:border-[var(--color-jade-deep)] focus-visible:ring-[var(--color-jade-deep)] disabled:bg-[var(--color-mist-gray)] disabled:text-[var(--color-ink-black)] disabled:opacity-100";

export default function SignInForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="landing-artifact overflow-hidden !rounded-[var(--radius-elevatedcards)] !p-0"
      aria-labelledby="signin-title"
    >
      <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <div className="grid gap-3 px-6 pb-6 pt-7 sm:px-8 sm:pt-8">
          <div className="flex flex-col items-start gap-3">
            <BorderlessMark className="h-auto w-full max-w-[280px] rounded-lg object-contain" />
            <p className="manrope text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-base)]">
              Borderless account
            </p>
          </div>

          <h1
            id="signin-title"
            ref={headingRef}
            tabIndex={-1}
            className="instrument-serif text-[2.5rem] font-normal leading-[1.05] tracking-[-0.03em] text-[var(--color-ink-black)] outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[var(--color-jade-deep)]"
          >
            Sign in
          </h1>
          <p className="manrope max-w-md text-[15px] leading-6 text-[var(--text-base)]">
            Use your Borderless email and password to access Hone.
          </p>
        </div>

        <div className="space-y-5 px-6 pb-7 sm:px-8">
          <div className="space-y-2">
            <Label
              htmlFor="signin-email"
              className="manrope text-sm font-medium text-[var(--color-ink-black)]"
            >
              Email
            </Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isSubmitting}
              className={authInputClassName}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="signin-password"
              className="manrope text-sm font-medium text-[var(--color-ink-black)]"
            >
              Password
            </Label>
            <Input
              id="signin-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isSubmitting}
              className={authInputClassName}
            />
          </div>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {isSubmitting ? "Signing in, please wait." : ""}
        </p>

        <div className="manrope flex flex-col items-stretch gap-4 border-t border-[var(--color-border-hairline)] px-6 py-6 sm:px-8">
          <Button
            type="submit"
            shape="pill"
            className="h-12 w-full border-[var(--color-jade-deep)] bg-[var(--color-jade-deep)] text-base font-normal text-[var(--color-paper-white)] shadow-none hover:border-[var(--color-ink-black)] hover:bg-[var(--color-ink-black)] focus-visible:ring-[var(--color-jade-deep)] disabled:border-[var(--color-jade-deep)] disabled:bg-[var(--color-jade-deep)] disabled:text-[var(--color-paper-white)] disabled:opacity-100"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in…" : "Sign in with Borderless"}
          </Button>

          <p className="text-center text-sm text-[var(--text-base)]">
            Don&apos;t have a Borderless account?{" "}
            <a
              href={env.NEXT_PUBLIC_BORDERLESS_SIGNUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--color-jade-deep)] underline-offset-4 outline-none hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[var(--color-jade-deep)]"
            >
              Create account
            </a>
          </p>
        </div>
      </form>
    </section>
  );
}
