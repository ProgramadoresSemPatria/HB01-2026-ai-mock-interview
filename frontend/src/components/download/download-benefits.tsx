"use client";

import {
  Maximize2,
  MonitorSmartphone,
  RefreshCw,
  Smartphone,
  Store,
  Zap,
} from "lucide-react";

import { useSiteLocale } from "@/features/site-locale/site-locale-provider";

// One icon per benefit, in the same order as the site-locale copy.
const BENEFIT_ICONS = [
  Maximize2,
  Smartphone,
  Zap,
  MonitorSmartphone,
  Store,
  RefreshCw,
];

export default function DownloadBenefits() {
  const { t } = useSiteLocale();
  const copy = t.download.benefits;
  const benefits = copy.items.map((item, index) => ({
    ...item,
    Icon: BENEFIT_ICONS[index] ?? Maximize2,
  }));
  return (
    <section
      aria-labelledby="download-benefits-title"
      className="landing-section bg-paper-white px-6"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="max-w-2xl">
          <p className="landing-tag mb-3">{copy.eyebrow}</p>
          <h2 id="download-benefits-title" className="landing-heading">
            {copy.title}
          </h2>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(({ Icon, title, body }) => (
            <li
              key={title}
              className="landing-mist-card flex gap-4 !p-5 sm:block sm:!p-7"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-white text-jade shadow-[0_1px_2px_rgba(0,0,0,0.06)] sm:h-11 sm:w-11"
                aria-hidden
              >
                <Icon size={20} strokeWidth={1.6} />
              </span>
              <div className="min-w-0">
                <h3 className="manrope pt-2 text-[17px] font-medium tracking-[-0.2px] text-ink-black sm:mt-6 sm:pt-0 sm:text-[19px]">
                  {title}
                </h3>
                <p className="manrope mt-1.5 text-[15px] leading-relaxed text-slate-gray sm:mt-2">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
