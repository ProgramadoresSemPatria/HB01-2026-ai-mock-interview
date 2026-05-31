"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Dumbbell, MessageSquare, LogOut, FileText, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/session-provider";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Dumbbell, label: "Practice", href: "/practice" },
  { icon: MessageSquare, label: "Feedback", href: "/feedback" },
  { icon: FileText, label: "Resumes", href: "/resumes" },
  { icon: User, label: "Profile", href: "/profile" },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex w-52 shrink-0 flex-col bg-[#163630] text-white">
      <div className="px-5 pt-6 pb-8">
        <p className="text-lg font-semibold tracking-tight">Hone</p>
        <p className="mt-0.5 text-xs text-white/50">AI Interview Expert</p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "cursor-pointer flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-white/15 font-medium text-white"
                  : "text-white/60 hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 px-3 pb-6">
        <Link
          href="/practice"
          className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-lg bg-white/15 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
        >
          <Dumbbell className="h-4 w-4" />
          Start Practice
        </Link>
        {user && (
          <p className="truncate px-2 text-xs text-white/50">{user.name}</p>
        )}
        <button
          type="button"
          onClick={logout}
          className="cursor-pointer flex w-full items-center gap-2 px-2 text-xs text-white/40 transition-colors hover:text-white/70"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
