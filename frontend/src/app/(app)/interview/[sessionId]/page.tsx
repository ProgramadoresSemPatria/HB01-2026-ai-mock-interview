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
    <div className="flex h-screen items-center justify-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin text-(--primary)" />
      <span className="text-sm text-(--muted-foreground)">Redirecting to Practice…</span>
    </div>
  );
}
