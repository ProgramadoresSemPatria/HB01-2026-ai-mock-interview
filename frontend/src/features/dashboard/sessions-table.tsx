import Link from "next/link";

import { formatLevel } from "./lib/stats";
import type { SessionSummary } from "@/types/interview";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SessionsTable({ sessions }: { sessions: SessionSummary[] }) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-(--muted-foreground)">
        No sessions yet.{" "}
        <Link
          href="/practice"
          className="cursor-pointer font-medium text-(--primary) underline"
        >
          Upload a resume and start practicing
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-(--border) bg-(--card) shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-(--border) bg-(--muted)/40">
            {["DATE", "LEVEL", "PROGRESS", "STATUS", "ACTION"].map((col) => (
              <th
                key={col}
                className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-(--muted-foreground)"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr
              key={session.id}
              className="border-b border-(--border) transition-colors last:border-0 hover:bg-(--muted)/30"
            >
              <td className="whitespace-nowrap px-5 py-4 text-xs text-(--muted-foreground)">
                {formatDate(session.createdAt)}
              </td>
              <td className="px-5 py-4">
                <span className="rounded bg-(--muted) px-2 py-1 text-[10px] font-bold tracking-wider text-(--muted-foreground)">
                  {formatLevel(session.level).toUpperCase()}
                </span>
              </td>
              <td className="px-5 py-4 text-(--foreground)">
                {session.turnCount} / {session.maxTurns}
              </td>
              <td className="px-5 py-4 text-xs text-(--muted-foreground)">
                {session.isFinished ? "Finished" : "Active"}
              </td>
              <td className="px-5 py-4">
                <Link
                  href={`/interview/${session.id}`}
                  className="cursor-pointer whitespace-nowrap text-xs font-semibold text-(--primary) transition-opacity hover:opacity-70"
                >
                  {session.isFinished ? "View history" : "Continue"}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
