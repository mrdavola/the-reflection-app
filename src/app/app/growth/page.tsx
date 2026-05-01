"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StreakCard } from "@/components/streak-card";
import { GrowthChart } from "@/components/growth-chart";
import { formatRelativeTime } from "@/lib/utils";
import type { Reflection } from "@/lib/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default function GrowthPage() {
  const reflections = useStore((s) => s.reflections);
  const personal = reflections.filter((r) => r.activityId === null);
  const dates = personal.map((r) => r.createdAt);

  const now = Date.now();
  const avgLevel = (windowDays: number) => {
    const cutoff = now - windowDays * MS_PER_DAY;
    const inWindow = personal.filter((r) => {
      if (!r.analysis) return false;
      return new Date(r.createdAt).getTime() >= cutoff;
    });
    if (inWindow.length === 0) return null;
    const sum = inWindow.reduce((acc, r) => acc + (r.analysis?.reflectionLevel ?? 0), 0);
    return sum / inWindow.length;
  };

  const avg7 = avgLevel(7);
  const avg30 = avgLevel(30);

  // Change over time: average of first quarter vs latest quarter (analyzed only).
  const analyzed = personal
    .filter((r) => r.analysis)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  let change: number | null = null;
  if (analyzed.length >= 4) {
    const q = Math.max(1, Math.floor(analyzed.length / 4));
    const earlyAvg =
      analyzed.slice(0, q).reduce((s, r) => s + (r.analysis?.reflectionLevel ?? 0), 0) / q;
    const lateAvg =
      analyzed.slice(-q).reduce((s, r) => s + (r.analysis?.reflectionLevel ?? 0), 0) / q;
    change = lateAvg - earlyAvg;
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-7 space-y-5">
          <div>
            <Badge variant="primary" className="mb-3">
              <TrendingUp className="h-3 w-3" />
              Growth
            </Badge>
            <h1 className="font-display text-4xl leading-tight tracking-tight">
              Your reflection growth
            </h1>
            <p className="mt-2 max-w-xl text-foreground/75">
              A view of your own personal reflections over time — streaks,
              level trends, and a place to notice your own pattern.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>At a glance</CardTitle>
              <CardDescription>
                Based on your {personal.length} personal reflection
                {personal.length === 1 ? "" : "s"}.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              <StatTile
                label="Avg level · 7d"
                value={avg7 === null ? "—" : avg7.toFixed(1)}
                hint="of 4"
              />
              <StatTile
                label="Avg level · 30d"
                value={avg30 === null ? "—" : avg30.toFixed(1)}
                hint="of 4"
              />
              <StatTile
                label="Change over time"
                value={
                  change === null
                    ? "—"
                    : `${change >= 0 ? "+" : ""}${change.toFixed(1)}`
                }
                hint={change === null ? "needs more data" : "early vs recent"}
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-5">
          <StreakCard dates={dates} totalReflections={personal.length} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl tracking-tight">Level over time</h2>
            <p className="text-sm text-muted-foreground">
              Your reflection level (1–4), most recent {Math.min(personal.filter((r) => r.analysis).length, 30)} on the right.
            </p>
          </div>
        </div>
        <GrowthChart reflections={personal} />
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl tracking-tight">Recent personal reflections</h2>
          <Button asChild size="sm" variant="ghost">
            <Link href="/app/personal">
              New reflection
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        {personal.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
                <Sparkles className="h-6 w-6" />
              </div>
              <CardTitle>No personal reflections yet</CardTitle>
              <CardDescription className="max-w-sm">
                Start a personal reflection to begin building your streak and
                see how your thinking grows.
              </CardDescription>
              <Button asChild className="mt-2">
                <Link href="/app/personal">Start a personal reflection</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {personal.slice(0, 9).map((r) => (
              <PersonalRow key={r.id} reflection={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
      <div className="font-display text-2xl font-semibold tracking-tight text-foreground">
        {value}
        {hint && <span className="ml-1 text-xs font-normal text-muted-foreground">{hint}</span>}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function PersonalRow({ reflection }: { reflection: Reflection }) {
  return (
    <Link
      href={`/app/reflections/${reflection.id}`}
      className="group flex h-full flex-col gap-2 rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {formatRelativeTime(reflection.createdAt)}
      </div>
      <div className="line-clamp-2 font-display text-lg leading-snug">
        {reflection.objective || reflection.responses[0]?.text || "Personal reflection"}
      </div>
      <div className="mt-auto flex items-center gap-2 text-xs">
        {reflection.analysis ? (
          <>
            <Badge variant={reflection.analysis.scoreColor}>
              {reflection.analysis.understandingLabel}
            </Badge>
            <Badge variant="outline">{reflection.analysis.mindset}</Badge>
          </>
        ) : (
          <Badge variant="muted">Awaiting analysis</Badge>
        )}
      </div>
    </Link>
  );
}
