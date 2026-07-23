import Link from "next/link";
import * as React from "react";

import { BrandMark } from "@/components/auth/brand-mark";
import { DashboardPreview } from "@/components/product-previews/dashboard-preview";

const shellCopy = {
  signin: {
    eyebrow: "Borderless account required",
    title: "Sign in with Borderless to continue.",
    description:
      "Hone uses your Borderless credentials. The same email and password unlock your mock interviews, feedback, and progress.",
    points: [
      "One Borderless account for Hone and the broader platform.",
      "Pick up recent practice sessions without losing context.",
      "Review strengths and growth areas before your next round.",
    ],
  },
  signup: {
    eyebrow: "Practice built around you",
    title: "Turn your experience into better interviews.",
    description:
      "Upload your resume, practice role-relevant questions, and get clear feedback after every session.",
    points: [
      "Shape sessions around your resume and target role.",
      "See topic coverage and actionable feedback over time.",
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
    <main className="relative min-h-dvh overflow-x-hidden bg-[var(--color-paper-white)]">
      <div
        className="landing-jade-wash pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
      />

      <div className="landing-container relative z-10 flex min-h-dvh flex-col py-6 md:py-8">
        <header className="flex items-center justify-between gap-4">
          <BrandMark />
          <Link
            href="/"
            className="manrope inline-flex h-10 items-center justify-center rounded-[var(--radius-buttons)] border border-[var(--color-ink-black)] bg-transparent px-4 text-sm font-normal text-[var(--color-ink-black)] outline-none transition-[background-color,color] hover:bg-[var(--color-ink-black)] hover:text-[var(--color-paper-white)] focus-visible:ring-2 focus-visible:ring-[var(--color-jade)] focus-visible:ring-offset-2"
          >
            Back to home
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:gap-12 lg:py-12">
          <div className="mx-auto w-full max-w-[520px] lg:mx-0">{children}</div>

          <aside className="landing-jade-card relative overflow-hidden !p-6 md:!p-8 lg:!p-10">
            <div className="relative z-10">
              <p className="landing-tag !text-[var(--text-base)]">
                {copy.eyebrow}
              </p>
              <h2 className="instrument-serif mt-3 max-w-xl text-[2.25rem] font-normal leading-[1.1] tracking-[-0.03em] text-[var(--color-ink-black)] md:text-[3rem]">
                {copy.title}
              </h2>
              <p className="manrope mt-4 max-w-xl text-[15px] leading-6 text-[var(--text-base)] md:text-base">
                {copy.description}
              </p>

              <ul className="manrope mt-6 space-y-3 text-sm leading-6 text-[var(--text-base)]">
                {copy.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span
                      className="mt-[0.6rem] size-1.5 shrink-0 rounded-full bg-[var(--color-jade)]"
                      aria-hidden="true"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <DashboardPreview
                  labelClassName="!text-[var(--text-base)]"
                  mutedTextClassName="!text-[var(--text-base)]"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export { AuthShell };
