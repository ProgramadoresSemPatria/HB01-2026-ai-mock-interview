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
          },
          {
            id: 2,
            graphic: <LandingWordmark />,
            title: "TOPIC TRACKING",
            description:
              "Hone monitors 40+ engineering domains to ensure you're covered across the entire full-stack spectrum.",
          },
          {
            id: 3,
            graphic: <LandingWordmark />,
            title: "TECH REVIEW",
            description:
              "Engineering reviews that provide a detailed breakdown of your technical strengths.",
          },
        ]}
      />
    </main>
  );
};

export default ScrollGrid;
