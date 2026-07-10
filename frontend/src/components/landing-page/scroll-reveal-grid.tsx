"use client";

import { type ReactNode, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface ScrollRevealItem {
  id: string | number;
  /** Visual on top of the card (logo mark, icon, illustration...) */
  graphic: ReactNode;
  title: string;
  description: string;
}

export interface ScrollRevealGridProps {
  items: ScrollRevealItem[];
  /**
   * How many viewport-heights of scroll distance to allocate per item.
   * Bigger = slower scroll to go through the whole sequence.
   */
  vhPerItem?: number;
  /**
   * Fraction (0-1) of the gap between two checkpoints spent animating a
   * card in. The rest of the gap it just sits still (fully revealed)
   * while the progress bar keeps growing towards the next checkpoint.
   */
  revealPortion?: number;
  /**
   * Extra viewport-heights of scroll after the animation completes, during
   * which the grid stays sticky with the final state visible.
   */
  holdVh?: number;
  /** Pinned at the top of the sticky viewport while the grid reveals. */
  header?: ReactNode;
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export function ScrollRevealGrid({
  items,
  vhPerItem = 70,
  revealPortion = 0.8,
  holdVh = 100,
  header,
  className = "",
}: ScrollRevealGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const n = Math.max(items.length, 1);
  const scrollHeight = n * vhPerItem;
  const totalHeight = scrollHeight + holdVh;
  const animationEnd = Math.max(
    0.001,
    (scrollHeight - 100) / (totalHeight - 100)
  );

  const animationProgress = useTransform(
    scrollYProgress,
    [0, animationEnd],
    [0, 1],
    { clamp: true }
  );

  // Checkpoint fraction for each item, aligned with each column's LEFT edge
  // (0, 1/n, 2/n, ...). The bar itself spans the full width, from 0 to 1.
  const checkpoints = items.map((_, i) => i / n);

  const gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;

  return (
    <section
      ref={containerRef}
      className={`relative ${className}`}
      style={{ height: `${totalHeight}vh` }}
    >
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        {header ? (
          <div className="relative z-10 shrink-0 px-6 pt-2 md:px-10">
            {header}
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="w-full max-w-6xl px-6 md:px-10">
          {/* row 1: graphics */}
          <div className="grid" style={{ gridTemplateColumns }}>
            {items.map((item, i) => (
              <div key={item.id} className={i < n - 1 ? "pr-6 md:pr-10" : ""}>
                <RevealGraphic
                  item={item}
                  animationProgress={animationProgress}
                  {...revealWindow(i, checkpoints, n, revealPortion)}
                />
              </div>
            ))}
          </div>

          {/* row 2: progress bar (no opacity animation at all, only scaleX) */}
          <ProgressBar animationProgress={animationProgress} checkpoints={checkpoints} />

          {/* row 3: text */}
          <div className="grid mt-8" style={{ gridTemplateColumns }}>
            {items.map((item, i) => (
              <div key={item.id} className={i < n - 1 ? "pr-6 md:pr-10" : ""}>
                <RevealText
                  item={item}
                  animationProgress={animationProgress}
                  {...revealWindow(i, checkpoints, n, revealPortion)}
                />
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Computes the [start, end] scroll-progress window in which item `i` reveals. */
function revealWindow(
  i: number,
  checkpoints: number[],
  n: number,
  revealPortion: number
) {
  const checkpoint = checkpoints[i];
  const segmentWidth = (1 / n) * revealPortion;

  if (i === 0) {
    // first card: already visible practically from the very start
    return { revealStart: 0, revealEnd: 0.001 };
  }

  const end = checkpoint;
  const start = Math.max(0, end - segmentWidth);
  return { revealStart: start, revealEnd: end === start ? start + 0.001 : end };
}

/** Opacity ramps 0→1 during [start, end] and latches at 1 once reached. */
function useOneWayReveal(
  progress: MotionValue<number>,
  start: number,
  end: number
) {
  const revealed = useRef(false);
  return useTransform(progress, (v) => {
    if (v >= end) revealed.current = true;
    if (revealed.current) return 1;
    if (v <= start) return 0;
    return (v - start) / (end - start);
  });
}

/** Opacity snaps to 1 once progress crosses threshold and stays there. */
function useOneWayThreshold(progress: MotionValue<number>, threshold: number) {
  const revealed = useRef(false);
  return useTransform(progress, (v) => {
    if (v >= threshold) revealed.current = true;
    return revealed.current ? 1 : 0;
  });
}

/* ------------------------------------------------------------------ */
/* Sub components                                                     */
/* ------------------------------------------------------------------ */

function RevealGraphic({
  item,
  animationProgress,
  revealStart,
  revealEnd,
}: {
  item: ScrollRevealItem;
  animationProgress: MotionValue<number>;
  revealStart: number;
  revealEnd: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  const opacity = useOneWayReveal(animationProgress, revealStart, revealEnd);
  const y = useTransform(
    animationProgress,
    [revealStart, revealEnd],
    shouldReduceMotion ? [0, 0] : [-32, 0] // comes from above, downward
  );

  return (
    <motion.div style={{ opacity, y }} className="flex h-40 items-center">
      {item.graphic}
    </motion.div>
  );
}

function RevealText({
  item,
  animationProgress,
  revealStart,
  revealEnd,
}: {
  item: ScrollRevealItem;
  animationProgress: MotionValue<number>;
  revealStart: number;
  revealEnd: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  const opacity = useOneWayReveal(animationProgress, revealStart, revealEnd);
  const y = useTransform(
    animationProgress,
    [revealStart, revealEnd],
    shouldReduceMotion ? [0, 0] : [32, 0] // comes from below, upward
  );

  return (
    <motion.div style={{ opacity, y }}>
      <h3 className="manrope mb-3 text-xl font-semibold text-white md:text-2xl">
        {item.title}
      </h3>
      <p className="manrope text-sm leading-relaxed text-neutral-400 md:text-base">
        {item.description}
      </p>
    </motion.div>
  );
}

function ProgressBar({
  animationProgress,
  checkpoints,
}: {
  animationProgress: MotionValue<number>;
  checkpoints: number[];
}) {
  // Grows continuously left-to-right, no opacity involved at all.
  const scaleX = useTransform(animationProgress, [0, 1], [0, 1]);

  return (
    <div className="relative h-8 w-full">
      {/* fill */}
      <motion.div
        style={{ scaleX, transformOrigin: "left" }}
        className="absolute left-0 top-1/2 h-[3px] w-full -translate-y-1/2 bg-slate-200"
      />
      {/* checkpoints */}
      {checkpoints.map((p, i) => (
        <Checkpoint key={i} index={i} position={p} animationProgress={animationProgress} />
      ))}
    </div>
  );
}

function Checkpoint({
  index,
  position,
  animationProgress,
}: {
  index: number;
  position: number;
  animationProgress: MotionValue<number>;
}) {
  const opacity = useOneWayThreshold(animationProgress, position);

  return (
    <motion.div
      style={{ left: `${position * 100}%`, opacity }}
      className="absolute top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[4px] bg-neutral-800 text-xs font-bold text-white"
    >
      {index + 1}
    </motion.div>
  );
}