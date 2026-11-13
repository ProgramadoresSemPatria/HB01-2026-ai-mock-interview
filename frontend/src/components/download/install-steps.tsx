"use client";

import type { ReactNode } from "react";
import { EllipsisVertical, MonitorDown, Share, SquarePlus } from "lucide-react";

import { useSiteLocale } from "@/features/site-locale/site-locale-provider";

export type InstallStep = {
  title: ReactNode;
  detail: ReactNode;
};

export type PlatformKey = "ios" | "android" | "desktop";

/** Small inline glyph that mirrors the UI control the user has to tap. */
export function UiGlyph({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <span
      className="mx-0.5 inline-flex h-6 min-w-6 translate-y-[3px] items-center justify-center rounded-md border border-border-hairline bg-paper-white px-1 text-ink-black shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
      role="img"
      aria-label={label}
    >
      {children}
    </span>
  );
}

const ICON = { size: 14, strokeWidth: 1.75, "aria-hidden": true } as const;

/** Glyph shown in each step's `{icon}` slot (copy in site-locale messages). */
const STEP_ICONS: Record<PlatformKey, (ReactNode | null)[]> = {
  ios: [<Share key="share" {...ICON} />, <SquarePlus key="add" {...ICON} />, null],
  android: [<EllipsisVertical key="menu" {...ICON} />, null, null],
  desktop: [null, <MonitorDown key="install" {...ICON} />, null],
};

function renderTitle(title: string, glyphLabel: string, icon: ReactNode) {
  const [before, after] = title.split("{icon}");
  if (after === undefined || !icon) return title;
  return (
    <>
      {before}
      <UiGlyph label={glyphLabel}>{icon}</UiGlyph>
      {after}
    </>
  );
}

/** Install steps per platform in the current site language. */
export function useInstallSteps(): Record<PlatformKey, InstallStep[]> {
  const { t } = useSiteLocale();
  const build = (platform: PlatformKey): InstallStep[] =>
    t.download.steps[platform].map((step, index) => ({
      title: renderTitle(
        step.title,
        step.glyphLabel,
        STEP_ICONS[platform][index] ?? null,
      ),
      detail: step.detail,
    }));
  return {
    ios: build("ios"),
    android: build("android"),
    desktop: build("desktop"),
  };
}

export function StepList({
  steps,
  compact = false,
}: {
  steps: InstallStep[];
  compact?: boolean;
}) {
  return (
    <ol className={compact ? "space-y-3" : "space-y-5"}>
      {steps.map((step, index) => (
        <li key={index} className="flex gap-4">
          <span
            className={`manrope flex shrink-0 items-center justify-center rounded-full bg-jade-mist font-medium text-jade-deep ${
              compact ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm"
            }`}
            aria-hidden
          >
            {index + 1}
          </span>
          <div className="min-w-0 pt-0.5">
            <p
              className={`manrope font-medium text-ink-black ${
                compact ? "text-[15px] leading-snug" : "text-base leading-snug"
              }`}
            >
              {step.title}
            </p>
            <p
              className={`manrope mt-1 text-slate-gray ${
                compact ? "text-[13px] leading-snug" : "text-sm leading-relaxed"
              }`}
            >
              {step.detail}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
