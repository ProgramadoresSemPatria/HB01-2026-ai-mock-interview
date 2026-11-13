"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { PhonePracticeClip } from "@/components/landing/phone-practice-clip";
import { useSiteLocale } from "@/features/site-locale/site-locale-provider";

const COPY = {
  en: {
    eyebrow: "On the go",
    title: "Your interview coach, right in your pocket",
    body: "Earbuds in, phone in hand — run a mock interview from the couch, the commute or the coffee line. Same sessions, same feedback, same progress as on your laptop.",
    points: [
      "Answer out loud, like the real thing",
      "Pick up any session where you left off",
      "Feedback and study topics synced to your account",
    ],
  },
  pt: {
    eyebrow: "Onde você estiver",
    title: "Seu treinador de entrevistas no bolso",
    body: "Fone no ouvido, celular na mão — faça uma entrevista simulada no sofá, no trajeto ou na fila do café. Mesmas sessões, mesmo feedback e o mesmo progresso do notebook.",
    points: [
      "Responda em voz alta, como na entrevista real",
      "Retome qualquer sessão de onde parou",
      "Feedback e tópicos de estudo sincronizados na sua conta",
    ],
  },
} as const;

export default function DownloadVideoSection() {
  const { locale } = useSiteLocale();
  const copy = COPY[locale === "pt" ? "pt" : "en"];
  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const shown = isInView || prefersReducedMotion;

  return (
    <section
      ref={ref}
      aria-labelledby="download-video-title"
      className="landing-section overflow-x-clip bg-paper-white px-6"
    >
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-[1.15fr_1fr] md:gap-14 lg:gap-20">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94, y: 30 }}
          animate={shown ? { opacity: 1, scale: 1, y: 0 } : undefined}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <PhonePracticeClip mediaClassName="aspect-video object-center" />
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, x: 32 }}
          animate={shown ? { opacity: 1, x: 0 } : undefined}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
        >
          <p className="landing-tag mb-3">{copy.eyebrow}</p>
          <h2 id="download-video-title" className="landing-heading">
            {copy.title}
          </h2>
          <p className="manrope mt-4 text-[17px] leading-[1.55] text-slate-gray">
            {copy.body}
          </p>
          <ul className="manrope mt-6 space-y-2.5 text-[15px] text-ink-black">
            {copy.points.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <span
                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-jade"
                  aria-hidden
                />
                {point}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
