"use client";

import { useRef } from "react";

import HeroSection from "@/components/landing/sections/hero-section";
import FeaturesSection from "@/components/landing/sections/features-section";
import ChatDemoSection from "@/components/landing/sections/chat-demo-section";
import LandingCtaSection from "@/components/landing/sections/landing-cta-section";

export default function LandingSections() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <HeroSection parallaxRef={parallaxRef} />
      <FeaturesSection parallaxRef={parallaxRef} />
      <ChatDemoSection />
      <LandingCtaSection />
    </>
  );
}
