import Link from "next/link";

import { BrandMark } from "@/components/patterns/brand-mark";

function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-black py-16">
      <div className="content-width flex flex-col items-center gap-8 text-center">
        <BrandMark />

        <div className="flex flex-wrap items-center justify-center gap-6 text-[0.6875rem] font-medium uppercase tracking-[0.24em] text-text-muted">
          <Link href="#" className="transition-colors hover:text-white">
            X
          </Link>
          <Link href="#" className="transition-colors hover:text-white">
            LinkedIn
          </Link>
          <Link href="#" className="transition-colors hover:text-white">
            Instagram
          </Link>
          <Link href="#" className="transition-colors hover:text-white">
            Legal
          </Link>
          <Link href="#" className="transition-colors hover:text-white">
            Privacy
          </Link>
        </div>

        <div className="space-y-2 text-[0.6875rem] uppercase tracking-[0.24em] text-text-muted">
          <p>(c) 2026 Hone AI. All rights reserved.</p>
          <p>Cosmic curiosity</p>
        </div>
      </div>
    </footer>
  );
}

export { MarketingFooter };
