"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Public assets are not rewritten by Next's `basePath`, so prefix them the
 * same way `auth-client.ts` does (Cloudflare builds serve under a subpath).
 */
const basePath = process.env.__NEXT_ROUTER_BASEPATH ?? "";

type LandingVideoProps = {
  /** File stem inside `public/landing/videos` (`<name>.mp4` + `<name>.webp`). */
  name: string;
  /** Accessible description of what the clip shows. */
  label: string;
  width: number;
  height: number;
  className?: string;
};

/**
 * Muted, looping product clip. Loads its source only once it nears the
 * viewport, pauses while off-screen, and renders just the poster when the
 * visitor prefers reduced motion.
 */
export function LandingVideo({
  name,
  label,
  width,
  height,
  className,
}: LandingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isNear, setIsNear] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const src = `${basePath}/landing/videos/${name}.mp4`;
  const poster = `${basePath}/landing/videos/${name}.webp`;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion) return;
    video.muted = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNear(true);
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const mediaClassName = "block h-auto w-full";

  return (
    <div
      className={`landing-artifact overflow-hidden !p-2 md:!p-3 ${className ?? ""}`}
    >
      <div className="overflow-hidden rounded-[16px] border border-border-hairline bg-paper-white">
        {reducedMotion ? (
          // eslint-disable-next-line @next/next/no-img-element -- static poster from /public, sized by width/height
          <img
            src={poster}
            alt={label}
            width={width}
            height={height}
            loading="lazy"
            className={mediaClassName}
          />
        ) : (
          <video
            ref={videoRef}
            src={isNear ? src : undefined}
            poster={poster}
            width={width}
            height={height}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={label}
            className={mediaClassName}
          />
        )}
      </div>
    </div>
  );
}
