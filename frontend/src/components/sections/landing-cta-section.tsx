"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";

import "../landing-page/image-parallax.css";
import grainTexture from "../../assets/grain-texture.png";
import BorderGlow from '../BorderGlow';

const HERO_NOISE_OPACITY = 0.35;
const HERO_NOISE_OVERSCAN = 60;

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
        <BorderGlow
          className="mt-16"
          edgeSensitivity={30}
          glowColor="40 80 80"
          glowRadius={40}
          glowIntensity={1}
          coneSpread={25}
          animated={false}
          colors={['#c084fc', '#f472b6', '#38bdf8']}
        >
        <Link
          href="/login"
          className="relative isolate block overflow-hidden px-10 py-4 transition-opacity"
        >
          <span className="manrope relative z-10 text-2xl font-bold uppercase tracking-widest text-white">
            Get Started
          </span>
          <div
            className="image-parallax__grain"
            aria-hidden
            style={{
              opacity: HERO_NOISE_OPACITY,
              backgroundImage: `url(${grainTexture.src})`,
              backgroundSize: "cover",
              top: `-${HERO_NOISE_OVERSCAN / 2}%`,
              left: `-${HERO_NOISE_OVERSCAN / 2}%`,
              width: `${100 + HERO_NOISE_OVERSCAN}%`,
              height: `${100 + HERO_NOISE_OVERSCAN}%`,
            }}
          />
        </Link>
        </BorderGlow>
      </motion.div>
    </section>
  );
};

export default LandingCtaSection;
