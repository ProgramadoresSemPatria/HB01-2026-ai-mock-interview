"use client";

import Link from "next/link";

type LandingCtaProps = {
  href?: string;
  className?: string;
  label?: string;
  variant?: "solid" | "outline";
  /** `md` for compact chrome (navbar), `lg` for in-page calls to action. */
  size?: "md" | "lg";
};

const SIZE_CLASSES = {
  md: "h-11 px-5 text-base",
  lg: "h-12 px-7 text-[17px] md:h-14 md:px-9 md:text-lg",
} as const;

function LandingCta({
  href = "/login",
  className,
  label = "Get Started",
  variant = "solid",
  size = "md",
}: LandingCtaProps) {
  const base = `manrope inline-flex items-center justify-center rounded-[9999px] font-normal transition-opacity hover:opacity-80 ${SIZE_CLASSES[size]}`;

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
