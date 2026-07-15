"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { InterviewChatDemo } from "@/components/landing/interview-chat-demo/interview-chat-demo";
import ProductPreviews from "@/components/landing/product-previews/product-previews";
import LandingCta from "@/components/landing/get-started-button";

export default function ChatDemoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  return (
    <section
      ref={sectionRef}
      id="demo"
      className="landing-section scroll-mt-24 bg-[var(--surface-section-fog)] px-6"
    >
      <motion.div
        className="mx-auto max-w-[1200px]"
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
        <p className="landing-tag mb-4 text-center">Live demo</p>
        <h2 className="landing-heading-lg text-center">
          See the interview in action
        </h2>
        <p className="landing-body mx-auto mt-4 max-w-xl text-center">
          Watch a scripted session — questions, reasoning, and follow-ups the
          way a real loop feels.
        </p>

        <div className="landing-artifact mt-12 overflow-hidden p-0">
          <InterviewChatDemo />
        </div>

        <div className="mt-8 flex justify-center">
          <LandingCta label="Get started" variant="solid" href="/login" />
        </div>

        <ProductPreviews />
      </motion.div>
    </section>
  );
}
