import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
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
            <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
              <Compass className="h-5 w-5" />
            </div>
            <CardTitle className="mt-3 font-display text-2xl tracking-tight">
              We couldn&apos;t find that
            </CardTitle>
            <CardDescription>
              The page you&apos;re looking for either moved or never existed. No
              worries — let&apos;s get you back to a useful place.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  Back to home
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/app">Open the app</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
