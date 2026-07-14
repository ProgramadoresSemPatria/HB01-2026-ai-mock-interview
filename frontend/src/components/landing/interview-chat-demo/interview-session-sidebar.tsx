import {
  BarChart3,
  Briefcase,
  Building2,
  Circle,
  Clock,
  Sparkles,
} from "lucide-react";

import type { SessionMeta } from "./types";

type InterviewSessionSidebarProps = {
  meta: SessionMeta;
  contextText: string;
};

type MetaRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function MetaRow({ icon, label, value }: MetaRowProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-[var(--color-ash-gray)]">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="landing-tag">{label}</p>
        <p className="manrope mt-0.5 text-sm text-[var(--color-ink-black)]">
          {value}
        </p>
      </div>
    </div>
  );
}

export function InterviewSessionSidebar({
  meta,
  contextText,
}: InterviewSessionSidebarProps) {
  return (
    <aside className="interview-chat-demo__sidebar flex w-full shrink-0 flex-col border-b border-[var(--color-border-hairline)] md:w-[280px] md:border-b-0 md:border-r">
      <div className="flex flex-1 flex-col p-6">
        <p className="landing-tag">Interview session</p>
        <h3 className="instrument-serif mt-2 text-3xl font-normal text-[var(--color-ink-black)] md:text-4xl">
          {meta.level}
        </h3>

        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-1">
          <MetaRow
            icon={<Briefcase className="size-3.5" strokeWidth={1.5} />}
            label="Role"
            value={meta.role}
          />
          <MetaRow
            icon={<Building2 className="size-3.5" strokeWidth={1.5} />}
            label="Company"
            value={meta.company}
          />
          <MetaRow
            icon={<BarChart3 className="size-3.5" strokeWidth={1.5} />}
            label="Difficulty"
            value={meta.difficulty}
          />
          <MetaRow
            icon={<Clock className="size-3.5" strokeWidth={1.5} />}
            label="Duration"
            value={meta.duration}
          />
          <div className="col-span-2 md:col-span-1">
            <MetaRow
              icon={<Sparkles className="size-3.5" strokeWidth={1.5} />}
              label="Focus Areas"
              value={meta.focusAreas}
            />
          </div>
        </div>

        <div className="mt-6 pt-4 md:mt-auto md:pt-8">
          <div className="rounded-[16px] bg-[var(--color-mist-gray)] p-4">
            <div className="flex items-center gap-2">
              <Circle className="size-2.5 fill-[var(--color-ash-gray)] text-[var(--color-ash-gray)]" />
              <span className="landing-tag">Context</span>
            </div>
            <p className="manrope mt-3 text-xs leading-relaxed text-[var(--color-slate-gray)]">
              {contextText}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
