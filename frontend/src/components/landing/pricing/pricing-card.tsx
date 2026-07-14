import LandingCta from "@/components/landing/get-started-button";

export interface PricingPlan {
  name: string;
  price: string;
  priceSub?: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
}

interface PricingCardProps {
  plan: PricingPlan;
}

export default function PricingCard({ plan }: PricingCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-[24px] p-8 ${
        plan.highlighted
          ? "landing-artifact border border-jade-light bg-paper-white"
          : "landing-mist-card"
      }`}
    >
      {plan.badge ? (
        <span
          className={`absolute right-6 top-6 ${
            plan.highlighted ? "manrope text-sm text-jade" : "landing-tag"
          }`}
        >
          {plan.badge}
        </span>
      ) : null}

      <div className="mb-8">
        <p className="manrope text-xl font-medium text-[var(--color-ink-black)]">
          {plan.name}
        </p>
        <div className="mt-4 flex items-end gap-1">
          <span className="instrument-serif text-5xl font-normal text-[var(--color-ink-black)]">
            {plan.price}
          </span>
          {plan.priceSub ? (
            <span className="manrope mb-1 text-sm text-[var(--color-slate-gray)]">
              {plan.priceSub}
            </span>
          ) : null}
        </div>
      </div>

      <ul className="mb-10 flex-1 space-y-3">
        {plan.bullets.map((bullet) => (
          <li
            key={bullet}
            className="manrope flex items-start gap-3 text-sm text-[var(--color-ink-black)]"
          >
            <span className="mt-0.5 text-[var(--color-ash-gray)]" aria-hidden>
              —
            </span>
            {bullet}
          </li>
        ))}
      </ul>

      <LandingCta
        href={plan.ctaHref}
        label={plan.ctaLabel}
        variant={plan.highlighted ? "solid" : "outline"}
        className="w-full text-center"
      />
    </div>
  );
}
