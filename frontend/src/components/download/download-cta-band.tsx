"use client";

import InstallCta from "@/components/download/install-cta";
import { useSiteLocale } from "@/features/site-locale/site-locale-provider";

export default function DownloadCtaBand() {
  const { t } = useSiteLocale();
  return (
    <section
      aria-labelledby="download-cta-title"
      className="landing-section relative overflow-hidden bg-paper-white px-6"
    >
      <div
        className="landing-jade-wash pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center text-center">
        <h2 id="download-cta-title" className="landing-heading-lg max-w-3xl">
          {t.download.ctaBand.title}
        </h2>
        <p className="landing-body mt-5 max-w-lg">
          {t.download.ctaBand.body}
        </p>
        <div className="mt-10 flex w-full justify-center">
          <InstallCta align="center" showGuide={false} />
        </div>
      </div>
    </section>
  );
}
