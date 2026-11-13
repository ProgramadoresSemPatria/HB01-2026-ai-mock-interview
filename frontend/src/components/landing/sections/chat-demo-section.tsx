"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

import ProductPreviews from "@/components/landing/product-previews/product-previews";
import LandingCta from "@/components/landing/get-started-button";
import { LandingVideo } from "@/components/landing/landing-video";
import { useSiteLocale } from "@/features/site-locale/site-locale-provider";

export default function ChatDemoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { t } = useSiteLocale();
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  // Real-session clip grows from a tilted card to full size as it scrolls in.
  const clipRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: clipRef,
    offset: ["start end", "center center"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.4,
  });
  const clipScale = useTransform(progress, [0, 1], [0.78, 1]);
  const clipRotateX = useTransform(progress, [0, 1], [22, 0]);
  const clipY = useTransform(progress, [0, 1], [80, 0]);
  const clipOpacity = useTransform(progress, [0, 0.5, 1], [0.2, 0.85, 1]);
  const labelOpacity = useTransform(progress, [0.4, 0.9], [0, 1]);

  return (
    <section
      ref={sectionRef}
      id="demo"
      className="landing-section scroll-mt-24 bg-[var(--surface-section-fog)] px-6 md:px-10"
    >
      <motion.div
        className="mx-auto max-w-[1280px]"
        initial={
          prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
        }
        animate={
          isInView || prefersReducedMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 24 }
        }
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p className="landing-eyebrow mb-4 text-center md:mb-5">
          {t.chatDemo.eyebrow}
        </p>
        <h2 className="landing-heading-lg text-center">
          {t.chatDemo.title}
        </h2>
        <p className="landing-body mx-auto mt-6 max-w-2xl text-center">
          {t.chatDemo.subtitle}
        </p>


        <div
          ref={clipRef}
          className="mx-auto mt-12 max-w-[1120px] [perspective:1600px] md:mt-16"
        >
          <motion.p
            className="landing-tag mb-3 text-center"
            style={prefersReducedMotion ? undefined : { opacity: labelOpacity }}
          >
            {t.chatDemo.recordedLabel}
          </motion.p>
          <motion.div
            className="will-change-transform"
            style={
              prefersReducedMotion
                ? undefined
                : {
                    scale: clipScale,
                    rotateX: clipRotateX,
                    y: clipY,
                    opacity: clipOpacity,
                    transformOrigin: "50% 100%",
                  }
            }
          >
            <LandingVideo
              name="interview-chat"
              label={t.chatDemo.videoLabel}
              width={1280}
              height={800}
            />
          </motion.div>
        </div>

        <div className="mt-10 flex justify-center md:mt-12">
          <LandingCta
            label={t.common.getStarted}
            variant="solid"
            size="lg"
            href="/login"
          />
        </div>

        <ProductPreviews />
      </motion.div>
    </section>
  );
}
