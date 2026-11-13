import Link from "next/link";

import { formatLevel } from "./lib/stats";
import { toDisplayTurns } from "@/features/interview/lib/display-turns";
import type { SessionSummary } from "@/types/interview";
import { AppCard } from "@/components/app/app-card";
import { AppEmptyState } from "@/components/app/app-empty-state";

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
      <AppCard>
        <AppEmptyState
          headingLevel={3}
          title="No sessions yet"
          description="Start a mock interview to build your practice history."
          action={
            <Link
              href="/practice"
              className="manrope inline-flex h-10 items-center justify-center rounded-full border border-jade-deep bg-jade-deep px-4 text-sm font-medium text-paper-white transition-colors hover:border-ink-black hover:bg-ink-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade-deep"
            >
              Start practice
            </Link>
          }
        />
      </AppCard>
    );
  }

  return (
    <>
      {/* Phones: stacked cards instead of a sideways-scrolling table. */}
      <ul
        aria-label="Recent interview sessions and their progress"
        className="landing-artifact divide-y divide-border-hairline overflow-hidden p-0! md:hidden"
      >
        {sessions.map((session) => {
          const display = toDisplayTurns(session.turnCount, session.maxTurns);

          return (
            <li key={session.id} className="manrope flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-jade-pale px-2.5 py-1 text-[11px] font-medium text-jade-deep">
                    {formatLevel(session.level)}
                  </span>
                  <span className="text-xs text-text-base">
                    {session.isFinished ? "Finished" : "Active"}
                  </span>
                </div>
                <p className="text-xs text-text-base">
                  {formatDate(session.createdAt)}
                  <span aria-hidden="true"> · </span>
                  <span className="font-medium text-ink-black">
                    {display.turnCount} / {display.maxTurns}
                  </span>{" "}
                  turns
                </p>
              </div>
              <Link
                href={`/interview/${session.id}`}
                className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-border-hairline px-4 text-xs font-medium whitespace-nowrap text-jade-deep transition-colors hover:bg-mist-gray focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade-deep"
              >
                {session.isFinished ? "View history" : "Continue"}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="landing-artifact hidden overflow-hidden p-0! md:block">
        <div className="overflow-x-auto">
          <table className="manrope w-full min-w-[680px] text-sm">
            <caption className="sr-only">
              Recent interview sessions and their progress
            </caption>
            <thead>
              <tr className="border-b border-border-hairline bg-fog-white">
                {["Date", "Level", "Progress", "Status", "Action"].map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="landing-tag whitespace-nowrap px-5 py-3 text-left font-normal text-text-base!"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const display = toDisplayTurns(
                  session.turnCount,
                  session.maxTurns,
                );

                return (
                  <tr
                    key={session.id}
                    className="border-b border-border-hairline transition-colors last:border-0 hover:bg-fog-white"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-text-base">
                      {formatDate(session.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-jade-pale px-2.5 py-1 text-[11px] font-medium text-jade-deep">
                        {formatLevel(session.level)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-ink-black">
                      {display.turnCount} / {display.maxTurns}
                    </td>
                    <td className="px-5 py-4 text-xs text-text-base">
                      {session.isFinished ? "Finished" : "Active"}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/interview/${session.id}`}
                        className="whitespace-nowrap text-xs font-medium text-jade-deep underline-offset-4 transition-colors hover:text-ink-black hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jade-deep"
                      >
                        {session.isFinished ? "View history" : "Continue"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
