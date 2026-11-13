"use client";

import Image from "next/image";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";

import { ComingSoonBadge } from "@/components/coming-soon-badge";
import { useSiteLocale } from "@/features/site-locale/site-locale-provider";

// Same basePath source the other install UI uses for public/ assets.
const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? "";

const PILL =
  "manrope inline-flex h-11 w-full items-center justify-center rounded-full px-5 text-[15px] font-normal transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-jade/30 sm:w-auto";

type ComingSoonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Shown instead of the native install prompt while the installable app is
 * still in development. Copy follows the public-site locale and falls back to
 * English where no SiteLocaleProvider is mounted (logged-in app).
 */
export function ComingSoonDialog({ open, onOpenChange }: ComingSoonDialogProps) {
  const { t } = useSiteLocale();
  const copy = t.comingSoonDialog;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 isolate z-[60] bg-black/20 duration-150 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-border-hairline bg-paper-white p-6 text-left shadow-[0_24px_60px_-20px_rgba(10,92,74,0.35),0_12px_28px_-16px_rgba(0,0,0,0.3)] outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 sm:p-7">
          <div className="flex items-center gap-3">
            <Image
              src={`${BASE_PATH}/icons/icon-192.png`}
              alt=""
              width={48}
              height={48}
              unoptimized
              className="size-12 shrink-0 rounded-[14px]"
            />
            <ComingSoonBadge />
          </div>
          <Dialog.Title className="manrope mt-5 text-[21px] font-medium leading-[1.25] tracking-[-0.2px] text-ink-black">
            {copy.title}
          </Dialog.Title>
          <Dialog.Description className="manrope mt-2 text-[15px] leading-relaxed text-slate-gray">
            {copy.body}
          </Dialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Dialog.Close
              className={`${PILL} cursor-pointer border border-ink-black bg-transparent text-ink-black`}
            >
              {copy.gotIt}
            </Dialog.Close>
            <Link
              href="/login"
              className={`${PILL} border border-jade bg-jade text-paper-white`}
              onClick={() => onOpenChange(false)}
            >
              {copy.useInBrowser}
            </Link>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
