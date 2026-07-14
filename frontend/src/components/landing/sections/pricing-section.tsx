"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import PricingCard, {
  type PricingPlan,
} from "@/components/landing/pricing/pricing-card";

const PLANS: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    priceSub: "/ month",
    bullets: [
      "3 mock interviews per month",
      "Core domains: Algorithms, APIs",
      "Basic feedback summary",
      "No credit card required",
    ],
    ctaLabel: "Get started free",
    ctaHref: "/login",
  },
  {
    name: "Pro",
    price: "$29",
    priceSub: "/ month",
    bullets: [
      "Unlimited mock interviews",
      "All 40+ engineering domains",
      "Full feedback report with scoring",
      "Progress dashboard & heatmap",
      "Shareable PDF reports",
    ],
    ctaLabel: "Start Pro",
    ctaHref: "/login",
    highlighted: true,
    badge: "Most popular",
  },
  {
    name: "Teams",
    price: "Custom",
    bullets: [
      "Everything in Pro",
      "Team progress analytics",
      "Admin dashboard",
      "SSO & audit logs",
      "Dedicated support",
    ],
    ctaLabel: "Contact us",
    ctaHref: "mailto:hello@honeyourcraft.com",
  },
];

export default function PricingSection() {
  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section
      ref={ref}
      id="pricing"
      className="landing-section scroll-mt-24 bg-[var(--surface-section-fog)] px-6"
    >
      <motion.div
        className="mx-auto max-w-[1200px]"
        initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        animate={
          isInView || prefersReducedMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 24 }
        }
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p className="landing-tag mb-4 text-center">Pricing</p>
        <h2 className="landing-heading-lg text-center">
          Simple, transparent plans
        </h2>
        <p className="landing-body mx-auto mt-4 max-w-xl text-center">
          Start free. Upgrade when the loop becomes part of your week.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
