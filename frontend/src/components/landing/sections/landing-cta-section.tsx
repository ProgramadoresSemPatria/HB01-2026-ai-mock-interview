"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import LandingCta from "@/components/landing/get-started-button";

export default function LandingCtaSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(sectionRef, { once: true, amount: 0.35 });

  return (
    <section
      ref={sectionRef}
      className="landing-section relative overflow-hidden bg-paper-white px-6"
    >
      <div
        className="landing-jade-wash pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
      />
      <motion.div
        className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center text-center"
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
        <h2 className="landing-heading-lg max-w-3xl">
          Try Hone free. First interview in under a minute.
        </h2>
        <p className="landing-body mt-5 max-w-lg">
          Connect your resume or explore in demo mode. No credit card.
        </p>
        <div className="mt-10 flex items-center justify-center">
          <LandingCta label="Get started" variant="solid" href="/login" />
        </div>
      </motion.div>
    </section>
  );
}
