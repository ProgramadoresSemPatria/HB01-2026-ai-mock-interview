import { ArrowUp, ChevronLeft } from "lucide-react";

/** Generic phone frame — pure HTML/CSS, no real-device branding. */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[min(310px,80vw)]">
      <div className="rounded-[46px] bg-ink-black p-[10px] shadow-[0_40px_80px_-20px_rgba(10,92,74,0.35),0_18px_36px_-18px_rgba(0,0,0,0.45)]">
        {/* Side buttons */}
        <span
          className="absolute -left-[3px] top-[110px] h-12 w-[3px] rounded-l bg-ink-black"
          aria-hidden
        />
        <span
          className="absolute -right-[3px] top-[140px] h-16 w-[3px] rounded-r bg-ink-black"
          aria-hidden
        />
        <div className="relative aspect-[9/19.2] overflow-hidden rounded-[36px] bg-paper-white">
          {children}
        </div>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="manrope flex h-11 items-center justify-between px-6 pt-1 text-[12px] font-semibold text-ink-black">
      <span>9:41</span>
      <span
        className="absolute left-1/2 top-2.5 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-ink-black"
        aria-hidden
      />
      <span className="flex items-center gap-1" aria-hidden>
        <span className="flex items-end gap-[2px]">
          {[4, 6, 8, 10].map((h) => (
            <span
              key={h}
              className="w-[3px] rounded-sm bg-ink-black"
              style={{ height: h }}
            />
          ))}
        </span>
        <span className="ml-1 flex h-[11px] w-[22px] items-center rounded-[3px] border border-ink-black/80 p-[1.5px]">
          <span className="h-full w-[70%] rounded-[1.5px] bg-ink-black" />
        </span>
      </span>
    </div>
  );
}

function AppScreen() {
  return (
    <div className="flex h-full flex-col">
      <StatusBar />

      {/* App header */}
      <div className="flex items-center gap-2 border-b border-border-hairline px-4 pb-3 pt-1">
        <ChevronLeft
          size={18}
          strokeWidth={1.75}
          className="text-ash-gray"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="manrope truncate text-[13px] font-semibold text-ink-black">
            System Design
          </p>
          <p className="manrope text-[11px] text-ash-gray">
            Mid level · Question 3 of 6
          </p>
        </div>
        <span className="manrope rounded-full bg-jade-pale px-2 py-0.5 text-[10px] font-medium text-jade-deep">
          Live
        </span>
      </div>

      {/* Conversation */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-hidden bg-fog-white px-3 py-3">
        <div className="max-w-[86%] rounded-[16px] rounded-tl-[6px] bg-paper-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <p className="manrope mb-1 text-[10px] text-ash-gray">
            AI Interviewer
          </p>
          <p className="manrope text-[12.5px] leading-snug text-ink-black">
            Your resume mentions a feed service at 2M DAU. How would you shard
            it without hot partitions?
          </p>
        </div>

        <div className="ml-auto max-w-[86%] rounded-[16px] rounded-tr-[6px] bg-ink-black p-3">
          <p className="manrope text-[12.5px] leading-snug text-paper-white">
            Consistent hashing on user ID, then isolate celebrity keys into a
            fan-out-on-read path.
          </p>
        </div>

        <div className="max-w-[86%] rounded-[16px] rounded-tl-[6px] bg-paper-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <p className="manrope mb-1 text-[10px] text-ash-gray">
            AI Interviewer
          </p>
          <p className="manrope text-[12.5px] leading-snug text-ink-black">
            Good. What breaks first when a celebrity posts
            <span className="download-caret" aria-hidden />
          </p>
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border-hairline bg-paper-white px-3 pb-6 pt-2.5">
        <div className="flex items-center gap-2 rounded-[16px] border border-border-hairline py-1.5 pl-3 pr-1.5">
          <span className="manrope flex-1 text-[12px] text-smoke-gray">
            Type your answer…
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-jade text-paper-white">
            <ArrowUp size={14} strokeWidth={2} aria-hidden />
          </span>
        </div>
        <span
          className="mx-auto mt-3 block h-[4px] w-24 rounded-full bg-ink-black/85"
          aria-hidden
        />
      </div>
    </div>
  );
}

function FeedbackChip() {
  return (
    <div className="landing-artifact w-[200px] !p-4">
      <p className="landing-tag !text-[12px]">Session feedback</p>
      <p className="manrope mt-1 text-[22px] font-medium leading-none text-ink-black">
        78<span className="text-[15px] text-slate-gray"> /100</span>
      </p>
      <p className="manrope mt-2 text-[12px] leading-snug text-slate-gray">
        Strong trade-off framing. Go deeper on cache invalidation.
      </p>
    </div>
  );
}

function BacklogChip() {
  const topics = [
    { topic: "Cache invalidation", tag: "New" },
    { topic: "Rate limiting", tag: "Review" },
  ];
  return (
    <div className="landing-artifact w-[210px] !p-4">
      <p className="landing-tag mb-2 !text-[12px]">Study backlog</p>
      <ul className="space-y-1.5">
        {topics.map((t) => (
          <li
            key={t.topic}
            className="manrope flex items-center justify-between gap-3 text-[12.5px] text-ink-black"
          >
            <span className="truncate">{t.topic}</span>
            <span className="rounded-full bg-jade-pale px-2 py-0.5 text-[10px] text-jade-deep">
              {t.tag}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PhoneMockup() {
  return (
    <figure className="relative mx-auto w-full max-w-[560px]">
      <figcaption className="sr-only">
        Hone running as an installed app: a live, resume-aware system design
        interview on a phone, with session feedback and a study backlog.
      </figcaption>
      <div aria-hidden>
        <PhoneFrame>
          <AppScreen />
        </PhoneFrame>
      </div>

      <div
        className="landing-float pointer-events-none absolute bottom-[20%] left-0 hidden sm:block"
        style={{ rotate: "-3deg" }}
        aria-hidden
      >
        <FeedbackChip />
      </div>
      <div
        className="landing-float-delayed pointer-events-none absolute bottom-[13%] right-0 hidden sm:block"
        style={{ rotate: "2.5deg" }}
        aria-hidden
      >
        <BacklogChip />
      </div>
    </figure>
  );
}
