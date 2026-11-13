"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { useSiteLocale } from "@/features/site-locale/site-locale-provider";

export default function QuoteSection() {
  const ref = useRef<HTMLElement>(null);
  const { t } = useSiteLocale();
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="landing-section landing-section--compact bg-paper-white px-6">
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
            {t.quote.title}
          </p>
          <blockquote className="manrope mt-8 text-[18px] leading-[1.45] text-jade-deep md:text-[22px] md:leading-[1.5]">
            {t.quote.quote}
          </blockquote>
          <p className="manrope mt-8 text-sm text-jade-deep">
            {t.quote.attribution}
          </p>
        </div>
      </motion.div>
    </section>
  );
}
