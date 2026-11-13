import Image from "next/image";

import InstallCta from "@/components/download/install-cta";
import PhoneMockup from "@/components/download/phone-mockup";

// Same basePath source the PWA install banner uses for public/ assets.
const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? "";

export default function DownloadHero() {
  return (
    <section
      aria-labelledby="download-hero-title"
      className="landing-hero relative isolate overflow-hidden px-6 pb-16 pt-24 md:pb-28 md:pt-36"
    >
      <div
        className="landing-jade-wash pointer-events-none absolute inset-0"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <div className="flex flex-col items-start">
          <p className="manrope mb-6 inline-flex items-center gap-2.5 rounded-full border border-border-hairline bg-paper-white/80 py-1 pl-1 pr-3.5 text-[13px] text-slate-gray backdrop-blur">
            <Image
              src={`${BASE_PATH}/icons/icon-192.png`}
              alt=""
              width={24}
              height={24}
              unoptimized
              className="size-6 rounded-full"
            />
            Hone for iPhone, Android & desktop
          </p>

          <h1
            id="download-hero-title"
            className="instrument-serif text-[clamp(2.6rem,6.4vw,76px)] font-normal leading-[1.08] tracking-[-0.025em] text-ink-black text-balance"
          >
            Practice interviews <em className="italic">anywhere</em>
          </h1>

          <p className="manrope mt-6 max-w-[520px] text-[17px] leading-[1.45] text-slate-gray">
            Put Hone on your home screen. Resume-aware mock interviews, instant
            feedback and your study backlog — one tap away, full screen, no app
            store.
          </p>

          <div className="mt-9 w-full">
            <InstallCta align="start" />
          </div>
        </div>

        <PhoneMockup />
      </div>
    </section>
  );
}
