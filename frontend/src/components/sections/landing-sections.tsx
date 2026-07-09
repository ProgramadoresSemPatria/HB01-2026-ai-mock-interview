"use client";

import { useRef } from "react";
import HeroSection from "@/components/sections/hero-section";
import FeaturesSection from "@/components/sections/features-section";
import TesteSection from "@/components/sections/teste-section";

export default function LandingSections() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <HeroSection parallaxRef={parallaxRef} />
      <FeaturesSection parallaxRef={parallaxRef} />
      <TesteSection />
    </>
  );
}
