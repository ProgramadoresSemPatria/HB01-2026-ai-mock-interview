import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppEmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  headingLevel?: 1 | 2 | 3;
  compact?: boolean;
  className?: string;
};

export function AppEmptyState({
  title,
  description,
  icon,
  action,
  headingLevel = 2,
  compact = false,
  className,
}: AppEmptyStateProps) {
  const Heading =
    headingLevel === 1 ? "h1" : headingLevel === 2 ? "h2" : "h3";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-12",
        className,
      )}
    >
      {icon && (
        <div
          className="flex size-12 items-center justify-center rounded-full bg-jade-mist text-jade-deep"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <div className="max-w-md">
        <Heading className="text-base font-semibold text-ink-black">{title}</Heading>
        {description && (
          <p className="mt-1.5 text-sm leading-6 text-text-base text-pretty">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
