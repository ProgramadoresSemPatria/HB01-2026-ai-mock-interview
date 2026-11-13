import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type MobilePanelToggleProps = {
  open: boolean;
  onToggle: () => void;
  /** id of the element whose visibility this button controls. */
  controls: string;
  /** Accessible name, e.g. "practice settings". */
  label: string;
  className?: string;
};

/**
 * Show/hide button for the side panels (practice settings, feedback list,
 * study history) that stack above the main pane on phones and portrait
 * tablets (next to the app sidebar a second column would leave the main pane
 * ~200px wide). Hidden from lg up, where the panel is a permanent column.
 */
export function MobilePanelToggle({
  open,
  onToggle,
  controls,
  label,
  className,
}: MobilePanelToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={`${open ? "Hide" : "Show"} ${label}`}
      className={cn(
        "-my-2 -mr-2 ml-auto inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1 rounded-full px-3 text-xs font-semibold text-jade-deep transition-colors hover:bg-jade-pale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade focus-visible:ring-offset-2 lg:hidden",
        className,
      )}
    >
      {open ? "Hide" : "Show"}
      <ChevronDown
        aria-hidden="true"
        className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
      />
    </button>
  );
}
