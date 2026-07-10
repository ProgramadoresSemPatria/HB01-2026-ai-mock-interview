"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { InterviewChatDemo } from "@/components/landing/interview-chat-demo/interview-chat-demo";

export default function ChatDemoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  return (
    <section
      ref={sectionRef}
      id="demo"
      className="landing-canvas section-spacing scroll-mt-24 px-6"
    >
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 }}
        animate={
          isInView || prefersReducedMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 48 }
        }
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        <h2 className="instrument-serif mb-12 text-center text-5xl font-normal text-white md:text-7xl">
          See the Interview in Action
        </h2>
        <div className="mx-auto max-w-6xl">
          <InterviewChatDemo />
        </div>
      </motion.div>
    </section>
  );
}
