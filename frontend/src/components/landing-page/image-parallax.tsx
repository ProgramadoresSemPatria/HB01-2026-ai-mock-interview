"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";
import "./image-parallax.css";
import grainTexture from "../../assets/grain-texture.png";

type ImageSource = string | { src: string; width?: number; height?: number };

interface ImageParallaxProps {
  src: ImageSource;
  alt?: string;
  width?: number | string;
  height?: number | string;
  intensity?: number;
  overscan?: number;
  noiseOpacity?: number;
  objectPosition?: string;
  className?: string;
  style?: React.CSSProperties;
  startOffset?: number;
  noiseIntensity?: number;
  noiseOverscan?: number;
}

function resolveSrc(src: ImageSource): string {
  return typeof src === "string" ? src : src.src;
}

export default function ImageParallax({
  src,
  alt = "",
  width = "100%",
  height = 480,
  intensity = 100,
  overscan = 30,
  noiseOpacity = 0.6,
  objectPosition = "center",
  className = "",
  style,
  startOffset = 0,
  noiseIntensity = 24,
  noiseOverscan = 60,
}: ImageParallaxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Direct 1:1 mapping to scroll — no spring, no lag, no overshoot.
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion
      ? [0, 0]
      : [-intensity + startOffset, intensity + startOffset]
  );

  const noiseY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [noiseIntensity, -noiseIntensity]
  );

  return (
    <div
      ref={containerRef}
      className={`image-parallax ${className}`.trim()}
      style={{ width, height, ...style }}
    >
      <div className="image-parallax__frame">
        <motion.img
          src={resolveSrc(src)}
          alt={alt}
          className="image-parallax__img"
          style={{
            y,
            objectPosition,
            top: `-${overscan / 2}%`,
            height: `${100 + overscan}%`,
          }}
        />
      </div>

      <motion.div
        className="image-parallax__grain"
        aria-hidden
        style={{
          y: noiseY,
          opacity: noiseOpacity,
          backgroundImage: `url(${resolveSrc(grainTexture)})`,
          backgroundSize: "cover",
          top: `-${noiseOverscan / 2}%`,
          left: `-${noiseOverscan / 2}%`,
          width: `${100 + noiseOverscan}%`,
          height: `${100 + noiseOverscan}%`,
        }}
      />
    </div>
  );
}