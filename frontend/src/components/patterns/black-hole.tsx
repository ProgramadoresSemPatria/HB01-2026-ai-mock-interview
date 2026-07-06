"use client";

import { useEffect, useRef, useState } from "react";

type BlackHoleProps = {
  /** Quantidade de pontos na nuvem central (núcleo + anéis + halo) */
  coreCount?: number;
  /** Quantidade de pontos em cada braço de acreção */
  armCount?: number;
  /** Classe CSS opcional para o elemento canvas */
  className?: string;
};

type Particle = {
  cx: number;
  cy: number;
  r: number;
  baseAngle: number;
  squish: number;
  size: number;
  brightness: number;
  spin: number;
};

function gaussian(x: number, mean: number, sigma: number) {
  return Math.exp(-((x - mean) ** 2) / (2 * sigma * sigma));
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function radialWeight(r: number, R: number) {
  const core = R * 0.3;
  const ring1 = R * 0.42;
  const ring2 = R * 0.62;
  if (r < core) return 0;
  const w1 = gaussian(r, ring1, R * 0.05) * 1.0;
  const w2 = gaussian(r, ring2, R * 0.09) * 0.55;
  const haloFar = Math.max(0, 1 - (r - core) / (R * 2.4)) * 0.24;
  return w1 + w2 + haloFar;
}

function toScreen(cx: number, cy: number, r: number, a: number, squish = 1) {
  return {
    x: cx + Math.cos(a) * r,
    y: cy - Math.sin(a) * r * squish,
  };
}

function generateCoreCloud(count: number, w: number, h: number): Particle[] {
  const R = Math.min(w, h) * 0.48;
  const cx = w / 2;
  const cy = h / 2;
  const arr: Particle[] = [];
  let attempts = 0;
  while (arr.length < count && attempts < count * 40) {
    attempts++;
    const r = Math.random() * R * 2.4;
    const weight = radialWeight(r, R);
    if (Math.random() > weight) continue;
    const theta = Math.random() * Math.PI * 2;
    const squish = 0.92;
    const brightness = 0.3 + weight * 0.7;
    const size = 0.5 + brightness * 1.4 * (0.6 + Math.random() * 0.7);
    arr.push({
      cx,
      cy,
      r,
      baseAngle: theta,
      squish,
      size,
      brightness,
      spin: (0.06 + Math.random() * 0.1) / (r / R + 0.15),
    });
  }
  return arr;
}

type SpiralArmOpts = {
  cx: number;
  cy: number;
  R: number;
  count: number;
  startAngle: number;
  sweep: number;
  r0: number;
  r1: number;
  width: number;
  squish: number;
  dir: 1 | -1;
};

function generateSpiralArm(opts: SpiralArmOpts): Particle[] {
  const { cx, cy, R, count, startAngle, sweep, r0, r1, width, squish, dir } =
    opts;
  const arr: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const tCurve = Math.pow(t, 1.35);
    const s = smoothstep(t);

    const angle = startAngle + dir * sweep * t;
    const r = r0 + (r1 - r0) * tCurve;

    const localWidth = width * (0.25 + 1.1 * s);
    const rJitter = (Math.random() - 0.5) * localWidth;
    const aJitter = (Math.random() - 0.5) * 0.05;

    const bgWeight = radialWeight(r, R);
    const armExtra = s * 0.9;
    const density = Math.min(1, bgWeight + armExtra);
    if (Math.random() > density) continue;

    const bgBrightness = 0.3 + bgWeight * 0.7;
    const armBrightness = 0.45 + s * 0.55;
    const brightness = Math.max(
      bgBrightness,
      armBrightness * s + bgBrightness * (1 - s),
    );
    const size = 0.5 + brightness * 1.5 * (0.5 + Math.random() * 0.8);

    arr.push({
      cx,
      cy,
      r: r + rJitter,
      baseAngle: angle + aJitter,
      squish,
      size,
      brightness,
      spin: (dir * (0.05 + Math.random() * 0.08)) / (r / R + 0.2),
    });
  }
  return arr;
}

