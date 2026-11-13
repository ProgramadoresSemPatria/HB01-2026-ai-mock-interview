"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { LandingVideo } from "@/components/landing/landing-video";
import { useSiteLocale } from "@/features/site-locale/site-locale-provider";

gsap.registerPlugin(ScrollTrigger);

// Copy lives in the site-locale messages, keyed by `visual`.
const PILLARS = [
  { href: "/login", visual: "resume" as const },
  { href: "/#demo", visual: "session" as const },
  { href: "/login", visual: "review" as const },
];

const VISUAL_CLIPS = {
  resume: {
    name: "resume-upload",
    width: 1000,
    height: 750,
  },
  session: {
    name: "interview-setup",
    width: 1200,
    height: 900,
  },
  review: {
    name: "interview-review",
    width: 880,
    height: 900,
  },
} as const;

function Visual({ kind }: { kind: (typeof PILLARS)[number]["visual"] }) {
  const { t } = useSiteLocale();
  return (
    <LandingVideo
      {...VISUAL_CLIPS[kind]}
      label={t.features.pillars[kind].videoLabel}
    />
  );
}

export default function FeaturesSection() {
  const ref = useRef<HTMLElement>(null);
  const { t } = useSiteLocale();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      root
        .querySelectorAll<HTMLElement>("[data-feature-row]")
        .forEach((row, i) => {
          const text = row.querySelector("[data-feature-part]");
          const visual = row.querySelector("[data-feature-visual]");
          // Visual sits on the right for even rows, on the left for odd rows.
          const side = i % 2 === 0 ? 1 : -1;

          if (reduced) {
            gsap.from([text, visual], {
              opacity: 0,
              duration: 0.01,
              scrollTrigger: { trigger: row, start: "top 78%", once: true },
            });
            return;
          }

          // Text glides in from the side opposite the video, scrubbed to scroll.
          gsap.fromTo(
            text,
            { opacity: 0, x: -48 * side, y: 24 },
            {
              opacity: 1,
              x: 0,
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: row,
                start: "top 90%",
                end: "top 45%",
                scrub: 0.6,
              },
            },
          );

          // Video tilts in from 3D, scales up and flattens as it reaches center.
          gsap.fromTo(
            visual,
            {
              opacity: 0.25,
              scale: 0.82,
              y: 90,
              rotateX: 16,
              rotateY: -14 * side,
              transformOrigin: "50% 100%",
            },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              rotateX: 0,
              rotateY: 0,
              ease: "none",
              scrollTrigger: {
                trigger: row,
                start: "top 95%",
                end: "center 55%",
                scrub: 0.8,
              },
            },
          );

          // Gentle parallax drift while the row scrolls past.
          gsap.to(visual, {
            yPercent: -6,
            ease: "none",
            scrollTrigger: {
              trigger: row,
              start: "center 55%",
              end: "bottom top",
              scrub: true,
            },
          });
        });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      id="features"
      className="landing-section scroll-mt-24 overflow-x-clip bg-paper-white px-6 md:px-10"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="landing-heading-lg">{t.features.title}</h2>
          <p className="landing-body mx-auto mt-6 max-w-xl text-balance">
            {t.features.subtitle}
          </p>
        </div>

        <div className="mt-16 space-y-20 md:mt-24 md:space-y-32 lg:space-y-40">
          {PILLARS.map((pillar, i) => {
            const reverse = i % 2 === 1;
            const copy = t.features.pillars[pillar.visual];
            return (
              <article
                key={pillar.visual}
                data-feature-row
                className="grid items-center gap-10 md:grid-cols-2 md:gap-14 lg:gap-24"
              >
                <div data-feature-part className={reverse ? "md:order-2" : undefined}>
                  <p className="landing-eyebrow">{copy.tag}</p>
                  <h3 className="landing-heading mt-4">
                    {copy.title}
                  </h3>
                  <p className="manrope mt-5 max-w-lg text-[17px] leading-[1.6] text-slate-gray md:mt-6 lg:text-lg">
                    {copy.description}
                  </p>
                  <Link href={pillar.href} className="landing-link-arrow mt-3 inline-block">
                    {copy.cta}
                  </Link>
                </div>
                <div
                  className={`[perspective:1400px] ${reverse ? "md:order-1" : ""}`}
                >
                  <div data-feature-visual className="will-change-transform">
                    <Visual kind={pillar.visual} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
