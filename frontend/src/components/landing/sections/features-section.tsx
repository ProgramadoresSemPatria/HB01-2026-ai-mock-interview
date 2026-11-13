"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { LandingVideo } from "@/components/landing/landing-video";

gsap.registerPlugin(ScrollTrigger);

const PILLARS = [
  {
    tag: "Resume",
    title: "Built on your experience",
    description:
      "No generic question banks. Hone reads your resume against the role and ships interviews that probe the gaps that actually show up in loops.",
    cta: "Analyse my resume →",
    href: "/login",
    visual: "resume" as const,
  },
  {
    tag: "Practice",
    title: "Powered by live AI sessions",
    description:
      "Follow-ups that chase your reasoning — trade-offs, bottlenecks, and depth — so canned answers stop working.",
    cta: "Try a session →",
    href: "/#demo",
    visual: "session" as const,
  },
  {
    tag: "Review",
    title: "Designed for real progress",
    description:
      "Topic coverage across 40+ domains, scores you can trust, and a report that shows exactly where to grind next.",
    cta: "See a sample report →",
    href: "/login",
    visual: "review" as const,
  },
];

const VISUAL_CLIPS = {
  resume: {
    name: "resume-upload",
    label: "Uploading a resume PDF in Hone and watching it finish processing",
    width: 1000,
    height: 750,
  },
  session: {
    name: "interview-setup",
    label: "Choosing Entry level and 5 turns, then starting a live AI interview",
    width: 1200,
    height: 900,
  },
  review: {
    name: "interview-review",
    label: "Closing feedback and prioritized topics to review after a session",
    width: 880,
    height: 900,
  },
} as const;

function Visual({ kind }: { kind: (typeof PILLARS)[number]["visual"] }) {
  return <LandingVideo {...VISUAL_CLIPS[kind]} />;
}

export default function FeaturesSection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>("[data-feature-row]").forEach((row) => {
        const parts = row.querySelectorAll("[data-feature-part]");
        gsap.from(parts, {
          opacity: 0,
          y: reduced ? 0 : 36,
          duration: reduced ? 0.01 : 0.85,
          stagger: reduced ? 0 : 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: row,
            start: "top 78%",
            once: true,
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
      className="landing-section scroll-mt-24 bg-paper-white px-6 md:px-10"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="landing-heading-lg">Sharpen engineering thinking</h2>
          <p className="landing-body mx-auto mt-6 max-w-xl text-balance">
            through AI mock interviews built for modern software engineers.
          </p>
        </div>

        <div className="mt-16 space-y-20 md:mt-24 md:space-y-32 lg:space-y-40">
          {PILLARS.map((pillar, i) => {
            const reverse = i % 2 === 1;
            return (
              <article
                key={pillar.title}
                data-feature-row
                className="grid items-center gap-10 md:grid-cols-2 md:gap-14 lg:gap-24"
              >
                <div data-feature-part className={reverse ? "md:order-2" : undefined}>
                  <p className="landing-eyebrow">{pillar.tag}</p>
                  <h3 className="landing-heading mt-4">
                    {pillar.title}
                  </h3>
                  <p className="manrope mt-5 max-w-lg text-[17px] leading-[1.6] text-slate-gray md:mt-6 lg:text-lg">
                    {pillar.description}
                  </p>
                  <Link href={pillar.href} className="landing-link-arrow mt-3 inline-block">
                    {pillar.cta}
                  </Link>
                </div>
                <div data-feature-part className={reverse ? "md:order-1" : undefined}>
                  <Visual kind={pillar.visual} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
