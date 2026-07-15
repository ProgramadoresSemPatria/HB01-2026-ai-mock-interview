import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 1 | 2 | 3;
  className?: string;
};

export function AppPageHeader({
  title,
  description,
  eyebrow,
  actions,
  headingLevel = 1,
  className,
}: AppPageHeaderProps) {
  const Heading = headingLevel === 1 ? "h1" : headingLevel === 2 ? "h2" : "h3";

  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl">
        {eyebrow && (
          <div className="mb-2 text-sm font-medium text-jade-deep">{eyebrow}</div>
        )}
        <Heading className="instrument-serif text-3xl leading-tight tracking-[-0.02em] text-ink-black text-balance sm:text-4xl">
          {title}
        </Heading>
        {description && (
          <p className="mt-2 max-w-[70ch] text-sm leading-6 text-text-base text-pretty">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
