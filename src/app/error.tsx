"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error in dev tools so we can debug.
    console.error("The Reflection App error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/[0.06] via-background to-secondary/[0.06]">
      <header className="px-6 pt-6">
        <div className="mx-auto flex w-full max-w-3xl items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-display text-base font-semibold tracking-tight"
          >
            <BrandMark className="h-7 w-7" />
            <span>The Reflection App</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl items-center justify-center px-6 py-16">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="font-display text-2xl tracking-tight">
              Something went wrong
            </CardTitle>
            <CardDescription>
              The Reflection App hit an unexpected snag. The good news: your local
              reflections are still safely stored on this device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {error.digest && (
              <p className="rounded-xl bg-muted px-3 py-2 font-mono text-[11px] text-muted-foreground">
                Reference: {error.digest}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={reset}>
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
              <Button asChild variant="outline">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  Back to home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
