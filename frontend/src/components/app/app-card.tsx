import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AppCardElement = "div" | "section" | "article" | "li";

type AppCardProps = HTMLAttributes<HTMLElement> & {
  variant?: "artifact" | "mist";
  as?: AppCardElement;
};

export function AppCard({
  variant = "artifact",
  as = "div",
  className,
  ...props
}: AppCardProps) {
  const Component = as;

  return (
    <Component
      className={cn(
        variant === "artifact"
          ? "rounded-(--radius-cards) bg-paper-white shadow-(--shadow-subtle)"
          : "rounded-3xl bg-mist-gray",
        className,
      )}
      {...props}
    />
  );
}
