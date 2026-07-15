"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function InterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/practice?sessionId=${sessionId}`);
  }, [sessionId, router]);

  return (
    <div
      className="manrope flex h-dvh items-center justify-center gap-2 bg-paper-white text-sm text-text-base"
      role="status"
      aria-live="polite"
    >
      <Loader2
        className="h-6 w-6 animate-spin text-jade-deep"
        aria-hidden="true"
      />
      <span>Redirecting to Practice…</span>
    </div>
  );
}
