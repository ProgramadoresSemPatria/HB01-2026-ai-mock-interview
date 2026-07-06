import { Paperclip, SendHorizontal } from "lucide-react";

import { LevelPillGroup } from "@/components/patterns/level-pill-group";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { SectionHeader } from "@/components/ui/section-header";
import { Surface } from "@/components/ui/surface";

type PracticeSectionProps = {
  title: string;
  description: string;
  prompt: string;
  levels: readonly string[];
  activeLevel: string;
};

function PracticeSection({
  title,
  description,
  prompt,
  levels,
  activeLevel,
}: PracticeSectionProps) {
  return (
    <section
      id="practice"
      className="relative overflow-hidden bg-black py-24 md:py-36"
    >
      <div className="pointer-events-none absolute inset-0 dot-field opacity-25" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_28%),radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.04),transparent_24%),linear-gradient(180deg,#000000_0%,#050505_100%)]" />
      <div className="content-width relative z-10">
        <SectionHeader
          align="center"
          title={<span className="text-text-strong">{title}</span>}
          subtitle={
            <span className="text-text-muted">{description}</span>
          }
        />

        <Surface
          variant="glass"
          radius="xl"
          padding="xl"
          className="mx-auto mt-16 max-w-4xl border-white/10 bg-white/5 text-left shadow-[var(--shadow-inverse)]"
        >
          <h3 className="font-display text-2xl leading-tight tracking-[-0.04em] text-text-strong md:text-[2.15rem]">
            {prompt}
          </h3>

          <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6 text-sm text-text-muted">
            <Badge tone="neutral">Active Session</Badge>
            <LevelPillGroup levels={levels} active={activeLevel} />

            <div className="ml-auto flex items-center gap-2">
              <IconButton variant="pill" size="icon-sm" shape="pill">
                <Paperclip className="size-4" />
              </IconButton>
              <IconButton variant="primary" size="icon-sm" shape="pill">
                <SendHorizontal className="size-4" />
              </IconButton>
            </div>
          </div>
        </Surface>
      </div>
    </section>
  );
}

export { PracticeSection };
