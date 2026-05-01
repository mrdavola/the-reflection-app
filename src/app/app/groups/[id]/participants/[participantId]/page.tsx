"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  ClipboardCopy,
  FileDown,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { GrowthChart } from "@/components/growth-chart";
import { StreakCard } from "@/components/streak-card";
import { useStore } from "@/lib/storage";
import type { Mindset, Reflection, Tone } from "@/lib/types";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export default function ParticipantDetailPage() {
  const params = useParams<{ id: string; participantId: string }>();
  const groupId = params.id;
  const participantId = params.participantId;

  const group = useStore((s) => s.groups.find((g) => g.id === groupId));
  const participant = useStore((s) =>
    s.participants.find((p) => p.id === participantId),
  );
  const reflections = useStore((s) =>
    s.reflections
      .filter(
        (r) =>
          r.groupId === groupId &&
          (r.participantId === participantId ||
            (!r.participantId &&
              r.participantName &&
              participant &&
              r.participantName.toLowerCase() === participant.name.toLowerCase())),
      )
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  );
  const activities = useStore((s) =>
    s.activities.filter((a) => a.groupId === groupId),
  );

  const stats = useMemo(() => computeStats(reflections), [reflections]);

  const dates = useMemo(
    () => reflections.map((r) => r.createdAt),
    [reflections],
  );

  // Up to 3 verbatim quotes for the side rail.
  const quotes = useMemo(() => {
    const out: { id: string; text: string; date: string }[] = [];
    for (const r of reflections) {
      const list = r.analysis?.studentQuotes ?? [];
      for (const q of list) {
        const trimmed = q.replace(/^["“”']|["“”']$/g, "").trim();
        if (trimmed.length === 0) continue;
        out.push({
          id: `${r.id}:${out.length}`,
          text: trimmed,
          date: r.createdAt,
        });
        if (out.length >= 3) break;
      }
      if (out.length >= 3) break;
    }
    return out;
  }, [reflections]);

  if (!group) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <GraduationCap className="h-6 w-6" />
            </div>
            <CardTitle>Group not found</CardTitle>
            <CardDescription>
              This group doesn&apos;t exist on this device.
            </CardDescription>
            <Button asChild className="mt-2">
              <Link href="/app/groups">Back to groups</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle>Participant not found</CardTitle>
            <CardDescription>
              This participant may have been removed from the group.
            </CardDescription>
            <Button asChild className="mt-2">
              <Link href={`/app/groups/${groupId}`}>Back to group</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const portfolioHref = `/app/groups/${groupId}/participants/${participantId}/portfolio`;

  function openPortfolio() {
    if (typeof window === "undefined") return;
    window.open(`${portfolioHref}?print=1`, "_blank", "noopener,noreferrer");
  }

  function copyShareLink() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${portfolioHref}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Share link copied"),
      () => toast.error("Couldn't copy link"),
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/app/groups/${groupId}?tab=participants`}>
            <ArrowLeft className="h-4 w-4" />
            Back to {group.name}
          </Link>
        </Button>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
              {group.name} · Participant
            </p>
            <h1 className="font-display text-4xl leading-[1.02] tracking-tight md:text-6xl">
              {participant.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-foreground/70">
              <Badge variant="muted">
                {reflections.length} reflection
                {reflections.length === 1 ? "" : "s"}
              </Badge>
              {reflections[0] && (
                <Badge variant="outline">
                  Latest {formatRelativeTime(reflections[0].createdAt)}
                </Badge>
              )}
              {participant.anonymous && <Badge variant="muted">Anonymous</Badge>}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button onClick={openPortfolio} size="lg">
              <FileDown className="h-4 w-4" />
              Portfolio (PDF)
            </Button>
            <Button onClick={copyShareLink} variant="outline">
              <ClipboardCopy className="h-4 w-4" />
              Copy share link
            </Button>
          </div>
        </div>
        <hr className="rule-soft mt-2" />
      </header>

      {/* 2-col grid: streak + growth on the left, quotes on the right */}
      <section className="grid gap-6 lg:grid-cols-[1fr_minmax(260px,340px)]">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <StreakCard
              dates={dates}
              totalReflections={reflections.length}
            />
            <Card>
              <CardContent className="flex flex-col gap-3 py-6">
                <p className="margin-note uppercase tracking-[0.18em] text-[0.65rem]">
                  Average level
                </p>
                <div className="font-display text-5xl leading-none tabular-nums">
                  {stats.avgLevel ? stats.avgLevel.toFixed(1) : "—"}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats.analysedCount > 0
                    ? `Across ${stats.analysedCount} analysed reflection${stats.analysedCount === 1 ? "" : "s"}`
                    : "No analysis yet"}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-2xl bg-muted/50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Top mindset
                    </p>
                    <p className="mt-1 font-medium capitalize">
                      {stats.topMindset?.label ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Top tone
                    </p>
                    <p className="mt-1 font-medium capitalize">
                      {stats.topTone?.label ?? "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <p className="margin-note mb-2 uppercase tracking-[0.18em] text-[0.65rem]">
              Reflection level over time
            </p>
            <GrowthChart reflections={reflections} />
          </div>
        </div>

        <aside className="space-y-3">
          <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
            Voice
          </p>
          {quotes.length === 0 ? (
            <p className="text-sm italic text-foreground/55">
              Verbatim quotes appear here as soon as the AI surfaces them.
            </p>
          ) : (
            <ul className="space-y-5">
              {quotes.map((q) => (
                <li key={q.id} className="space-y-1">
                  <p className="font-display italic text-lg leading-snug text-foreground/75">
                    “{q.text}”
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {formatDate(q.date)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>

      {/* Reflection timeline */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl tracking-tight">Timeline</h2>
        {reflections.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <CardTitle className="font-display text-lg">
                No reflections yet
              </CardTitle>
              <CardDescription className="mx-auto mt-2 max-w-sm">
                Once {participant.name} submits a reflection in this group,
                you&apos;ll see it here.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <ol className="overflow-hidden rounded-2xl border border-border/60 bg-card/30 divide-y divide-border/40">
            {reflections.map((r) => {
              const activity = activities.find((a) => a.id === r.activityId);
              const a = r.analysis;
              return (
                <li key={r.id}>
                  <Link
                    href={`/app/reflections/${r.id}`}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-card/60 sm:flex-nowrap"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg leading-snug">
                        {activity?.title ||
                          r.objective ||
                          (r.activityId === null
                            ? "Personal reflection"
                            : "Reflection")}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        {formatDate(r.createdAt)}
                      </p>
                    </div>
                    {a && (
                      <Badge
                        variant={badgeVariantForLevel(a.reflectionLevel)}
                        className="shrink-0"
                      >
                        Level {a.reflectionLevel}
                      </Badge>
                    )}
                    {a?.mindset && (
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {a.mindset}
                      </Badge>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-foreground/70">
                      Open
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function badgeVariantForLevel(
  level: number,
): "blue" | "orange" | "sunny" {
  const rounded = Math.round(level);
  if (rounded >= 3) return "sunny";
  if (rounded === 2) return "orange";
  return "blue";
}

function computeStats(reflections: Reflection[]): {
  firstAt: string | null;
  analysedCount: number;
  avgLevel: number | null;
  topMindset: { label: Mindset; count: number } | null;
  topTone: { label: Tone; count: number } | null;
} {
  if (reflections.length === 0) {
    return {
      firstAt: null,
      analysedCount: 0,
      avgLevel: null,
      topMindset: null,
      topTone: null,
    };
  }

  const firstAt = reflections.reduce<string>((acc, r) => {
    if (!acc) return r.createdAt;
    return r.createdAt < acc ? r.createdAt : acc;
  }, "");

  const analysed = reflections
    .map((r) => r.analysis)
    .filter((a): a is NonNullable<Reflection["analysis"]> => Boolean(a));

  const avgLevel =
    analysed.length === 0
      ? null
      : analysed.reduce((sum, a) => sum + a.reflectionLevel, 0) / analysed.length;

  const mindsetCounts = new Map<Mindset, number>();
  const toneCounts = new Map<Tone, number>();
  for (const a of analysed) {
    mindsetCounts.set(a.mindset, (mindsetCounts.get(a.mindset) ?? 0) + 1);
    toneCounts.set(a.tone, (toneCounts.get(a.tone) ?? 0) + 1);
  }
  const topMindset = topEntry(mindsetCounts);
  const topTone = topEntry(toneCounts);

  return {
    firstAt: firstAt || null,
    analysedCount: analysed.length,
    avgLevel,
    topMindset,
    topTone,
  };
}

function topEntry<K extends string>(
  counts: Map<K, number>,
): { label: K; count: number } | null {
  let best: { label: K; count: number } | null = null;
  for (const [label, count] of counts) {
    if (!best || count > best.count) best = { label, count };
  }
  return best;
}

