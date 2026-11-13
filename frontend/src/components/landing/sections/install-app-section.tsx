"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Smartphone } from "lucide-react";

import LandingCta from "@/components/landing/get-started-button";

const POINTS = [
  "Opens full screen, like a native app",
  "One tap from your home screen",
  "No app store, always up to date",
];

export default function InstallAppSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section
      ref={sectionRef}
      id="get-the-app"
      className="scroll-mt-24 bg-paper-white px-6 pb-[var(--section-gap)]"
    >
      <motion.div
        className="landing-mist-card mx-auto flex max-w-[960px] flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12"
        initial={
          prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
        }
        animate={
          isInView || prefersReducedMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 24 }
        }
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-jade text-paper-white"
            aria-hidden
          >
            <Smartphone className="h-6 w-6" />
          </span>
          <div>
            <h2 className="landing-heading">Install the Hone app</h2>
            <p className="landing-body mt-3 max-w-md">
              Practice interviews anywhere. Add Hone to your phone or desktop
              in seconds.
            </p>
            <ul className="manrope mt-5 space-y-2 text-[15px] text-[var(--color-ink-black)]">
              {POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-jade"
                    aria-hidden
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
          <LandingCta label="Get the app" variant="solid" href="/download" />
          <LandingCta
            label="How to install"
            variant="outline"
            href="/download#install"
          />
        </div>
      </motion.div>
    </section>
  );
}
