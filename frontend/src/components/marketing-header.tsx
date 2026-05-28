import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#practice", label: "Practice" },
  { href: "#about", label: "About" },
] as const;

export function MarketingHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-30">
      <div className="content-width pt-5">
        <div className="flex items-center justify-between rounded-full border border-black/6 bg-background/76 px-4 py-3 shadow-[0_12px_40px_rgba(26,22,18,0.06)] backdrop-blur-xl md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="orb-gradient size-7 rounded-full" />
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl tracking-[-0.04em] text-foreground">
                Hone
              </span>
              <span className="hidden text-[10px] uppercase tracking-[0.24em] text-muted-foreground md:block">
                AI mock interview
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "sm" }),
              "rounded-full border border-black/90 bg-[#101010] px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#101010]/90",
            )}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
