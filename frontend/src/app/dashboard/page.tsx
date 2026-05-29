"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Dumbbell,
  MessageSquare,
  BookOpen,
  Settings,
  Search,
  Bell,
  TrendingUp,
  Clock,
  Award,
  MoreHorizontal,
  ArrowRight,
  ChevronUp,
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "#" },
  { icon: Dumbbell, label: "Practice", href: "#" },
  { icon: MessageSquare, label: "Feedback", href: "#" },
  { icon: BookOpen, label: "Syllabus", href: "#" },
  { icon: Settings, label: "Settings", href: "#" },
];

const TOP_TABS = ["Overview", "Interviews", "Resources"];

const STATS = [
  {
    label: "INTERVIEW READINESS",
    value: "82%",
    sub: "+ 4% from last week",
    trend: "up",
    icon: TrendingUp,
    progress: 82,
  },
  {
    label: "SESSIONS COMPLETED",
    value: "24",
    sub: "12.5 hours total practice",
    trend: null,
    icon: Clock,
    progress: null,
  },
  {
    label: "AVERAGE SCORE",
    value: "Senior",
    sub: "Consistently high performance",
    trend: null,
    icon: Award,
    progress: null,
  },
];

type TopicStatus = "critical" | "review" | "mastered";

const TOPICS: {
  status: TopicStatus;
  title: string;
  description: string;
  mastery: number;
  sessions: string;
}[] = [
  {
    status: "critical",
    title: "Distributed Consensus",
    description: "Mastering Paxos and Raft implementations for complex systems.",
    mastery: 35,
    sessions: "2 Sessions Left",
  },
  {
    status: "review",
    title: "CAP Theorem",
    description: "Analyzing trade-offs in distributed database architectures.",
    mastery: 65,
    sessions: "1 Session Left",
  },
  {
    status: "mastered",
    title: "Database Indexing",
    description: "B-Trees, Hash Indexes, and optimization strategies.",
    mastery: 98,
    sessions: "Completed",
  },
];

const SESSIONS = [
  { date: "Oct 24, 2023", topic: "System Design: Messenger", level: "SENIOR", score: 8.4, scoreMax: 10 },
  { date: "Oct 21, 2023", topic: "Redis Caching Patterns", level: "MID", score: 9.1, scoreMax: 10 },
  { date: "Oct 18, 2023", topic: "Microservices Security", level: "SENIOR", score: 7.2, scoreMax: 10 },
];

