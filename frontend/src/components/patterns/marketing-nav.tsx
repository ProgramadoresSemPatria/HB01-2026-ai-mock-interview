import Link from "next/link";

import { BrandMark } from "@/components/patterns/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const defaultLinks = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#practice", label: "Practice" },
  { href: "#about", label: "About" },
] as const;

function MarketingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="content-width pt-5">
        <nav
          className={cn(
            "flex items-center justify-between gap-4 rounded-full",
            "border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-md",
          )}
        >
          <BrandMark />

          <div className="hidden items-center gap-8 text-sm text-white/55 md:flex">
            {defaultLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors duration-200 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm", shape: "pill" }),
              "border-white/30 bg-white px-4 text-[0.6875rem] uppercase tracking-[0.18em] text-black hover:bg-white/90",
            )}
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

export { MarketingNav };
