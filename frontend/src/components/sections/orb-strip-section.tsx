import { cn } from "@/lib/utils";

type OrbStripSectionProps = {
  tones: readonly string[];
};

const toneClasses: Record<string, string> = {
  void: "bg-[#0a0a0a]",
  ash: "bg-[#1a1a1a]",
  smoke: "bg-[#333333]",
  mist: "bg-[#555555]",
  pearl: "bg-[#888888]",
  silver: "bg-[#aaaaaa]",
  graphite: "bg-[#cccccc]",
  ink: "bg-[#ffffff]",
};

function OrbStripSection({ tones }: OrbStripSectionProps) {
  return (
    <section className="overflow-hidden py-12 md:py-16">
      <div className="content-width">
        <div className="grid grid-flow-col justify-center gap-5">
          {tones.map((tone, index) => (
            <div
              key={`${tone}-${index}`}
              className={cn(
                "size-14 shrink-0 rounded-full shadow-[0_14px_28px_rgba(0,0,0,0.4)] md:size-16",
                index % 2 === 0
                  ? "[animation:orb-sway-up_4.8s_ease-in-out_infinite]"
                  : "[animation:orb-sway-down_4.8s_ease-in-out_infinite]",
                toneClasses[tone] ?? "bg-[#444444]",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export { OrbStripSection };
