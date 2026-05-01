"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  ClipboardCopy,
  FileDown,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendSparkline } from "@/components/trend-sparkline";
import { useStore } from "@/lib/storage";
import type { Mindset, Reflection, Tone } from "@/lib/types";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";

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
            // fall back to name match — older reflections may not have linked id
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

  // Sorted oldest -> newest for sparkline / averages
  const chronological = useMemo(
    () => reflections.slice().sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
    [reflections],
  );

  const trendPoints = useMemo<number[]>(
    () =>
      chronological
        .map((r) => r.analysis?.reflectionLevel)
        .filter(
          (level): level is NonNullable<typeof level> =>
            typeof level === "number",
        ),
    [chronological],
  );

  const stats = useMemo(() => computeStats(reflections), [reflections]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!group) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
              <GraduationCap className="h-6 w-6" />
            </div>
            <CardTitle>Group not found</CardTitle>
            <CardDescription>
              This group doesn&apos;t exist on this device.
            </CardDescription>
            <Button asChild className="mt-2">
              <Link href="/app">Back to dashboard</Link>
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
            <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
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

  const mostRecent = reflections[0];
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
          <Link href={`/app/groups/${groupId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to {group.name}
          </Link>
        </Button>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-primary-foreground shadow-[0_20px_50px_-25px_hsl(var(--primary)/0.6)]">
            <span className="font-display text-xl">
              {participant.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="font-display text-3xl tracking-tight md:text-4xl">
              {participant.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="muted">
                {reflections.length} reflection
                {reflections.length === 1 ? "" : "s"}
              </Badge>
              {mostRecent && (
                <Badge variant="outline">
                  Latest {formatRelativeTime(mostRecent.createdAt)}
                </Badge>
              )}
              {participant.anonymous && <Badge variant="muted">Anonymous</Badge>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={openPortfolio} size="lg">
            <FileDown className="h-4 w-4" />
            Download portfolio (PDF)
          </Button>
          <Button onClick={copyShareLink} variant="outline">
            <ClipboardCopy className="h-4 w-4" />
            Copy share link
          </Button>
        </div>
      </header>

      {trendPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Reflection level over time
            </CardTitle>
            <CardDescription>
              Each point is one reflection, oldest on the left.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrendSparkline
              points={trendPoints}
              width={560}
              height={88}
              className="w-full"
            />
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total reflections"
          value={String(reflections.length)}
          hint={
            stats.firstAt
              ? `Since ${formatDate(stats.firstAt)}`
              : "No reflections yet"
          }
        />
        <StatCard
          label="Average level"
          value={stats.avgLevel ? stats.avgLevel.toFixed(1) : "—"}
          hint={stats.analysedCount > 0 ? `${stats.analysedCount} analysed` : "No analysis yet"}
        />
        <StatCard
          label="Most-common mindset"
          value={stats.topMindset?.label ?? "—"}
          hint={
            stats.topMindset
              ? `${stats.topMindset.count} of ${stats.analysedCount}`
              : ""
          }
        />
        <StatCard
          label="Most-common tone"
          value={stats.topTone?.label ?? "—"}
          hint={
            stats.topTone ? `${stats.topTone.count} of ${stats.analysedCount}` : ""
          }
        />
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl tracking-tight">Reflections</h2>
            <p className="text-sm text-muted-foreground">
              Newest first. Click a row to peek at the summary.
            </p>
          </div>
        </div>

        {reflections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <CardTitle className="text-base font-medium">
                No reflections yet
              </CardTitle>
              <CardDescription className="max-w-sm">
                Once {participant.name} submits a reflection in this group,
                you&apos;ll see it here.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y divide-border/60 p-0">
              {reflections.map((r) => {
                const activity = activities.find((a) => a.id === r.activityId);
                const isOpen = !!expanded[r.id];
                const a = r.analysis;
                return (
                  <div key={r.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                      }
                      className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 sm:flex-nowrap"
                      aria-expanded={isOpen}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">
                          {activity?.title ||
                            r.objective ||
                            (r.activityId === null
                              ? "Personal reflection"
                              : "Reflection")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(r.createdAt)}
                        </div>
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
                      {a?.tone && (
                        <Badge variant="muted" className="shrink-0 capitalize">
                          {a.tone}
                        </Badge>
                      )}
                      <span
                        className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-foreground/70"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/app/reflections/${r.id}`}
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          Open
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="bg-muted/40 px-4 py-3 text-sm leading-relaxed text-foreground/85">
                        {a?.summary ??
                          r.responses[0]?.text ??
                          "No summary or transcript saved."}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-5">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="font-display text-2xl tracking-tight">{value}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
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
