import { FaqItem, type FaqItemProps } from "@/components/patterns/faq-item";
import { SectionHeader } from "@/components/ui/section-header";

type FaqSectionProps = {
  items: readonly FaqItemProps[];
};

function FaqSection({ items }: FaqSectionProps) {
  return (
    <section id="about" className="content-width section-spacing">
      <SectionHeader
        align="center"
        eyebrow={
          <p className="font-display text-2xl italic text-white/60 md:text-[2rem]">
            Questions
          </p>
        }
        title="FAQ"
      />

      <div className="mx-auto mt-14 max-w-3xl">
        {items.map((item) => (
          <FaqItem key={item.question} {...item} />
        ))}
      </div>

      <div className="mt-14 flex justify-center">
        <div className="size-10 rounded-full bg-white/10" />
      </div>
    </section>
  );
}

export { FaqSection };
