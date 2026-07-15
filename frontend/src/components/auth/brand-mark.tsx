import Link from "next/link";

export function BrandMark() {
  return (
    <Link
      href="/"
      className="instrument-serif inline-flex text-2xl font-normal tracking-tight text-[var(--color-ink-black)] outline-none transition-opacity hover:opacity-60 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[var(--color-jade)] focus-visible:ring-offset-4"
      aria-label="Hone home"
    >
      Hone
    </Link>
  );
}
