"use client";

import { cn } from "@/lib/utils";
import { useSiteLocale } from "@/features/site-locale/site-locale-provider";

// Labels come from the site-locale messages (English without a provider).
const TOPIC_PCTS = [82, 71, 60, 90, 55, 67];

type DashboardPreviewProps = {
  className?: string;
  labelClassName?: string;
  mutedTextClassName?: string;
  /** Size classes for topic rows; defaults to the compact `text-xs`. */
  rowTextClassName?: string;
};

export function DashboardPreview({
  className,
  labelClassName,
  mutedTextClassName,
  rowTextClassName = "text-xs",
}: DashboardPreviewProps) {
  const { t } = useSiteLocale();
  const copy = t.previews.dashboard;
  return (
    <div className={cn("landing-artifact p-6", className)}>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className={cn("landing-tag", labelClassName)}>{copy.performanceScore}</p>
          <span className="manrope text-[20px] font-medium text-[var(--color-ink-black)]">
            73
            <span
              className={cn(
                "text-[var(--color-slate-gray)]",
                mutedTextClassName,
              )}
            >
              /100
            </span>
          </span>
        </div>
        <div className="text-right">
          <p className={cn("landing-tag", labelClassName)}>{copy.sessions}</p>
          <span className="manrope text-xl font-medium text-[var(--color-ink-black)]">
            5
          </span>
        </div>
      </div>

      <p className={cn("landing-tag mb-3", labelClassName)}>{copy.topicCoverage}</p>
      <div className="space-y-2">
        {TOPIC_PCTS.map((pct, index) => (
          <div key={index}>
            <div className="mb-1 flex justify-between">
              <span className={cn("manrope text-[var(--color-ink-black)]", rowTextClassName)}>
                {copy.topics[index]}
              </span>
              <span
                className={cn(
                  "manrope text-[var(--color-ash-gray)]",
                  rowTextClassName,
                  mutedTextClassName,
                )}
              >
                {pct}%
              </span>
            </div>
            <div className="h-[2px] w-full bg-[var(--color-mist-gray)]">
              <div
                className="h-full bg-jade"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
