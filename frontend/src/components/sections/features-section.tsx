import {
  FeatureCard,
  type FeatureCardProps,
} from "@/components/patterns/feature-card";
import {
  TopicStatusCard,
  type TopicStatusCardProps,
} from "@/components/patterns/topic-status-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Surface } from "@/components/ui/surface";

type FeaturesSectionProps = {
  features: readonly FeatureCardProps[];
  topics: readonly TopicStatusCardProps[];
};

function FeaturesSection({ features, topics }: FeaturesSectionProps) {
  return (
    <section id="features" className="content-width section-spacing">
      <SectionHeader
        align="center"
        title={
          <>
            Do anything with{" "}
            <span className="font-normal italic text-white/80">Hone</span>
          </>
        }
      />

      <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {features.map((card) => (
          <FeatureCard key={card.title} {...card} monochrome />
        ))}

        <Surface
          variant="elevated"
          padding="xl"
          radius="xl"
          className="border-white/10 bg-white/5 xl:col-span-4"
        >
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div>
              <h3 className="font-display text-[2.4rem] leading-none tracking-[-0.05em] text-text-strong md:text-[3.3rem]">
                Topic
                <span className="block">Tracking</span>
              </h3>
              <p className="mt-5 max-w-md text-sm leading-7 text-text-muted md:text-base">
                Hone monitors 40+ engineering domains to ensure you&apos;re
                covered across the entire full-stack spectrum.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {topics.map((card) => (
                <TopicStatusCard key={card.title} {...card} monochrome />
              ))}
            </div>
          </div>
        </Surface>
      </div>
    </section>
  );
}

export { FeaturesSection };
