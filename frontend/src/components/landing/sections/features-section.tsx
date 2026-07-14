"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

function ResumeVisual() {
  return (
    <div className="landing-artifact p-6">
      <p className="landing-tag mb-4">Gap analysis</p>
      <ul className="space-y-3">
        {[
          { label: "System Design depth", pct: 62 },
          { label: "API design language", pct: 84 },
          { label: "Trade-off framing", pct: 41 },
        ].map((row) => (
          <li key={row.label}>
            <div className="mb-1 flex justify-between">
              <span className="manrope text-sm text-ink-black">{row.label}</span>
              <span className="manrope text-sm text-ash-gray">{row.pct}%</span>
            </div>
            <div className="h-[3px] w-full rounded-full bg-mist-gray">
              <div
                className="h-full rounded-full bg-jade"
                style={{ width: `${row.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SessionVisual() {
  return (
    <div className="landing-artifact space-y-3 p-5">
      <div className="rounded-[16px] bg-mist-gray p-3">
        <p className="landing-tag mb-1">AI Interviewer</p>
        <p className="manrope text-sm text-ink-black">
          How would you shard user feeds without hot partitions?
        </p>
      </div>
      <div className="rounded-[16px] bg-ink-black p-3">
        <p className="landing-tag mb-1 !text-white/50">Candidate</p>
        <p className="manrope text-sm text-paper-white">
          Start with consistent hashing, then isolate celebrity keys…
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-[16px] border border-border-hairline px-3 py-2">
        <span className="manrope flex-1 text-sm text-smoke-gray">Ask anything…</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-jade text-xs text-paper-white">
          →
        </span>
      </div>
    </div>
  );
}

function ReviewVisual() {
  return (
    <div className="landing-artifact p-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="landing-tag">Session score</p>
          <p className="manrope text-[28px] font-medium text-ink-black">73</p>
        </div>
        <p className="manrope text-sm text-slate-gray">↑ 12 pts</p>
      </div>
      <p className="landing-tag mb-2">Strengths</p>
      <ul className="mb-4 space-y-1">
        {["Trade-offs without prompting", "Bottleneck identified early"].map((s) => (
          <li key={s} className="manrope text-sm text-ink-black">
            + {s}
          </li>
        ))}
      </ul>
      <p className="landing-tag mb-2">Growth</p>
      <ul className="space-y-1">
        {["CAP in edge cases", "Latency vs throughput"].map((g) => (
          <li key={g} className="manrope text-sm text-ink-black">
            → {g}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Visual({ kind }: { kind: (typeof PILLARS)[number]["visual"] }) {
  if (kind === "resume") return <ResumeVisual />;
  if (kind === "session") return <SessionVisual />;
  return <ReviewVisual />;
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
      className="landing-section scroll-mt-24 bg-paper-white px-6"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="landing-heading-lg">Sharpen engineering thinking</h2>
          <p className="landing-body mt-5">
            through AI mock interviews built for modern software engineers.
          </p>
        </div>

        <div className="mt-20 space-y-24 md:space-y-32">
          {PILLARS.map((pillar, i) => {
            const reverse = i % 2 === 1;
            return (
              <article
                key={pillar.title}
                data-feature-row
                className="grid items-center gap-10 md:grid-cols-2 md:gap-16"
              >
                <div data-feature-part className={reverse ? "md:order-2" : undefined}>
                  <p className="landing-tag">{pillar.tag}</p>
                  <h3 className="instrument-serif mt-4 text-[44px] font-normal leading-[1.2] tracking-[-0.66px] text-ink-black text-balance">
                    {pillar.title}
                  </h3>
                  <p className="manrope mt-5 max-w-md text-[17px] leading-[1.35] text-slate-gray">
                    {pillar.description}
                  </p>
                  <Link href={pillar.href} className="landing-link-arrow mt-2 inline-block">
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
