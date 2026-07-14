import { type ReactNode } from "react";

import { ScrollRevealGrid } from "@/components/landing/scroll-reveal-grid";
import LandingWordmark from "@/components/landing/landing-wordmark";

const ScrollGrid = ({ header }: { header?: ReactNode }) => {
  return (
    <main>
      <ScrollRevealGrid
        header={header}
        items={[
          {
            id: 1,
            graphic: <LandingWordmark />,
            title: "AI RESUMES",
            description:
              "Instant analysis of your experience against role requirements.",
            bullets: [
              "Gap analysis vs. job description",
              "Keyword strength scoring",
              "Tailored improvement suggestions",
            ],
            ctaLabel: "Analyse my resume",
            ctaHref: "/login",
          },
          {
            id: 2,
            graphic: <LandingWordmark />,
            title: "TOPIC TRACKING",
            description:
              "Hone monitors 40+ engineering domains to ensure you're covered across the entire full-stack spectrum.",
            bullets: [
              "40+ domains: System Design, APIs, Algorithms…",
              "Per-domain progress heatmap",
              "Adaptive question weighting",
            ],
            ctaLabel: "See all domains",
            ctaHref: "/#features",
          },
          {
            id: 3,
            graphic: <LandingWordmark />,
            title: "TECH REVIEW",
            description:
              "Engineering reviews that provide a detailed breakdown of your technical strengths.",
            bullets: [
              "Strengths & growth areas per session",
              "0 canned answers detected metric",
              "Shareable PDF report",
            ],
            ctaLabel: "See a sample report",
            ctaHref: "/login",
          },
        ]}
      />
    </main>
  );
};

export default ScrollGrid;
