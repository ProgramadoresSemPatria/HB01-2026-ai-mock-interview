"use client";

import { type RefObject } from "react";
import { motion } from "framer-motion";

import ImageParallax from "@/components/landing/image-parallax/image-parallax";
import heroImage from "@/assets/logo.png";

interface HeroSectionProps {
  parallaxRef: RefObject<HTMLDivElement | null>;
}

const HeroSection = ({ parallaxRef }: HeroSectionProps) => {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "20px",
        height: "100vh",
      }}
    >
      <motion.div
        className="text-center text-9xl font-normal text-white instrument-serif"
        style={{ y: -300, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      >
        AI MOCK INTERVIEW
      </motion.div>
      <motion.div
        style={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      >
        <ImageParallax
          ref={parallaxRef}
          src={heroImage}
          alt="Hone"
          width="min(75vw, 800px)"
          height="min(75vw, 800px)"
          intensity={120}
          overscan={35}
          noiseOpacity={0.35}
          objectPosition="center"
          noiseIntensity={100}
          startOffset={-30}
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;
