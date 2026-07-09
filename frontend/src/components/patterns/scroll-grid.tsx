import { ScrollRevealGrid } from "../landing-page/scroll-reveal-grid";

// Simple placeholder "wordmark" graphic — swap for your own logo/icon/SVG.
function Wordmark() {
  return (
    <div className="relative select-none">
      <span
        className="absolute -top-2 left-6 text-[24px] italic text-neutral-800" 
      >
        AI MOCK INTERVIEW
      </span>
      <span
        className="relative text-[56px] font-bold text-white"
      >
        HONE
      </span>
    </div>
  );
}

const ScrollGrid = () => {
  return (
    <main>
      <ScrollRevealGrid
        items={[
          {
            id: 1,
            graphic: <Wordmark />,
            title: "AI Resumes",
            description:
              "Instant analysis of your experience against role requirements.",
          },
          {
            id: 2,
            graphic: <Wordmark />,
            title: "Topic Tracking",
            description:
              "Hone monitors 40+ engineering domains to ensure you're covered across the entire full-stack spectrum.",
          },
          {
            id: 3,
            graphic: <Wordmark />,
            title: "Tech Review",
            description:
              "Engineering reviews that provide a detailed breakdown of your technical strengths.",
          },
        ]}
      />
    </main>
  );
}

export default ScrollGrid;