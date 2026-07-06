"use client";

import dynamic from "next/dynamic";

const BlackHole = dynamic(
  () =>
    import("@/components/patterns/black-hole").then((mod) => mod.BlackHole),
  { ssr: false },
);

function HeroBlackHole() {
  return (
    <div className="absolute inset-0">
      <BlackHole />
    </div>
  );
}

export { HeroBlackHole };
