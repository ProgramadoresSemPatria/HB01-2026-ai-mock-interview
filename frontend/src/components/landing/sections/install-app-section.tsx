"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Smartphone } from "lucide-react";

import LandingCta from "@/components/landing/get-started-button";
import { ComingSoonBadge } from "@/components/coming-soon-badge";
import { PhonePracticeClip } from "@/components/landing/phone-practice-clip";
import { useSiteLocale } from "@/features/site-locale/site-locale-provider";

export default function InstallAppSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { t } = useSiteLocale();
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section
      ref={sectionRef}
      id="get-the-app"
      className="scroll-mt-24 bg-paper-white px-6 pb-[var(--section-gap)] md:px-10"
    >
      <motion.div
        className="landing-mist-card mx-auto grid max-w-[1120px] items-center gap-8 md:grid-cols-[1.05fr_1fr] md:gap-12 lg:gap-16"
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
        <div>
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-jade text-paper-white"
              aria-hidden
            >
              <Smartphone className="h-5 w-5" />
            </span>
            <ComingSoonBadge />
          </div>
          <h2 className="landing-heading mt-5">{t.installApp.title}</h2>
          <p className="landing-body mt-3 max-w-md">{t.installApp.body}</p>
          <ul className="manrope mt-5 space-y-2 text-[15px] text-[var(--color-ink-black)]">
            {t.installApp.points.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-jade"
                  aria-hidden
                />
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <LandingCta
              label={t.installApp.getTheApp}
              variant="solid"
              href="/download"
            />
            <LandingCta
              label={t.installApp.howToInstall}
              variant="outline"
              href="/download#install"
            />
          </div>
        </div>

        <motion.div
          initial={
            prefersReducedMotion
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.94 }
          }
          animate={
            isInView || prefersReducedMotion
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.94 }
          }
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
        >
          <PhonePracticeClip />
        </motion.div>
      </motion.div>
    </section>
  );
}
