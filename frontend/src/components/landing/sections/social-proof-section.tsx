"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

const LOGO_MARKS = ["Acme Corp", "Vertex AI", "Northwind", "Prism Tech", "Helion", "Cobalt"];

export default function SocialProofSection() {
  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="bg-paper-white px-6 py-16 md:px-10 md:py-24">
      <motion.div
        className="mx-auto max-w-[1280px] text-center"
        initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        animate={
          isInView || prefersReducedMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 16 }
        }
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p className="landing-eyebrow mb-8 md:mb-10">Trusted by engineers at</p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 md:gap-x-16">
          {LOGO_MARKS.map((name) => (
            <span
              key={name}
              className="manrope text-base font-medium tracking-wide text-smoke-gray md:text-lg lg:text-xl"
            >
              {name}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
