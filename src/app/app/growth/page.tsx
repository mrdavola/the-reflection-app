"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
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
import { TrendSparkline } from "@/components/trend-sparkline";
import { FOCUS_OPTIONS, getFocus } from "@/lib/focus-catalog";
import { formatRelativeTime } from "@/lib/utils";
import type { FocusId, Reflection } from "@/lib/types";

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
    const sum = inWindow.reduce(
      (acc, r) => acc + (r.analysis?.reflectionLevel ?? 0),
      0,
    );
    return sum / inWindow.length;
  };

  const avg7 = avgLevel(7);
  const avg30 = avgLevel(30);

  const analyzed = personal
    .filter((r) => r.analysis)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  let change: number | null = null;
  if (analyzed.length >= 4) {
    const q = Math.max(1, Math.floor(analyzed.length / 4));
    const earlyAvg =
      analyzed
        .slice(0, q)
        .reduce((s, r) => s + (r.analysis?.reflectionLevel ?? 0), 0) / q;
    const lateAvg =
      analyzed
        .slice(-q)
        .reduce((s, r) => s + (r.analysis?.reflectionLevel ?? 0), 0) / q;
    change = lateAvg - earlyAvg;
  }

  // Per-focus aggregates: only foci the user has actually reflected on with
  // analysis. Sparkline points are oldest -> newest reflection level (1–4).
  const focusBuckets = new Map<FocusId, number[]>();
  for (const r of analyzed) {
    if (!r.analysis) continue;
    const list = focusBuckets.get(r.focus) ?? [];
    list.push(r.analysis.reflectionLevel);
    focusBuckets.set(r.focus, list);
  }
  const focusEntries = FOCUS_OPTIONS.filter((f) => focusBuckets.has(f.id)).map(
    (f) => {
      const points = focusBuckets.get(f.id) ?? [];
      const last = points[points.length - 1] ?? 0;
      return { focus: f, points, latestLevel: last };
    },
  );

  return (
    <div className="space-y-14">
      <header className="space-y-3">
        <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
          No.&nbsp;02 — Growth
        </p>
        <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em]">
          Your reflection growth, told by the page itself.
        </h1>
        <p className="prose-measure text-foreground/70">
          A view of your own personal reflections over time — streaks, level
          trends per focus, and a place to notice your own pattern.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-12">
        <div className="space-y-5 md:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl">At a glance</CardTitle>
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

      <hr className="rule-soft" />

      <section className="space-y-4">
        <div>
          <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
            Level over time
          </p>
          <h2 className="font-display text-2xl tracking-[-0.018em]">
            Where the line is heading
          </h2>
          <p className="text-sm text-foreground/60">
            Your reflection level (1–4), most recent{" "}
            {Math.min(personal.filter((r) => r.analysis).length, 30)} on the
            right.
          </p>
        </div>
        <GrowthChart reflections={personal} />
      </section>

      <hr className="rule-soft" />

      <section className="space-y-5">
        <div>
          <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
            By focus
          </p>
          <h2 className="font-display text-2xl tracking-[-0.018em]">
            Trends per focus area
          </h2>
          <p className="text-sm text-foreground/60">
            One sparkline per focus you&rsquo;ve reflected on. The dot at the
            right shows your most recent level.
          </p>
        </div>
        {focusEntries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
                Empty
              </p>
              <CardTitle className="font-display text-xl">
                No analyzed reflections yet
              </CardTitle>
              <CardDescription className="prose-measure">
                Once a few of your personal reflections have analysis, you&rsquo;ll
                see a tiny trend per focus here.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {focusEntries.map(({ focus, points, latestLevel }) => (
              <div
                key={focus.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-card px-4 py-4"
              >
                <div className="min-w-0 space-y-1">
                  <p className="margin-note uppercase tracking-[0.3em] text-[0.65rem]">
                    {focus.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[1.75rem] leading-none">
                      L{latestLevel || "—"}
                    </span>
                    <span className="text-[0.7rem] uppercase tracking-[0.2em] text-foreground/45">
                      {points.length} reflection{points.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <TrendSparkline points={points} width={96} height={32} />
              </div>
            ))}
          </div>
        )}
      </section>

      <hr className="rule-soft" />

      <section className="space-y-5">
        <div>
          <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
            Notes from the page
          </p>
          <h2 className="font-display text-2xl tracking-[-0.018em]">
            What the data is whispering
          </h2>
          <p className="text-sm text-foreground/60">
            Calm, low-stakes observations — not advice.
          </p>
        </div>
        <CoachNotes
          analyzedCount={analyzed.length}
          avg7={avg7}
          avg30={avg30}
          change={change}
          focusCount={focusEntries.length}
        />
      </section>

      <hr className="rule-soft" />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
              Recent
            </p>
            <h2 className="font-display text-2xl tracking-[-0.018em]">
              Your last few personal reflections
            </h2>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link href="/app/personal">
              New reflection
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        {personal.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <Sparkles className="h-5 w-5 text-primary/70" />
              <CardTitle className="font-display text-xl">
                No personal reflections yet
              </CardTitle>
              <CardDescription className="prose-measure">
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

function CoachNotes({
  analyzedCount,
  avg7,
  avg30,
  change,
  focusCount,
}: {
  analyzedCount: number;
  avg7: number | null;
  avg30: number | null;
  change: number | null;
  focusCount: number;
}) {
  const notes: { eyebrow: string; line: string }[] = [];

  if (analyzedCount === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="margin-note mb-3 uppercase tracking-[0.3em] text-[0.7rem]">
            Quiet for now
          </p>
          <p className="font-display text-[1.25rem] leading-[1.4] text-foreground/70">
            A handful of analyzed reflections will start to surface notes here —
            patterns the page picks up before you do.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (avg7 !== null && avg30 !== null) {
    const delta = avg7 - avg30;
    if (Math.abs(delta) < 0.15) {
      notes.push({
        eyebrow: "Steady",
        line: "Your last week sits near your monthly baseline. Consistency, not movement, is the signal here.",
      });
    } else if (delta > 0) {
      notes.push({
        eyebrow: "Lifting",
        line: `The last seven days are running about ${delta.toFixed(1)} above your 30-day baseline. Something is clicking.`,
      });
    } else {
      notes.push({
        eyebrow: "Softer week",
        line: `The last seven days are running about ${Math.abs(delta).toFixed(1)} below your 30-day baseline. Worth a kinder pace, not an alarm.`,
      });
    }
  }

  if (change !== null) {
    if (change >= 0.4) {
      notes.push({
        eyebrow: "Long arc",
        line: "Comparing your earliest reflections to your latest, your level has noticeably risen.",
      });
    } else if (change <= -0.4) {
      notes.push({
        eyebrow: "Long arc",
        line: "Your latest reflections are running a bit below where you started. Sometimes deeper questions look like lower scores.",
      });
    }
  }

  if (focusCount >= 3) {
    notes.push({
      eyebrow: "Range",
      line: `You've explored ${focusCount} different focus areas. Variety often shows up before depth.`,
    });
  }

  if (notes.length === 0) {
    notes.push({
      eyebrow: "Note",
      line: "Keep going. The signal sharpens after about ten reflections.",
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {notes.map((n, i) => (
        <Card key={i} className="bg-card">
          <CardContent className="space-y-3 py-5">
            <p className="margin-note uppercase tracking-[0.3em] text-[0.65rem]">
              {n.eyebrow}
            </p>
            <p className="font-display text-[1.0625rem] leading-[1.5] text-foreground/80">
              {n.line}
            </p>
          </CardContent>
        </Card>
      ))}
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
    <div className="rounded-2xl border border-border/60 bg-surface p-4">
      <div className="font-display text-2xl font-medium tracking-tight text-foreground">
        {value}
        {hint && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function PersonalRow({ reflection }: { reflection: Reflection }) {
  const focus = getFocus(reflection.focus);
  return (
    <Link
      href={`/app/reflections/${reflection.id}`}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/30"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="margin-note uppercase tracking-[0.3em] text-[0.65rem]">
          {focus.label}
        </p>
        <span className="text-[0.65rem] uppercase tracking-[0.2em] text-foreground/40">
          {formatRelativeTime(reflection.createdAt)}
        </span>
      </div>
      <div className="line-clamp-2 font-display text-[1.0625rem] leading-snug text-foreground/85">
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
