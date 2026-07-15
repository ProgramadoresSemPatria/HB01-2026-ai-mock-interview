"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/session-provider";
import { ApiError } from "@/lib/api/client";

const PASSWORD_MISMATCH_MESSAGE = "Passwords do not match.";

const authInputClassName =
  "manrope h-12 rounded-[var(--radius-inputs)] border-[var(--color-border-hairline)] bg-[var(--color-paper-white)] text-sm text-[var(--color-ink-black)] shadow-none placeholder:text-[var(--text-base)] focus-visible:border-[var(--color-jade-deep)] focus-visible:ring-[var(--color-jade-deep)] disabled:bg-[var(--color-mist-gray)] disabled:text-[var(--color-ink-black)] disabled:opacity-100";

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
  const [passwordMismatchError, setPasswordMismatchError] = useState<
    string | null
  >(null);
  const [hasValidatedPasswordMatch, setHasValidatedPasswordMatch] =
    useState(false);
  const [mismatchAnnouncementCount, setMismatchAnnouncementCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function handlePasswordChange(value: string) {
    setPassword(value);
    if (hasValidatedPasswordMatch) {
      const passwordsMatch = value === confirmPassword;
      setPasswordMismatchError(
        passwordsMatch ? null : PASSWORD_MISMATCH_MESSAGE,
      );
      if (passwordsMatch) setMismatchAnnouncementCount(0);
    }
  }

  function handleConfirmPasswordChange(value: string) {
    setConfirmPassword(value);
    if (hasValidatedPasswordMatch) {
      const passwordsMatch = password === value;
      setPasswordMismatchError(
        passwordsMatch ? null : PASSWORD_MISMATCH_MESSAGE,
      );
      if (passwordsMatch) setMismatchAnnouncementCount(0);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setHasValidatedPasswordMatch(true);
      setPasswordMismatchError(PASSWORD_MISMATCH_MESSAGE);
      setMismatchAnnouncementCount((count) => count + 1);
      return;
    }
    setHasValidatedPasswordMatch(true);
    setPasswordMismatchError(null);
    setMismatchAnnouncementCount(0);
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

  const hasConfirmPasswordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
  const confirmPasswordFeedback =
    passwordMismatchError ??
    (confirmPassword.length > 0
      ? password === confirmPassword
        ? "Passwords match"
        : PASSWORD_MISMATCH_MESSAGE
      : null);

  return (
    <section
      className="landing-artifact overflow-hidden !rounded-[var(--radius-elevatedcards)] !p-0"
      aria-labelledby="signup-title"
    >
      <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <div className="grid gap-3 px-6 pb-6 pt-7 sm:px-8 sm:pt-8">
          <h1
            id="signup-title"
            ref={headingRef}
            tabIndex={-1}
            className="instrument-serif text-[2.5rem] font-normal leading-[1.05] tracking-[-0.03em] text-[var(--color-ink-black)] outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[var(--color-jade-deep)]"
          >
            Create your practice workspace
          </h1>
          <p className="manrope max-w-md text-[15px] leading-6 text-[var(--text-base)]">
            Upload your resume and start AI mock interviews.
          </p>
        </div>

        <div className="space-y-5 px-6 pb-7 sm:px-8">
          <div className="space-y-2">
            <Label
              htmlFor="signup-name"
              className="manrope text-sm font-medium text-[var(--color-ink-black)]"
            >
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
              disabled={isSubmitting}
              className={authInputClassName}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="signup-email"
              className="manrope text-sm font-medium text-[var(--color-ink-black)]"
            >
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
              disabled={isSubmitting}
              className={authInputClassName}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="signup-password"
              className="manrope text-sm font-medium text-[var(--color-ink-black)]"
            >
              Password
            </Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              disabled={isSubmitting}
              className={authInputClassName}
            />
            <p
              className={`manrope text-xs ${
                password.length === 0
                  ? "text-[var(--color-jade-deep)]"
                  : password.length < 6
                    ? "text-[var(--status-critical-foreground)]"
                    : "text-[var(--color-jade-deep)]"
              }`}
            >
              {password.length < 6
                ? `Minimum 6 characters (${password.length}/6)`
                : "Password length is valid"}
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="signup-confirm"
              className="manrope text-sm font-medium text-[var(--color-ink-black)]"
            >
              Confirm password
            </Label>
            <Input
              id="signup-confirm"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              disabled={isSubmitting}
              aria-invalid={
                Boolean(passwordMismatchError) || hasConfirmPasswordMismatch
              }
              aria-describedby={
                confirmPasswordFeedback
                  ? "signup-confirm-password-feedback"
                  : undefined
              }
              className={authInputClassName}
            />
            {confirmPasswordFeedback ? (
              <p
                id="signup-confirm-password-feedback"
                className={`manrope text-xs ${
                  password === confirmPassword
                    ? "text-[var(--color-jade-deep)]"
                    : "text-[var(--status-critical-foreground)]"
                }`}
              >
                {confirmPasswordFeedback}
              </p>
            ) : null}
          </div>
        </div>

        <p
          className="sr-only"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {mismatchAnnouncementCount > 0
            ? `Passwords do not match. Correct the confirm password field before creating your account. Validation attempt ${mismatchAnnouncementCount}.`
            : ""}
        </p>

        <p className="sr-only" role="status" aria-live="polite">
          {isSubmitting ? "Creating your account, please wait." : ""}
        </p>

        <div className="manrope flex flex-col items-stretch gap-4 border-t border-[var(--color-border-hairline)] px-6 py-6 sm:px-8">
          <Button
            type="submit"
            shape="pill"
            className="h-12 w-full border-[var(--color-jade-deep)] bg-[var(--color-jade-deep)] text-base font-normal text-[var(--color-paper-white)] shadow-none hover:border-[var(--color-ink-black)] hover:bg-[var(--color-ink-black)] focus-visible:ring-[var(--color-jade-deep)] disabled:border-[var(--color-jade-deep)] disabled:bg-[var(--color-jade-deep)] disabled:text-[var(--color-paper-white)] disabled:opacity-100"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating…" : "Create account"}
          </Button>
          <Button
            type="button"
            variant="link"
            onClick={onSwitchToSignIn}
            className="self-center text-sm font-normal text-[var(--color-ink-black)] hover:text-[var(--color-jade-deep)] focus-visible:ring-[var(--color-jade-deep)]"
          >
            Already have an account? Sign in
          </Button>
        </div>
      </form>
    </section>
  );
}
