"use client";

import { useRef } from "react";
import HeroSection from "@/components/sections/hero-section";
import FeaturesSection from "@/components/sections/features-section";
import LandingCtaSection from "@/components/sections/landing-cta-section";

export default function LandingSections() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <HeroSection parallaxRef={parallaxRef} />
      <FeaturesSection parallaxRef={parallaxRef} />
      <LandingCtaSection />
    </>
  );
}
