/**
 * Share-link layout.
 *
 * No app chrome — students walk in via a code and need a calm, anonymous
 * surface. Just the deep navy and the small Refleckt mark.
 */

import Link from "next/link";

export default function ShareLinkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-30 px-6 py-5 pointer-events-none">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="pointer-events-auto inline-flex items-center gap-2 font-display text-[0.95rem] tracking-tight text-foreground/70 hover:text-foreground transition-colors"
          >
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_2px_oklch(0.78_0.105_230/0.6)]"
            />
            Refleckt
          </Link>
          <span className="margin-note uppercase tracking-[0.3em] text-[0.65rem]">
            Reflection
          </span>
        </div>
      </header>
      <main className="relative z-10 min-h-screen">{children}</main>
    </div>
  );
}
