"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

export default function QuoteSection() {
  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="landing-section bg-paper-white px-6">
      <motion.div
        className="mx-auto max-w-[960px]"
        initial={
          prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }
        }
        animate={
          isInView || prefersReducedMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 28 }
        }
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="landing-jade-card md:p-16">
          <p className="manrope text-[26px] font-medium leading-[1.18] tracking-[-0.23px] text-jade-deep">
            Why candidates switch to Hone
          </p>
          <blockquote className="manrope mt-8 text-[18px] leading-[1.45] text-jade-deep md:text-[22px] md:leading-[1.5]">
            “You don&apos;t rise to the level of the interview. You fall to the
            level of your preparation.”
          </blockquote>
          <p className="manrope mt-8 text-sm text-jade-deep">
            — The philosophy behind Hone
          </p>
        </div>
      </motion.div>
    </section>
  );
}
