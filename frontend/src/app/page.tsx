import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  Paperclip,
  Plus,
  Rocket,
  SendHorizontal,
  Terminal,
} from "lucide-react";

import { MarketingHeader } from "@/components/marketing-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const featureCards = [
  {
    title: "AI Resumes",
    description:
      "Instant analysis of your experience against role requirements.",
    variant: "resume",
  },
  {
    title: "Senior Mode",
    description:
      "Focusing on high-level system design and leadership signals.",
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

const orbColors = [
  "bg-[#1b1b1b]",
  "orb-gradient",
  "bg-[#5b6763]",
  "bg-[linear-gradient(135deg,#14866f_0%,#8be1cf_100%)]",
  "bg-[#d8ddd9]",
  "bg-[linear-gradient(135deg,#d85b58_0%,#2f8880_100%)]",
  "bg-[#e5e2e0]",
  "bg-[#0b8b73]",
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

type FeatureCardProps = {
  title: string;
  description: string;
  variant: "resume" | "senior" | "stream" | "review";
  badge?: string;
};

function FeatureCard({
  title,
  description,
  variant,
  badge,
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        "landing-panel min-h-[244px] p-6 transition-transform duration-300 hover:-translate-y-1",
        variant === "senior" && "border-primary/40 shadow-[0_24px_64px_rgba(11,139,115,0.14)]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-[1.85rem] leading-none tracking-[-0.04em] text-foreground">
          {title}
        </h3>
        {badge ? (
          <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-6">
        {variant === "resume" ? (
          <div className="space-y-3 opacity-70">
            <div className="h-2.5 rounded-full bg-black/10" />
            <div className="h-2.5 w-4/5 rounded-full bg-black/10" />
            <div className="h-2.5 w-1/2 rounded-full bg-primary/20" />
          </div>
        ) : null}

        {variant === "senior" ? (
          <div className="flex h-16 items-end gap-2">
            <div className="h-4 w-full rounded-t-full bg-primary/10" />
            <div className="h-8 w-full rounded-t-full bg-primary/20" />
            <div className="h-11 w-full rounded-t-full bg-primary/35" />
            <div className="h-14 w-full rounded-t-full bg-primary" />
          </div>
        ) : null}

        {variant === "stream" ? (
          <div className="rounded-[22px] bg-[#f5f1ec] p-4 font-mono text-sm text-muted-foreground">
            <span className="text-primary">&gt;</span> Getting feedback...
          </div>
        ) : null}

        {variant === "review" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Concurrency</span>
              <span className="font-semibold text-primary">92%</span>
            </div>
            <div className="h-2 rounded-full bg-black/8">
              <div className="h-full w-[92%] rounded-full bg-primary" />
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-8 max-w-[18rem] text-sm leading-7 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

function TopicPill({ title, status, tone }: (typeof topicCards)[number]) {
  const toneClass =
    tone === "critical"
      ? "bg-[#f8ded9] text-[#b24c3f]"
      : tone === "good"
        ? "bg-primary/10 text-primary"
        : "bg-[#ece9e3] text-[#5f625d]";

  return (
    <div className="rounded-[24px] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(24,20,18,0.05)]">
      <p className="text-sm font-semibold tracking-[-0.02em] text-foreground">
        {title}
      </p>
      <span
        className={cn(
          "mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
          toneClass,
        )}
      >
        {status}
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <main className="page-shell hero-grid overflow-x-hidden">
      <MarketingHeader />

      <section
        id="product"
        className="content-width relative pt-32 pb-24 md:pt-[10.5rem] md:pb-32"
      >
        <div className="mx-auto max-w-4xl text-center">
          <p className="landing-kicker">Powered by GPT-5 / Built for engineers</p>
          <h1 className="headline-balance mt-8 font-display text-5xl leading-none tracking-[-0.06em] text-foreground md:text-[5.75rem]">
            The interview
            <span className="mt-3 block font-normal italic text-primary">
              that prepares you
            </span>
          </h1>
        </div>

        <div className="relative mx-auto mt-14 max-w-5xl md:mt-16">
          <div className="landing-panel relative overflow-hidden px-0 pb-0 pt-0">
            <div className="border-b border-black/6 bg-[#f5f1ec] px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#ef8e8e]" />
                  <span className="size-2.5 rounded-full bg-[#d8bea1]" />
                  <span className="size-2.5 rounded-full bg-primary/60" />
                </div>
                <div className="flex items-center gap-3 rounded-full bg-white px-4 py-1.5 text-[11px] font-medium tracking-[0.02em] text-muted-foreground shadow-[0_8px_20px_rgba(25,20,18,0.06)]">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/35" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
                  </span>
                  Interview Session - Senior Level
                </div>
                <div className="w-10" />
              </div>
            </div>

            <div className="space-y-6 p-5 md:p-8">
              <div className="flex gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Bot className="size-4" />
                </div>
                <div className="max-w-[82%] rounded-[24px] rounded-tl-md bg-[#efe9e2] px-5 py-4 text-sm leading-7 text-[#5d5752] md:text-[15px]">
                  At Nubank, we handle millions of concurrent transactions. How
                  would you design a distributed lock mechanism for our credit
                  card ledger?
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <div className="max-w-[82%] rounded-[24px] rounded-tr-md bg-primary px-5 py-4 text-sm leading-7 text-primary-foreground md:text-[15px]">
                  I&apos;d start by considering Redis with the Redlock
                  algorithm, but given the ledger requirements, maybe a
                  consensus-based approach like Raft...
                </div>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#202020] text-white">
                  <Check className="size-4" />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Bot className="size-4" />
                </div>
                <div className="rounded-full bg-[#efe9e2] px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#c3bbb2]" />
                    <span className="size-2 rounded-full bg-[#c3bbb2]" />
                    <span className="size-2 rounded-full bg-[#c3bbb2]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-black/6 bg-white px-5 py-4 md:px-8">
              <div className="flex items-center gap-3 rounded-full border border-black/8 bg-[#fbfaf8] px-4 py-3 text-sm text-muted-foreground">
                <Terminal className="size-4 text-muted-foreground" />
                <span className="truncate">
                  Explain your architectural decision...
                </span>
                <span className="relative ml-auto flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/35" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
                </span>
              </div>
            </div>
          </div>

          <div className="landing-panel animate-float-delayed absolute -left-4 top-20 hidden max-w-[220px] p-5 md:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-primary">
              Context
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Analyzing candidate response for consistency versus availability
              trade-offs.
            </p>
          </div>

          <div className="orb-gradient animate-float-slow absolute -bottom-10 right-0 size-32 rounded-full md:size-40" />
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full border border-black bg-[#101010] px-7 text-[11px] font-semibold uppercase tracking-[0.24em] text-white hover:bg-[#101010]/90",
            )}
          >
            <Rocket className="size-4" />
            Start your first session
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Free for individual engineers. No credit card required.
          </p>
        </div>
      </section>

      <section id="features" className="content-width section-gap">
        <div className="text-center">
          <h2 className="font-display text-4xl tracking-[-0.05em] text-foreground md:text-[3.35rem]">
            Do anything with{" "}
            <span className="font-normal italic text-primary">Hone</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}

          <article className="landing-panel xl:col-span-4 p-7 md:p-10">
            <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
              <div>
                <h3 className="font-display text-[2.4rem] leading-none tracking-[-0.05em] text-foreground md:text-[3.3rem]">
                  Topic
                  <span className="block">Tracking</span>
                </h3>
                <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground md:text-base">
                  Hone monitors 40+ engineering domains to ensure you&apos;re
                  covered across the entire full-stack spectrum.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {topicCards.map((card) => (
                  <TopicPill key={card.title} {...card} />
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section
        id="practice"
        className="relative overflow-hidden bg-[#070808] py-24 md:py-36"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(11,139,115,0.22),transparent_28%),radial-gradient(circle_at_80%_60%,rgba(91,103,99,0.24),transparent_24%),linear-gradient(180deg,#090909_0%,#060707_100%)]" />
        <div className="content-width relative z-10 text-center">
          <h2 className="font-display text-5xl leading-none tracking-[-0.06em] text-white md:text-[5rem]">
            Your personal Tech Lead
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
            What can Hone do? Discover everything that can be delegated, from
            wrangling system architecture to planning your interview roadmap.
          </p>

          <div className="mx-auto mt-16 max-w-4xl rounded-[30px] border border-white/10 bg-white/86 p-6 text-left shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl md:p-8">
            <h3 className="font-display text-2xl leading-tight tracking-[-0.04em] text-[#181614] md:text-[2.15rem]">
              Design a highly available notification service that supports 100k
              requests per second.
            </h3>

            <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-black/8 pt-6 text-sm text-muted-foreground">
              <span className="rounded-full border border-black/8 bg-[#f3efe9] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em]">
                Active Session
              </span>
              <button className="rounded-full px-3 py-2 transition-colors hover:bg-[#f3efe9]">
                Junior
              </button>
              <button className="rounded-full px-3 py-2 transition-colors hover:bg-[#f3efe9]">
                Mid-Level
              </button>
              <button className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground">
                Senior+
              </button>

              <div className="ml-auto flex items-center gap-2">
                <button className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-[#f3efe9]">
                  <Paperclip className="size-4" />
                </button>
                <button className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105">
                  <SendHorizontal className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden py-12 md:py-16">
        <div className="content-width">
          <div className="grid grid-flow-col justify-center gap-5">
            {orbColors.map((orbClass, index) => (
              <div
                key={`${orbClass}-${index}`}
                className={cn(
                  "orb-sway size-14 shrink-0 rounded-full shadow-[0_14px_28px_rgba(17,14,12,0.16)] md:size-16",
                  index % 2 === 0 ? "orb-sway-up" : "orb-sway-down",
                  orbClass,
                )}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="content-width section-gap">
        <div className="text-center">
          <p className="font-display text-2xl italic text-primary md:text-[2rem]">
            Questions
          </p>
          <h2 className="mt-2 font-display text-4xl tracking-[-0.05em] text-foreground md:text-[3.25rem]">
            FAQ
          </h2>
        </div>

        <div className="mx-auto mt-14 max-w-3xl">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group border-b border-black/8 py-6"
            >
              <summary className="flex list-none items-center justify-between gap-6 text-left [&::-webkit-details-marker]:hidden">
                <span className="font-display text-[1.4rem] tracking-[-0.04em] text-foreground md:text-[1.6rem]">
                  {item.question}
                </span>
                <span className="flex size-8 items-center justify-center rounded-full border border-black/10 text-muted-foreground transition-transform duration-300 group-open:rotate-45">
                  <Plus className="size-4" />
                </span>
              </summary>
              <p className="max-w-2xl pt-4 text-sm leading-7 text-muted-foreground md:text-base">
                {item.answer}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <div className="size-10 rounded-full bg-primary/10" />
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#060606] py-24 md:py-32">
        <div className="star-field absolute inset-0 opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_16%),radial-gradient(circle_at_70%_40%,rgba(255,255,255,0.08),transparent_18%),linear-gradient(135deg,rgba(255,255,255,0.02),transparent_45%)]" />
        <div className="content-width relative z-10 text-center">
          <h2 className="font-display text-5xl leading-none tracking-[-0.06em] text-white md:text-[5rem]">
            Interview with
            <span className="mt-2 block font-normal italic text-white">
              confidence
            </span>
          </h2>

          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "mt-10 rounded-full border-white/20 bg-white text-[#090909] hover:bg-white/90",
            )}
          >
            Use Hone
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/6 py-16">
        <div className="content-width flex flex-col items-center gap-8 text-center">
          <Link href="/" className="flex items-center gap-3">
            <span className="orb-gradient size-7 rounded-full" />
            <span className="font-display text-xl tracking-[-0.04em] text-foreground">
              Hone
            </span>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            <Link href="#">X</Link>
            <Link href="#">LinkedIn</Link>
            <Link href="#">Instagram</Link>
            <Link href="#">Legal</Link>
            <Link href="#">Privacy</Link>
          </div>

          <div className="space-y-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            <p>(c) 2026 Hone AI. All rights reserved.</p>
            <p>Cosmic curiosity</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
