import type { ReactNode } from "react";
import { EllipsisVertical, MonitorDown, Share, SquarePlus } from "lucide-react";

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

export const IOS_STEPS: InstallStep[] = [
  {
    title: (
      <>
        Tap <UiGlyph label="Share">{<Share {...ICON} />}</UiGlyph> Share
      </>
    ),
    detail: "In Safari, it sits in the toolbar at the bottom (or top on iPad).",
  },
  {
    title: (
      <>
        Choose <UiGlyph label="Add">{<SquarePlus {...ICON} />}</UiGlyph> Add to
        Home Screen
      </>
    ),
    detail: "Scroll the share sheet down if you don't see it right away.",
  },
  {
    title: "Tap Add",
    detail: "Hone lands on your home screen and opens full screen.",
  },
];

export const ANDROID_STEPS: InstallStep[] = [
  {
    title: (
      <>
        Open the{" "}
        <UiGlyph label="Menu">{<EllipsisVertical {...ICON} />}</UiGlyph> menu in
        Chrome
      </>
    ),
    detail: "Or tap the Install button on this page when it shows up.",
  },
  {
    title: "Tap Install app",
    detail: "Some versions call it Add to Home screen.",
  },
  {
    title: "Confirm Install",
    detail: "Hone appears in your app drawer and on your home screen.",
  },
];

export const DESKTOP_STEPS: InstallStep[] = [
  {
    title: "Open Hone in Chrome or Edge",
    detail: "On a Mac with Safari, use File → Add to Dock instead.",
  },
  {
    title: (
      <>
        Click <UiGlyph label="Install">{<MonitorDown {...ICON} />}</UiGlyph> in
        the address bar
      </>
    ),
    detail: "No icon? Open the browser menu and look for Install Hone.",
  },
  {
    title: "Click Install",
    detail: "Hone gets its own window, dock or taskbar icon, and shortcut.",
  },
];

export const STEPS_BY_PLATFORM: Record<PlatformKey, InstallStep[]> = {
  ios: IOS_STEPS,
  android: ANDROID_STEPS,
  desktop: DESKTOP_STEPS,
};

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
