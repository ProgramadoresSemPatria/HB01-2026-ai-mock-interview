"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Laptop, Smartphone, TabletSmartphone } from "lucide-react";

import {
  StepList,
  useInstallSteps,
  type PlatformKey,
} from "@/components/download/install-steps";
import { usePwaInstall } from "@/features/pwa/use-pwa-install";
import { useSiteLocale } from "@/features/site-locale/site-locale-provider";

// Labels, hints and notes live in the site-locale messages.
const TABS: { key: PlatformKey; Icon: typeof Smartphone }[] = [
  { key: "ios", Icon: Smartphone },
  { key: "android", Icon: TabletSmartphone },
  { key: "desktop", Icon: Laptop },
];

export default function PlatformTabs() {
  const { platform } = usePwaInstall();
  const [selected, setSelected] = useState<PlatformKey | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { t } = useSiteLocale();
  const copy = t.download.platforms;
  const steps = useInstallSteps();

  const detected: PlatformKey | null = platform === "other" ? null : platform;
  const active: PlatformKey = selected ?? detected ?? "ios";

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = TABS.findIndex((t) => t.key === active);
    const targets: Record<string, number> = {
      ArrowRight: (index + 1) % TABS.length,
      ArrowLeft: (index - 1 + TABS.length) % TABS.length,
      Home: 0,
      End: TABS.length - 1,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setSelected(TABS[next].key);
    tabRefs.current[next]?.focus();
  }

  return (
    <section
      id="install"
      aria-labelledby="download-install-title"
      className="landing-section scroll-mt-16 bg-fog-white px-6"
    >
      <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <p className="landing-tag mb-3">{copy.eyebrow}</p>
          <h2 id="download-install-title" className="landing-heading">
            {copy.title}
          </h2>
          <p className="landing-body mt-5 max-w-md">
            {detected ? copy.introDetected : copy.intro}
          </p>
        </div>

        <div>
          <div
            role="tablist"
            aria-label={copy.tablistLabel}
            className="grid grid-cols-3 gap-1 rounded-full bg-mist-gray p-1"
            onKeyDown={onKeyDown}
          >
            {TABS.map((tab, index) => {
              const isActive = tab.key === active;
              return (
                <button
                  key={tab.key}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`install-tab-${tab.key}`}
                  aria-selected={isActive}
                  aria-controls={`install-panel-${tab.key}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setSelected(tab.key)}
                  className={`manrope flex min-h-11 items-center justify-center gap-2 rounded-full px-2 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-jade/30 sm:text-[15px] ${
                    isActive
                      ? "bg-paper-white font-medium text-ink-black shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                      : "text-slate-gray hover:text-ink-black"
                  }`}
                >
                  <tab.Icon
                    size={16}
                    strokeWidth={1.75}
                    className="hidden shrink-0 sm:block"
                    aria-hidden
                  />
                  <span className="truncate">{copy.tabs[tab.key].label}</span>
                </button>
              );
            })}
          </div>

          {TABS.map((tab) => (
            <div
              key={tab.key}
              role="tabpanel"
              id={`install-panel-${tab.key}`}
              aria-labelledby={`install-tab-${tab.key}`}
              hidden={tab.key !== active}
              tabIndex={0}
              className="landing-artifact mt-5 !p-6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-jade/30 md:!p-8"
            >
              <p className="landing-tag mb-6">
                {copy.tabs[tab.key].label} · {copy.tabs[tab.key].hint}
              </p>
              <StepList steps={steps[tab.key]} />
              <p className="manrope mt-7 border-t border-border-hairline pt-5 text-[13px] leading-relaxed text-slate-gray">
                {copy.tabs[tab.key].note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
