"use client";

import { type RefObject } from "react";
import ImageParallax from "../landing-page/image-parallax";
import heroImage from "../../assets/logo.png";

interface HeroSectionProps {
  parallaxRef: RefObject<HTMLDivElement | null>;
}

const HeroSection = ({ parallaxRef }: HeroSectionProps) => {
  return (
    <section
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        height: "100vh",
      }}
    >
      <ImageParallax
        ref={parallaxRef}
        src={heroImage}
        alt="Hone"
        width="min(75vw, 800px)"
        height="min(75vw, 800px)"
        intensity={100}
        overscan={35}
        noiseOpacity={0.35}
        objectPosition="center"
        noiseIntensity={30}
        startOffset={-30}
      />
    </section>
  );
};

export default HeroSection;
