"use client";

import { ChevronDown } from "lucide-react";

import { useSiteLocale } from "@/features/site-locale/site-locale-provider";

export default function DownloadFaq() {
  const { t } = useSiteLocale();
  const copy = t.download.faq;
  return (
    <section
      aria-labelledby="download-faq-title"
      className="landing-section download-faq bg-paper-white px-6"
    >
      <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <p className="landing-tag mb-3">{copy.eyebrow}</p>
          <h2 id="download-faq-title" className="landing-heading">
            {copy.title}
          </h2>
        </div>

        <div className="border-t border-border-hairline">
          {copy.items.map(({ q, a }) => (
            <details
              key={q}
              name="download-faq"
              className="group border-b border-border-hairline"
            >
              <summary className="manrope flex cursor-pointer items-center justify-between gap-6 rounded-md py-5 text-left text-[17px] font-medium text-ink-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-jade/30">
                {q}
                <ChevronDown
                  size={20}
                  strokeWidth={1.5}
                  className="download-faq-chevron shrink-0 text-ash-gray transition-transform duration-200"
                  aria-hidden
                />
              </summary>
              <p className="manrope max-w-[60ch] pb-6 pr-8 text-[15px] leading-relaxed text-slate-gray">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
