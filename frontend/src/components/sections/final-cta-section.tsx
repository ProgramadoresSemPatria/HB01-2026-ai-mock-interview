import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FinalCtaSectionProps = {
  title: string;
  highlight: string;
  ctaHref: string;
  ctaLabel: string;
};

function FinalCtaSection({
  title,
  highlight,
  ctaHref,
  ctaLabel,
}: FinalCtaSectionProps) {
  return (
    <section className="relative overflow-hidden bg-black py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 dot-field opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_16%),radial-gradient(circle_at_70%_40%,rgba(255,255,255,0.05),transparent_18%),linear-gradient(135deg,rgba(255,255,255,0.02),transparent_45%)]" />
      <div className="content-width relative z-10 text-center">
        <h2 className="font-display text-5xl leading-none tracking-[-0.06em] text-text-strong md:text-[5rem]">
          {title}
          <span className="mt-2 block font-normal italic text-white/75">
            {highlight}
          </span>
        </h2>

        <Link
          href={ctaHref}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg", shape: "pill" }),
            "mt-10 border-white/30 bg-white text-black hover:bg-white/90",
          )}
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}

export { FinalCtaSection };
