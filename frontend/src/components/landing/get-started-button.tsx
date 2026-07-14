"use client";

import Link from "next/link";

type LandingCtaProps = {
  href?: string;
  className?: string;
  label?: string;
  variant?: "solid" | "outline";
};

function LandingCta({
  href = "/login",
  className,
  label = "Get Started",
  variant = "solid",
}: LandingCtaProps) {
  const base =
    "manrope inline-flex h-11 items-center justify-center rounded-[9999px] px-5 text-base font-normal transition-opacity hover:opacity-80";

  if (variant === "outline") {
    return (
      <Link
        href={href}
        className={`${base} border border-[var(--color-ink-black)] bg-transparent text-[var(--color-ink-black)] ${className ?? ""}`}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`${base} border border-jade bg-jade text-paper-white ${className ?? ""}`}
    >
      {label}
    </Link>
  );
}

export default LandingCta;

/** @deprecated Use LandingCta instead */
export function GetStartedButton({
  href = "/login",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <LandingCta
      href={href}
      className={className}
      label="Get Started"
      variant="solid"
    />
  );
}
