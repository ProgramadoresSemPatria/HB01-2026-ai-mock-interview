import { type ReactNode } from "react";
import { ScrollRevealGrid } from "../landing-page/scroll-reveal-grid";
import "../landing-page/image-parallax.css";
import grainTexture from "../../assets/grain-texture.png";

type ImageSource = string | { src: string; width?: number; height?: number };

function resolveSrc(src: ImageSource): string {
  return typeof src === "string" ? src : src.src;
}

const HERO_NOISE_OPACITY = 0.35;
const HERO_NOISE_OVERSCAN = 60;

// Simple placeholder "wordmark" graphic — swap for your own logo/icon/SVG.
function Wordmark() {
  return (
    <div className="relative isolate overflow-hidden select-none w-full h-full flex flex-col justify-end items-start">
      <span className="absolute top-1/2 -translate-y-1/3 left-2 z-10 text-[24px] italic text-neutral-800">
        AI MOCK <br /> INTERVIEW
      </span>
      <span className="relative z-10 text-[56px] font-bold text-white">
        HONE
      </span>
      <div
        className="image-parallax__grain"
        aria-hidden
        style={{
          opacity: HERO_NOISE_OPACITY,
          backgroundImage: `url(${resolveSrc(grainTexture)})`,
          backgroundSize: "cover",
          top: `-${HERO_NOISE_OVERSCAN / 2}%`,
          left: `-${HERO_NOISE_OVERSCAN / 2}%`,
          width: `${100 + HERO_NOISE_OVERSCAN}%`,
          height: `${100 + HERO_NOISE_OVERSCAN}%`,
        }}
      />
    </div>
  );
}

const ScrollGrid = ({ header }: { header?: ReactNode }) => {
  return (
    <main>
      <ScrollRevealGrid
        header={header}
        items={[
          {
            id: 1,
            graphic: <Wordmark />,
            title: "AI RESUMES",
            description:
              "Instant analysis of your experience against role requirements.",
          },
          {
            id: 2,
            graphic: <Wordmark />,
            title: "TOPIC TRACKING",
            description:
              "Hone monitors 40+ engineering domains to ensure you're covered across the entire full-stack spectrum.",
          },
          {
            id: 3,
            graphic: <Wordmark />,
            title: "TECH REVIEW",
            description:
              "Engineering reviews that provide a detailed breakdown of your technical strengths.",
          },
        ]}
      />
    </main>
  );
}

export default ScrollGrid;