const STATUS_STYLES: Record<TopicStatus, { badge: string; bar: string }> = {
  critical: {
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    bar: "bg-red-500",
  },
  review: {
    badge: "bg-(--accent) text-(--accent-foreground)",
    bar: "bg-(--primary)",
  },
  mastered: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <div className="flex h-screen bg-(--background) font-sans overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-52 shrink-0 flex flex-col bg-[#163630] text-white">

        {/* Logo */}
        <div className="px-5 pt-6 pb-8">
          <p className="text-lg font-semibold tracking-tight">Hone</p>
          <p className="text-xs text-white/50 mt-0.5">AI Interview Expert</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => setActiveNav(label)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                activeNav === label
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/8",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-6 space-y-3">
          <button className="w-full flex items-center justify-center gap-2 bg-white/15 hover:bg-white/20 transition-colors text-white text-sm font-medium py-2.5 px-4 rounded-lg">
            <Dumbbell className="w-4 h-4" />
            Start Practice
          </button>
          <div className="flex gap-4 px-2 text-xs text-white/40">
            <button className="hover:text-white/70 transition-colors">Support</button>
            <button className="hover:text-white/70 transition-colors">Theme</button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-(--border) bg-(--background)">
          <div className="flex items-center gap-6">
            {TOP_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-sm pb-0.5 transition-colors",
                  activeTab === tab
                    ? "text-(--foreground) font-semibold border-b-2 border-(--primary)"
                    : "text-(--muted-foreground) hover:text-(--foreground)",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-(--muted) rounded-lg px-3 py-1.5 w-44">
              <Search className="w-3.5 h-3.5 text-(--muted-foreground) shrink-0" />
              <input
                type="text"
                placeholder="Search topics..."
                className="bg-transparent text-xs text-(--foreground) placeholder:text-(--muted-foreground) focus:outline-none w-full"
              />
            </div>

            {/* Upgrade */}
            <button className="text-xs font-semibold text-(--primary) border border-(--primary) hover:bg-(--accent) transition-colors px-3 py-1.5 rounded-lg">
              Upgrade
            </button>

            {/* Bell */}
            <button className="relative p-1.5 text-(--muted-foreground) hover:text-(--foreground) transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-(--primary) rounded-full" />
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 shrink-0" />
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Welcome card */}
          <div className="relative bg-(--card) border border-(--border) rounded-2xl p-7 overflow-hidden shadow-sm">
            {/* Orb decoration */}
            <div
              className="absolute right-6 top-1/2 -translate-y-1/2 w-36 h-36 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 40% 40%, #f97316 0%, #dc2626 40%, #7c3aed 80%, transparent 100%)",
                filter: "blur(2px)",
              }}
            />
            <div className="relative z-10 max-w-md space-y-3">
              <div>
                <h2 className="text-2xl font-semibold text-(--foreground)">Welcome back, Alex.</h2>
                <p className="text-sm text-(--muted-foreground) mt-1">
                  Ready to dive back into{" "}
                  <span className="text-(--primary) font-medium underline underline-offset-2 cursor-pointer">
                    Distributed Systems
                  </span>
                  ? You&apos;re doing better than 84% of your peers.
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button className="bg-(--foreground) text-(--background) hover:opacity-85 transition-opacity text-sm font-medium px-4 py-2 rounded-lg">
                  Start New Session
                </button>
                <button className="border border-(--border) text-(--foreground) hover:bg-(--muted) transition-colors text-sm font-medium px-4 py-2 rounded-lg">
                  View Curriculum
                </button>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {STATS.map(({ label, value, sub, trend, icon: Icon, progress }) => (
              <div
                key={label}
                className="bg-(--card) border border-(--border) rounded-xl p-5 shadow-sm space-y-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-(--muted-foreground)">
                  {label}
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-(--foreground) leading-none">{value}</p>
                  <div className="w-9 h-9 rounded-full bg-(--muted) flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-(--foreground)" />
                  </div>
                </div>
                {progress !== null && (
                  <div className="h-1.5 bg-(--muted) rounded-full overflow-hidden">
                    <div
                      className="h-full bg-(--primary) rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
                <p className="text-xs text-(--muted-foreground) flex items-center gap-1">
                  {trend === "up" && <ChevronUp className="w-3 h-3 text-emerald-500" />}
                  {sub}
                </p>
              </div>
            ))}
          </div>

          {/* Curriculum Tracking */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-(--foreground)">Curriculum Tracking</h3>
                <p className="text-xs text-(--muted-foreground)">Focus areas identified by Hone AI analysis.</p>
              </div>
              <button className="flex items-center gap-1.5 text-sm text-(--primary) font-medium hover:opacity-75 transition-opacity">
                Manage Topics
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {TOPICS.map((topic) => {
                const styles = STATUS_STYLES[topic.status];
                return (
                  <div
                    key={topic.title}
                    className="bg-(--card) border border-(--border) rounded-xl p-5 shadow-sm space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={cn(
                          "text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize",
                          styles.badge,
                        )}
                      >
                        {topic.status}
                      </span>
                      <button className="text-(--muted-foreground) hover:text-(--foreground) transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <p className="font-semibold text-(--foreground)">{topic.title}</p>
                      <p className="text-xs text-(--muted-foreground) mt-1 leading-relaxed">
                        {topic.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="h-1.5 bg-(--muted) rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", styles.bar)}
                          style={{ width: `${topic.mastery}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-(--muted-foreground)">
                        <span>{topic.mastery}% Mastery</span>
                        <span>{topic.sessions}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-(--foreground)">Recent Sessions</h3>
              <button className="text-xs font-medium border border-(--border) text-(--muted-foreground) hover:text-(--foreground) transition-colors px-3 py-1.5 rounded-lg">
                Export History
              </button>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--border) bg-(--muted)/40">
                    {["DATE", "TOPIC", "LEVEL", "OVERALL SCORE", "ACTION"].map((col) => (
                      <th
                        key={col}
                        className="text-left text-[10px] font-semibold uppercase tracking-wider text-(--muted-foreground) px-5 py-3"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SESSIONS.map((session, i) => (
                    <tr
                      key={i}
                      className="border-b border-(--border) last:border-0 hover:bg-(--muted)/30 transition-colors"
                    >
                      <td className="px-5 py-4 text-(--muted-foreground) text-xs whitespace-nowrap">
                        {session.date}
                      </td>
                      <td className="px-5 py-4 font-medium text-(--foreground)">{session.topic}</td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-bold tracking-wider text-(--muted-foreground) bg-(--muted) px-2 py-1 rounded">
                          {session.level}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-(--foreground)">{session.score}</span>
                          <div className="w-20 h-1.5 bg-(--muted) rounded-full overflow-hidden">
                            <div
                              className="h-full bg-(--primary) rounded-full"
                              style={{ width: `${(session.score / session.scoreMax) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <button className="text-xs font-semibold text-(--primary) hover:opacity-70 transition-opacity whitespace-nowrap">
                          View Transcript
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
