"use client";

import Link from "next/link";

import BorderGlow from "@/components/landing/border-glow/border-glow";
import "@/components/landing/image-parallax/image-parallax.css";
import grainTexture from "@/assets/grain-texture.png";

const HERO_NOISE_OPACITY = 0.35;
const HERO_NOISE_OVERSCAN = 60;

type GetStartedButtonProps = {
  href?: string;
  className?: string;
};

function GetStartedButton({ href = "/login", className }: GetStartedButtonProps) {
  return (
    <BorderGlow
      className={className}
      edgeSensitivity={30}
      glowColor="40 80 80"
      glowRadius={40}
      glowIntensity={1}
      coneSpread={25}
      animated={false}
      colors={["#c084fc", "#f472b6", "#38bdf8"]}
    >
      <Link
        href={href}
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
  );
}

export default GetStartedButton;
