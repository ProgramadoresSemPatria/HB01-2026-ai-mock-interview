"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Download } from "lucide-react";

import { StepList, useInstallSteps } from "@/components/download/install-steps";
import { usePwaInstall } from "@/features/pwa/use-pwa-install";
import { ComingSoonBadge } from "@/components/coming-soon-badge";
import { ComingSoonDialog } from "@/components/coming-soon-dialog";
import { useSiteLocale } from "@/features/site-locale/site-locale-provider";

const PILL =
  "manrope inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-normal transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-jade/30 focus-visible:ring-offset-2";
const SOLID = `${PILL} cursor-pointer border border-jade bg-jade text-paper-white`;
const OUTLINE = `${PILL} cursor-pointer border border-ink-black bg-transparent text-ink-black`;

type InstallCtaProps = {
  align?: "start" | "center";
  /** Show the inline iOS / Android guide when there is no native prompt. */
  showGuide?: boolean;
};

export default function InstallCta({
  align = "start",
  showGuide = true,
}: InstallCtaProps) {
  const install = usePwaInstall();
  const { t } = useSiteLocale();
  const copy = t.download.installCta;
  const steps = useInstallSteps();
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  const alignClass =
    align === "center" ? "items-center text-center" : "items-start text-left";
  const rowClass = align === "center" ? "justify-center" : "justify-start";

  // Already running as an installed app.
  if (install.isInstalled) {
    return (
      <div className={`flex flex-col gap-3 ${alignClass}`} aria-live="polite">
        <p className="manrope inline-flex items-center gap-2 text-sm text-jade-deep">
          <Check size={16} strokeWidth={2} aria-hidden />
          {copy.installed}
        </p>
        <div className={`flex flex-wrap gap-3 ${rowClass}`}>
          <Link href="/dashboard" className={SOLID}>
            {copy.openHone}
            <ArrowRight size={18} strokeWidth={1.75} aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  // iPhone / iPad in Safari: guide them through Add to Home Screen.
  if (install.platform === "ios" && install.isIOSSafari) {
    return (
      <div className={`flex w-full flex-col gap-4 ${alignClass}`}>
        {showGuide ? (
          <GuideCard label={copy.iosGuide}>
            <StepList steps={steps.ios} compact />
          </GuideCard>
        ) : (
          <div className={`flex flex-wrap gap-3 ${rowClass}`}>
            <a href="#install" className={SOLID}>
              <Download size={18} strokeWidth={1.75} aria-hidden />
              {copy.addToHomeScreen}
            </a>
          </div>
        )}
      </div>
    );
  }

  // iOS outside Safari (Chrome, in-app browsers…): send them to Safari.
  if (install.platform === "ios") {
    return (
      <div className={`flex w-full flex-col gap-4 ${alignClass}`}>
        <GuideCard label={copy.safariGuide}>
          <p className="manrope text-[15px] leading-snug text-ink-black">
            {copy.safariBody}
          </p>
          <p className="manrope mt-2 text-[13px] leading-snug text-slate-gray">
            {copy.safariNote}
          </p>
          <div className="mt-4">
            <CopyLinkButton />
          </div>
        </GuideCard>
      </div>
    );
  }

  // Android without a native prompt (prompt not ready yet, or other browser).
  if (install.platform === "android" && !install.canPrompt && showGuide) {
    return (
      <div className={`flex w-full flex-col gap-4 ${alignClass}`}>
        <GuideCard label={copy.androidGuide}>
          <StepList steps={steps.android} compact />
        </GuideCard>
      </div>
    );
  }

  // Chromium with a native prompt, desktop, or environment not read yet
  // (SSR / no JS). The app is still in development, so "Install Hone" opens
  // the coming-soon dialog instead of `install.promptInstall()`; the hook and
  // the beforeinstallprompt store stay in place to re-enable it at launch.
  return (
    <div className={`flex flex-col gap-3 ${alignClass}`}>
      <div className={`flex flex-wrap gap-3 ${rowClass}`}>
        <button
          type="button"
          className={SOLID}
          aria-haspopup="dialog"
          onClick={() => setComingSoonOpen(true)}
        >
          <Download size={18} strokeWidth={1.75} aria-hidden />
          {copy.installHone}
          <ComingSoonBadge tone="inverse" />
        </button>
        <Link href="/login" className={OUTLINE}>
          {t.common.useInBrowser}
        </Link>
      </div>
      <p className="manrope text-[13px] text-ash-gray">{copy.fineprint}</p>
      <ComingSoonDialog
        open={comingSoonOpen}
        onOpenChange={setComingSoonOpen}
      />
    </div>
  );
}

function GuideCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { t } = useSiteLocale();
  return (
    <div className="flex w-full max-w-[420px] flex-col gap-3">
      <section
        aria-label={label}
        className="landing-artifact w-full !p-5 text-left"
      >
        <p className="landing-tag mb-4">{label}</p>
        {children}
      </section>
      <Link
        href="/login"
        className="manrope inline-flex items-center gap-1.5 self-start rounded-md px-1 text-sm text-slate-gray underline-offset-4 transition-colors hover:text-ink-black hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-jade/30"
      >
        {t.download.installCta.keepInBrowser}
        <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
      </Link>
    </div>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const { t } = useSiteLocale();
  const copy = t.download.installCta;

  return (
    <button
      type="button"
      className={`${OUTLINE} h-11 text-[15px]`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2400);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? (
        <Check size={16} strokeWidth={2} aria-hidden />
      ) : (
        <Copy size={16} strokeWidth={1.75} aria-hidden />
      )}
      <span aria-live="polite">{copied ? copy.linkCopied : copy.copyLink}</span>
    </button>
  );
}
