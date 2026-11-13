"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import LandingCta from "@/components/landing/get-started-button";
import { ComingSoonBadge } from "@/components/coming-soon-badge";
import { useSiteLocale } from "@/features/site-locale/site-locale-provider";
import { SiteLocaleSwitcher } from "@/features/site-locale/site-locale-switcher";

const NAV_LINKS = [
  { key: "product", href: "/#features" },
  { key: "howItWorks", href: "/#demo" },
  { key: "getTheApp", href: "/download", soon: true },
] as const;

const SCROLL_THRESHOLD = 24;

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useSiteLocale();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled || open
          ? "border-b border-border-hairline bg-paper-white"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        className="mx-auto flex h-16 w-full max-w-[1360px] items-center justify-between px-6 md:h-20 md:px-10"
        aria-label={t.nav.ariaLabel}
      >
        <Link
          href="/"
          className="instrument-serif text-[26px] font-normal tracking-tight text-[var(--color-ink-black)] md:text-[30px]"
          aria-label={t.common.homeAriaLabel}
        >
          Hone
        </Link>

        <div className="hidden items-center gap-6 md:flex lg:gap-10">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="manrope inline-flex items-center gap-2 text-base font-normal text-[var(--color-ink-black)] transition-opacity hover:opacity-60 lg:text-[17px]"
            >
              {t.nav[link.key]}
              {"soon" in link ? <ComingSoonBadge /> : null}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex lg:gap-5">
          <SiteLocaleSwitcher />
          <LandingCta label={t.common.getStarted} variant="solid" href="/login" />
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink-black)] md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X size={22} strokeWidth={1.5} />
          ) : (
            <Menu size={22} strokeWidth={1.5} />
          )}
        </button>
      </nav>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-[var(--color-border-hairline)] bg-[var(--color-paper-white)] px-6 py-6 md:hidden"
        >
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="manrope inline-flex items-center gap-2 py-1 text-lg text-[var(--color-ink-black)]"
                onClick={() => setOpen(false)}
              >
                {t.nav[link.key]}
                {"soon" in link ? <ComingSoonBadge /> : null}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between gap-4 border-t border-[var(--color-border-hairline)] pt-5">
              <span className="manrope text-base text-[var(--color-slate-gray)]">
                {t.common.language}
              </span>
              <SiteLocaleSwitcher />
            </div>
            <LandingCta
              label={t.common.getStarted}
              variant="solid"
              href="/login"
              className="mt-2 w-full"
            />
          </div>
        </div>
      ) : null}
    </header>
  );
}
