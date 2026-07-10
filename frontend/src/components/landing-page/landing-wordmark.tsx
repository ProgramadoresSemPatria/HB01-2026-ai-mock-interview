import "../landing-page/image-parallax.css";
import grainTexture from "../../assets/grain-texture.png";

type ImageSource = string | { src: string; width?: number; height?: number };

function resolveSrc(src: ImageSource): string {
  return typeof src === "string" ? src : src.src;
}

const HERO_NOISE_OPACITY = 0.35;
const HERO_NOISE_OVERSCAN = 60;

interface LandingWordmarkProps {
  size?: "card" | "nav";
  className?: string;
}

function LandingWordmark({ size = "card", className = "" }: LandingWordmarkProps) {
  if (size === "nav") {
    return (
      <span
        className={`manrope text-sm font-bold tracking-widest text-white ${className}`.trim()}
      >
        HONE
      </span>
    );
  }

  return (
    <div
      className={`relative isolate flex h-full w-full select-none flex-col items-start justify-end overflow-hidden ${className}`.trim()}
    >
      <span className="manrope absolute right-2 top-0 z-10 text-[24px] italic text-slate-200 opacity-30">
        AI POWERED
      </span>
      <span className="relative z-10 text-[56px] font-bold text-white">HONE</span>
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

export default LandingWordmark;