function buildParticles(
  w: number,
  h: number,
  coreCount: number,
  armCount: number,
): Particle[] {
  const R = Math.min(w, h) * 0.48;
  const cx = w / 2;
  const cy = h / 2;
  const squish = 0.92;

  const core = generateCoreCloud(coreCount, w, h);

  const armTop = generateSpiralArm({
    cx,
    cy,
    R,
    count: armCount,
    startAngle: -0.35,
    sweep: Math.PI * 1.15,
    r0: R * 0.3,
    r1: R * 1.15,
    width: R * 0.11,
    squish,
    dir: 1,
  });

  const armBottom = generateSpiralArm({
    cx,
    cy,
    R,
    count: armCount,
    startAngle: Math.PI - 0.35,
    sweep: Math.PI * 1.15,
    r0: R * 0.3,
    r1: R * 1.15,
    width: R * 0.11,
    squish,
    dir: 1,
  });

  return core.concat(armTop, armBottom);
}

const ALPHA_BUCKETS = 24;

function paintAmbient(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(
    w / 2,
    h / 2,
    0,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.65,
  );
  g.addColorStop(0, "rgba(12,12,16,0)");
  g.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function getResponsiveCounts() {
  if (typeof window === "undefined") {
    return { core: 34000, arm: 16000 };
  }
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  return isMobile
    ? { core: 12000, arm: 6000 }
    : { core: 34000, arm: 16000 };
}

function BlackHole({ coreCount, armCount, className }: BlackHoleProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | undefined>(undefined);
  const reducedMotionRef = useRef(false);
  const [counts, setCounts] = useState(() => getResponsiveCounts());

  const resolvedCore = coreCount ?? counts.core;
  const resolvedArm = armCount ?? counts.arm;

  useEffect(() => {
    const updateCounts = () => setCounts(getResponsiveCounts());
    updateCounts();
    const mq = window.matchMedia("(max-width: 768px)");
    mq.addEventListener("change", updateCounts);
    return () => mq.removeEventListener("change", updateCounts);
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = canvas.parentElement;

    const resize = () => {
      const w = container ? container.clientWidth : window.innerWidth;
      const h = container ? container.clientHeight : window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particlesRef.current = buildParticles(w, h, resolvedCore, resolvedArm);
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      paintAmbient(ctx, w, h);

      const buckets: number[][] = Array.from(
        { length: ALPHA_BUCKETS + 1 },
        () => [],
      );
      for (const p of particlesRef.current) {
        const pos = toScreen(p.cx, p.cy, p.r, p.baseAngle, p.squish);
        const alpha = Math.min(1, p.brightness * (0.7 + Math.random() * 0.3));
        const bucket = Math.round(alpha * ALPHA_BUCKETS);
        buckets[bucket].push(pos.x, pos.y, p.size);
      }

      for (let b = 0; b <= ALPHA_BUCKETS; b++) {
        const arr = buckets[b];
        if (!arr.length) continue;
        ctx.fillStyle = `rgba(255,255,255,${(b / ALPHA_BUCKETS).toFixed(3)})`;
        for (let i = 0; i < arr.length; i += 3) {
          const x = arr[i];
          const y = arr[i + 1];
          const s = arr[i + 2];
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
        }
      }
    };

    const animate = () => {
      if (!reducedMotionRef.current) {
        for (const p of particlesRef.current) {
          p.baseAngle += p.spin * 0.002;
        }
      }
      draw();
      rafRef.current = requestAnimationFrame(animate);
    };

    resize();
    animate();

    const resizeObserver = new ResizeObserver(() => resize());
    if (container) resizeObserver.observe(container);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
    };
  }, [resolvedCore, resolvedArm]);

  return (
    <div
      className="pointer-events-none h-full w-full bg-black"
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        className={className}
        style={{ display: "block" }}
      />
    </div>
  );
}

export { BlackHole };
