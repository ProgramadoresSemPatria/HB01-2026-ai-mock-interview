import Link from "next/link";

import { HeroBlackHole } from "@/components/patterns/hero-black-hole";
import { SectionHeader } from "@/components/ui/section-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HeroSectionProps = {
  kicker: string;
  title: string;
  highlight: string;
  ctaHref: string;
  ctaLabel: string;
  supportingText: string;
};

function HeroSection({
  kicker,
  title,
  highlight,
  ctaHref,
  ctaLabel,
  supportingText,
}: HeroSectionProps) {
  return (
    <section
      id="product"
      className="relative flex min-h-[100svh] flex-col overflow-hidden"
    >
      <HeroBlackHole />

      <div className="pointer-events-none absolute inset-0 marketing-vignette" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-28 text-center md:pt-32">
        <SectionHeader
          align="center"
          className="max-w-4xl"
          eyebrow={
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.34em] text-white/50">
              {kicker}
            </p>
          }
          title={
            <>
              <span className="text-white">{title}</span>
              <span className="mt-3 block font-normal italic text-white/80">
                {highlight}
              </span>
            </>
          }
        />
      </div>

      <div className="relative z-10 mt-auto pb-10 md:pb-14">
        <div className="content-width text-center">
          <Link
            href={ctaHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "xl", shape: "pill" }),
              "border-white/30 bg-white px-7 text-[0.6875rem] uppercase tracking-[0.24em] text-black hover:bg-white/90",
            )}
          >
            {ctaLabel}
          </Link>
          <p className="mt-4 text-sm text-white/55">{supportingText}</p>
        </div>
      </div>
    </section>
  );
}

export { HeroSection };
