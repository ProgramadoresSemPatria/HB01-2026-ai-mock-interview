"use client";

import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import {
  useInterviewLocale,
  type InterviewLocale,
} from "./use-interview-locale";

const OPTIONS: { value: InterviewLocale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "pt", label: "PT" },
];

export function InterviewLocaleSelector() {
  const { locale, setLocale, isReady } = useInterviewLocale();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSelect(next: InterviewLocale) {
    if (!isReady || isSaving || next === locale) return;
    setIsSaving(true);
    try {
      await setLocale(next);
    } catch {
      toast.error("Failed to update interview language");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-(--muted-foreground) uppercase tracking-wider">
        Interview language
      </label>
      <div className="grid grid-cols-2 gap-1">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={!isReady || isSaving}
            onClick={() => void handleSelect(opt.value)}
            className={cn(
              "flex items-center justify-center py-2 px-1 border rounded-lg text-center transition-all cursor-pointer",
              locale === opt.value
                ? "border-(--primary) bg-(--accent)/20 text-(--primary) font-semibold"
                : "border-(--border) text-(--foreground) hover:bg-(--muted)/40",
              (!isReady || isSaving) && "opacity-50 pointer-events-none",
            )}
          >
            <span className="text-xs">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
