"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error so we can debug it in the dev console.
    console.error("Refleckt error boundary:", error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="px-6 pt-6 pb-4">
        <div className="mx-auto flex w-full max-w-4xl items-center">
          <Brand href="/" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16">
        <p className="margin-note mb-6 not-italic uppercase tracking-[0.22em] text-[0.7rem] text-muted-foreground">
          Something went wrong
        </p>
        <h1 className="font-display text-[clamp(2.5rem,5.2vw,4.25rem)] font-medium leading-[1.04] tracking-[-0.02em] text-foreground">
          We hit a{" "}
          <em className="marginalia not-italic">snag</em>.
        </h1>
        <p className="prose-measure mt-6 text-[1.0625rem] leading-relaxed text-foreground/75">
          Apologies. The good news: any reflections saved on this device are
          still here. Try again, and if it keeps happening, head home and let
          us know.
        </p>

        {error.digest && (
          <p className="mt-6 inline-flex w-fit rounded bg-muted px-3 py-1.5 font-mono text-[0.75rem] text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Button onClick={reset} size="lg">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-10 text-xs text-muted-foreground">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3">
          <Brand href="/" className="text-sm" />
          <p className="font-display italic text-[0.875rem] text-foreground/70">
            Reflection is a skill. We make it tractable.
          </p>
        </div>
      </footer>
    </div>
  );
}
