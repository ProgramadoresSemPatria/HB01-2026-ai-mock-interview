"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";

import { AppSidebar } from "./app-sidebar";

export function AppShell({
  children,
  header,
  noPadding = false,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  noPadding?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasSidebarOpen = useRef(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    if (wasSidebarOpen.current && !sidebarOpen) {
      menuButtonRef.current?.focus();
    }

    wasSidebarOpen.current = sidebarOpen;
  }, [sidebarOpen]);

  useEffect(() => {
    const desktopMedia = window.matchMedia("(min-width: 768px)");
    const closeAtDesktop = () => {
      if (desktopMedia.matches) {
        setSidebarOpen(false);
      }
    };

    desktopMedia.addEventListener("change", closeAtDesktop);
    return () => desktopMedia.removeEventListener("change", closeAtDesktop);
  }, []);

  return (
    <div className="app-canvas manrope flex h-dvh min-h-0 overflow-hidden bg-paper-white text-ink-black">
      <AppSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        aria-hidden={sidebarOpen || undefined}
        inert={sidebarOpen || undefined}
      >
        {/* Mobile top bar */}
        <div className="flex h-16 items-center gap-3 border-b border-border-hairline bg-paper-white px-6 md:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-ml-2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-text-base transition-colors hover:bg-mist-gray hover:text-ink-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade focus-visible:ring-offset-2"
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
            aria-controls="app-mobile-navigation"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <p className="instrument-serif text-2xl font-normal tracking-tight text-ink-black">
            Hone
          </p>
        </div>

        {header}
        <main
          className={`min-h-0 flex-1 bg-paper-white ${
            noPadding
              ? "flex flex-col overflow-hidden *:min-h-0 *:flex-1"
              : "overflow-y-auto px-6 py-6 md:px-10 md:py-8"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
