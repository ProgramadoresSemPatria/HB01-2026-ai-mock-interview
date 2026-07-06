import { FeaturesSection } from "@/components/sections/features-section";
import { FaqSection } from "@/components/sections/faq-section";
import { FinalCtaSection } from "@/components/sections/final-cta-section";
import { HeroSection } from "@/components/sections/hero-section";
import { MarketingFooter } from "@/components/sections/marketing-footer";
import { OrbStripSection } from "@/components/sections/orb-strip-section";
import { PracticeSection } from "@/components/sections/practice-section";
import { MarketingShell } from "@/components/shells/marketing-shell";

const featureCards = [
  {
    title: "AI Resumes",
    description:
      "Instant analysis of your experience against role requirements.",
    variant: "resume",
  },
  {
    title: "Senior Mode",
    description: "Focusing on high-level system design and leadership signals.",
    variant: "senior",
    badge: "Active",
  },
  {
    title: "Streaming",
    description: "Real-time adaptive questioning based on your last answer.",
    variant: "stream",
  },
  {
    title: "Tech Review",
    description: "Detailed breakdown of your technical strengths.",
    variant: "review",
  },
] as const;

const topicCards = [
  { title: "Distributed Consensus", status: "Critical", tone: "critical" },
  { title: "CAP Theorem", status: "Mastered", tone: "good" },
  { title: "Kafka Internals", status: "Review", tone: "neutral" },
  { title: "Query Plan Ops", status: "Mastered", tone: "good" },
  { title: "LRU Caching", status: "Mastered", tone: "good" },
  { title: "Binary Search", status: "Mastered", tone: "good" },
] as const;

const faqItems = [
  {
    question: "What levels does Hone support?",
    answer:
      "We support practice tracks from Junior to Staff and Principal, with tailored prompts for backend, frontend, full-stack, and mobile interviews.",
  },
  {
    question: "Is my interview data private?",
    answer:
      "Yes. Sessions are scoped to your account context and are used only to drive the interview flow, final feedback, and review backlog.",
  },
  {
    question: "Can I invite my team?",
    answer:
      "Yes. Team practice flows can share curated interview prompts, review patterns, and learning loops across engineers.",
  },
  {
    question: "How does the pricing work?",
    answer:
      "Individual practice starts free. Team features and deeper review workflows can be layered in later as premium workspace features.",
  },
] as const;

const orbTones = [
  "void",
  "ash",
  "smoke",
  "mist",
  "pearl",
  "silver",
  "graphite",
  "ink",
] as const;

export default function Home() {
  return (
    <MarketingShell>
      <HeroSection
        kicker="Powered by GPT-5 / Built for engineers"
        title="The interview"
        highlight="that prepares you"
        ctaHref="/login"
        ctaLabel="Start your first session"
        supportingText="Free for individual engineers. No credit card required."
      />

      <FeaturesSection features={featureCards} topics={topicCards} />

      <PracticeSection
        title="Your personal Tech Lead"
        description="What can Hone do? Discover everything that can be delegated, from wrangling system architecture to planning your interview roadmap."
        prompt="Design a highly available notification service that supports 100k requests per second."
        levels={["Junior", "Mid-Level", "Senior+"]}
        activeLevel="Senior+"
      />

      <OrbStripSection tones={orbTones} />
      <FaqSection items={faqItems} />
      <FinalCtaSection
        title="Interview with"
        highlight="confidence"
        ctaHref="/login"
        ctaLabel="Use Hone"
      />
      <MarketingFooter />
    </MarketingShell>
  );
}
