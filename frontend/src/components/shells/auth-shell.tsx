import Link from "next/link";
import * as React from "react";

import { BrandMark } from "@/components/patterns/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const shellCopy = {
  signin: {
    eyebrow: "Returning candidate",
    title: "Resume where your last interview left off.",
    description:
      "Pick up your last mock session, review your backlog, and continue practicing with the same visual language as the public product.",
    points: [
      "Track strengths across system design and coding rounds.",
      "Keep interview history, resume analysis, and review loops in one place.",
      "Auth wiring is still pending backend integration.",
    ],
  },
  signup: {
    eyebrow: "New account",
    title: "Start with a polished shell while auth is being wired.",
    description:
      "Sign in or create an account to upload your resume and start practicing.",
    points: [
      "Capture product identity before backend auth lands.",
      "Exercise shared inputs, cards, badges, and CTAs in a real route.",
      "Keep the swap between sign-up and sign-in fully local for now.",
    ],
  },
} as const;

type AuthShellProps = {
  mode: keyof typeof shellCopy;
  children: React.ReactNode;
};

function AuthShell({ mode, children }: AuthShellProps) {
  const copy = shellCopy[mode];

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 md:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(11,139,115,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(23,19,17,0.06),transparent_16%)]" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <BrandMark />
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm", shape: "pill" }),
              "text-xs uppercase tracking-[0.18em]",
            )}
          >
            Back to home
          </Link>
        </div>

        <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:items-center">
          <div>{children}</div>

          <Surface
            variant="inverse"
            radius="xl"
            padding="xl"
            className="relative overflow-hidden"
          >
            <div className="absolute -right-10 top-10 size-40 rounded-full bg-[radial-gradient(circle,rgba(95,212,189,0.28)_0%,transparent_70%)] blur-2xl" />
            <Badge tone="inverse">{copy.eyebrow}</Badge>
            <h1 className="mt-8 font-display text-4xl leading-none tracking-[-0.05em] text-text-inverse md:text-[3.2rem]">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-text-inverse-muted md:text-base">
              {copy.description}
            </p>

            <div className="mt-12 space-y-4">
              {copy.points.map((point) => (
                <div
                  key={point}
                  className="rounded-[var(--radius-card)] border border-border-inverse bg-surface-inverse-soft px-5 py-4 text-sm leading-6 text-text-inverse"
                >
                  {point}
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </main>
  );
}

export { AuthShell };
