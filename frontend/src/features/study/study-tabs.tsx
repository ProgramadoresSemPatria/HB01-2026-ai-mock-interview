"use client";

import { cn } from "@/lib/utils";

const TABS = [
  { value: "active", label: "Active" },
  { value: "learned", label: "Learned" },
] as const;

type StudyTab = (typeof TABS)[number]["value"];

export type StudyTabsProps = {
  activeTab: StudyTab;
  onTabChange: (tab: StudyTab) => void;
};

export function StudyTabs({ activeTab, onTabChange }: StudyTabsProps) {
  return (
    <div className="flex items-center gap-6 border-b border-(--border)">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
          className={cn(
            "cursor-pointer pb-3 text-sm transition-colors",
            activeTab === tab.value
              ? "border-b-2 border-(--primary) font-semibold text-(--foreground)"
              : "text-(--muted-foreground) hover:text-(--foreground)",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
