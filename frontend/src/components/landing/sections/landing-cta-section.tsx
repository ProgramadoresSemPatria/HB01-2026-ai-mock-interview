"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";

import GetStartedButton from "@/components/landing/get-started-button";

const LandingCtaSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(sectionRef, { once: true, amount: 0.4 });

  return (
    <section
      ref={sectionRef}
      className="landing-canvas flex min-h-screen flex-col items-center justify-center px-6"
    >
      <motion.div
        className="flex flex-col items-center text-center"
        initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 }}
        animate={
          isInView || prefersReducedMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 48 }
        }
        transition={{ duration: 2, ease: "easeInOut" }}
      >
        <h2 className="instrument-serif text-9xl font-normal text-white">
          Ready to Hone Your Craft?
        </h2>
        <p className="manrope mt-20 text-2xl font-normal uppercase text-white">
          start your first AI mock interview in minutes.
        </p>
        <GetStartedButton className="mt-16" />
      </motion.div>
    </section>
  );
};

export default LandingCtaSection;
