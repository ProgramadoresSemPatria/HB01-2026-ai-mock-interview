"use client";

import { type RefObject } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";

const REVEAL_OFFSET: [string, string] = ["start start", "end start"];
const REVEAL_TRANSLATE_Y = -250;
const OPACITY_FADE_END = 1;

interface FeaturesSectionProps {
  parallaxRef: RefObject<HTMLDivElement | null>;
}

const FeaturesSection = ({ parallaxRef }: FeaturesSectionProps) => {
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: parallaxRef,
    offset: REVEAL_OFFSET,
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [REVEAL_TRANSLATE_Y, 0],
    { clamp: true }
  );

  const opacity = useTransform(
    scrollYProgress,
    [0, OPACITY_FADE_END],
    prefersReducedMotion ? [1, 1] : [0, 1],
    { clamp: true }
  );

  return (
    <section className="flex justify-center items-start h-screen">
      <motion.div
        className="text-center text-9xl mt-30 font-normal text-white instrument-serif sticky top-2"
        style={{ y, opacity }}
      >
        Sharpen Engineering Thinking
      </motion.div>
    </section>
  );
};

export default FeaturesSection;
