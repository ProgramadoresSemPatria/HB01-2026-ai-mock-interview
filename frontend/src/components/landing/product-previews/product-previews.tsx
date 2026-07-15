import { DashboardPreview } from "@/components/product-previews/dashboard-preview";

const STRENGTHS = [
  "Articulated trade-offs without prompting",
  "Identified bottleneck in O(n²) approach",
  "Proposed horizontal scaling strategy",
];

const GROWTH_AREAS = [
  "CAP theorem application in edge cases",
  "Latency vs. throughput framing",
  "Consensus algorithm depth",
];

function FeedbackPreview() {
  return (
    <div className="landing-artifact p-6">
      <p className="landing-tag mb-1">Session report</p>
      <h4 className="manrope mb-6 text-xl font-medium text-[var(--color-ink-black)]">
        System Design — Ride Share App
      </h4>

      <div className="mb-5 grid grid-cols-3 gap-4 rounded-[16px] bg-[var(--color-mist-gray)] p-4">
        {[
          { label: "Independent thinking", value: "High" },
          { label: "Canned answers", value: "0" },
          { label: "Reasoning validated", value: "100%" },
        ].map((m) => (
          <div key={m.label} className="text-center">
            <p className="manrope text-lg font-medium text-[var(--color-ink-black)]">
              {m.value}
            </p>
            <p className="landing-tag mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <p className="landing-tag mb-2">Strengths</p>
        <ul className="space-y-1">
          {STRENGTHS.map((s) => (
            <li
              key={s}
              className="manrope flex items-start gap-2 text-xs text-[var(--color-ink-black)]"
            >
              <span className="mt-1 text-[var(--color-ash-gray)]" aria-hidden>
                +
              </span>
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="landing-tag mb-2">Growth areas</p>
        <ul className="space-y-1">
          {GROWTH_AREAS.map((g) => (
            <li
              key={g}
              className="manrope flex items-start gap-2 text-xs text-[var(--color-ink-black)]"
            >
              <span className="mt-1 text-[var(--color-ash-gray)]" aria-hidden>
                →
              </span>
              {g}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function ProductPreviews() {
  return (
    <div className="mt-16">
      <div className="mb-8 text-center">
        <p className="landing-tag">After every session</p>
        <h3 className="landing-heading mt-3">
          You answer. It measures exactly where you stand.
        </h3>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="landing-tag mb-3">Progress dashboard</p>
          <DashboardPreview />
        </div>
        <div>
          <p className="landing-tag mb-3">Feedback report</p>
          <FeedbackPreview />
        </div>
      </div>
    </div>
  );
}
