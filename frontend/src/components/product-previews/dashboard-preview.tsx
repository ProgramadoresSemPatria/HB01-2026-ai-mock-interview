import { cn } from "@/lib/utils";

const TOPIC_BARS = [
  { label: "System Design", pct: 82 },
  { label: "Algorithms", pct: 71 },
  { label: "Distributed Systems", pct: 60 },
  { label: "APIs & REST", pct: 90 },
  { label: "Data Modeling", pct: 55 },
  { label: "Scalability", pct: 67 },
];

type DashboardPreviewProps = {
  className?: string;
  labelClassName?: string;
  mutedTextClassName?: string;
};

export function DashboardPreview({
  className,
  labelClassName,
  mutedTextClassName,
}: DashboardPreviewProps) {
  return (
    <div className={cn("landing-artifact p-6", className)}>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className={cn("landing-tag", labelClassName)}>Performance score</p>
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
          <p className={cn("landing-tag", labelClassName)}>Sessions</p>
          <span className="manrope text-xl font-medium text-[var(--color-ink-black)]">
            5
          </span>
        </div>
      </div>

      <p className={cn("landing-tag mb-3", labelClassName)}>Topic coverage</p>
      <div className="space-y-2">
        {TOPIC_BARS.map((topic) => (
          <div key={topic.label}>
            <div className="mb-1 flex justify-between">
              <span className="manrope text-xs text-[var(--color-ink-black)]">
                {topic.label}
              </span>
              <span
                className={cn(
                  "manrope text-xs text-[var(--color-ash-gray)]",
                  mutedTextClassName,
                )}
              >
                {topic.pct}%
              </span>
            </div>
            <div className="h-[2px] w-full bg-[var(--color-mist-gray)]">
              <div
                className="h-full bg-jade"
                style={{ width: `${topic.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
