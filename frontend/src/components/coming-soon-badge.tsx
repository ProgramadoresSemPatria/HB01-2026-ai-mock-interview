"use client";

import { useSiteLocale } from "@/features/site-locale/site-locale-provider";

type ComingSoonBadgeProps = {
  /** `inverse` for use on top of solid jade buttons. */
  tone?: "default" | "inverse";
  className?: string;
};

/** Small pill telling visitors the installable app is not fully launched yet. */
export function ComingSoonBadge({
  tone = "default",
  className,
}: ComingSoonBadgeProps) {
  const { t } = useSiteLocale();
  const toneClass =
    tone === "inverse"
      ? "bg-white/20 text-white"
      : "bg-jade-mist text-jade-deep";

  return (
    <span
      className={`manrope inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase leading-none tracking-[0.06em] ${toneClass} ${className ?? ""}`}
    >
      {t.common.comingSoon}
    </span>
  );
}
