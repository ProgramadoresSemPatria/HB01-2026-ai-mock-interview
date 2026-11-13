"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { InterviewChatDemo } from "@/components/landing/interview-chat-demo/interview-chat-demo";
import ProductPreviews from "@/components/landing/product-previews/product-previews";
import LandingCta from "@/components/landing/get-started-button";
import { LandingVideo } from "@/components/landing/landing-video";

export default function ChatDemoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

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
        <p className="landing-eyebrow mb-4 text-center md:mb-5">Live demo</p>
        <h2 className="landing-heading-lg text-center">
          See the interview in action
        </h2>
        <p className="landing-body mx-auto mt-6 max-w-2xl text-center">
          Watch a scripted session — questions, reasoning, and follow-ups the
          way a real loop feels.
        </p>

        <div className="landing-artifact mt-12 overflow-hidden !p-0 md:mt-16">
          <InterviewChatDemo />
        </div>

        <div className="mx-auto mt-12 max-w-[1040px] md:mt-16">
          <p className="landing-tag mb-3 text-center">
            Recorded from a real session
          </p>
          <LandingVideo
            name="interview-chat"
            label="A candidate answers a question and the AI interviewer streams its follow-up in a real Hone session"
            width={1280}
            height={800}
          />
        </div>

        <div className="mt-10 flex justify-center md:mt-12">
          <LandingCta label="Get started" variant="solid" size="lg" href="/login" />
        </div>

        <ProductPreviews />
      </motion.div>
    </section>
  );
}
