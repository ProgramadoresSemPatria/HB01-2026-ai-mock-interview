"use client";

import { type RefObject } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";

import ScrollGrid from "../patterns/scroll-grid";

const REVEAL_OFFSET: [string, string] = ["start start", "end start"];
const REVEAL_TRANSLATE_Y = -250;
const OPACITY_FADE_END = 1 ;

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
    <section className="flex flex-col items-center">
      <ScrollGrid
        header={
          <motion.div
            className="text-center text-9xl font-normal text-white instrument-serif"
            style={{ y, opacity }}
          >
            Sharpen Engineering Thinking
            <h1 className="mt-20 text-center text-2xl font-normal text-white manrope uppercase">
              through AI mock interviews built for modern software engineers.
            </h1>
          </motion.div>
        }
      />
    </section>
  );
};

export default FeaturesSection;
