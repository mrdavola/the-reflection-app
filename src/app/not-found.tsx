import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="px-6 pt-6 pb-4">
        <div className="mx-auto flex w-full max-w-4xl items-center">
          <Brand href="/" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16">
        <p className="margin-note mb-6 not-italic uppercase tracking-[0.22em] text-[0.7rem] text-muted-foreground">
          Not found · 404
        </p>
        <h1 className="font-display text-[clamp(2.5rem,5.2vw,4.25rem)] font-medium leading-[1.04] tracking-[-0.02em] text-foreground">
          This page is{" "}
          <em className="marginalia--ink marginalia not-italic">missing</em>.
        </h1>
        <p className="prose-measure mt-6 text-[1.0625rem] leading-relaxed text-foreground/75">
          It may have moved, or it may have never existed. Either way, we
          &rsquo;ll send you home.
        </p>

        <div className="mt-10">
          <Button asChild size="lg">
            <Link href="/">
              Back to home
              <ArrowRight className="h-4 w-4" />
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
