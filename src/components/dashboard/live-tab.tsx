"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Hourglass, Mic, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/storage";
import type { Activity, Group, Reflection } from "@/lib/types";
import { GlowingDot, RippleField } from "@/components/ambient";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Props {
  group: Group | null;
}

// "Live" heuristic: a reflection started in the last 10 minutes that hasn't
// produced an analysis yet OR has zero responses. We don't have a per-group
// `activeActivityId` field, so we infer recency from the reflections store.
const RECENT_WINDOW_MS = 1000 * 60 * 10;
const STUCK_AFTER_MS = 1000 * 90; // 90s without progress -> stuck

interface InFlight {
  reflection: Reflection;
  status: "recording" | "done" | "stuck" | "alert";
  ageMs: number;
  responseCount: number;
  promptCount: number;
}

export function LiveTab({ group }: Props) {
  const reflections = useStore((s) => s.reflections);
  const activities = useStore((s) => s.activities);
  const [now, setNow] = useState(() => Date.now());

  const scopedReflections = useMemo(() => {
    if (group) return reflections.filter((r) => r.groupId === group.id);
    return reflections;
  }, [reflections, group]);

  // Only tick when there's anything recent enough to potentially be live.
  const hasRecent = useMemo(() => {
    const cutoff = now - RECENT_WINDOW_MS;
    return scopedReflections.some((r) => new Date(r.createdAt).getTime() > cutoff);
  }, [scopedReflections, now]);

  useEffect(() => {
    if (!hasRecent) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [hasRecent]);

  const scopedActivities = useMemo(() => {
    if (group) return activities.filter((a) => a.groupId === group.id);
    return activities;
  }, [activities, group]);

  // Detect the most recent assigned activity that has reflections within the
  // recent window — that's our "live session."
  const liveSession = useMemo(() => {
    const recent = scopedReflections.filter(
      (r) => now - new Date(r.createdAt).getTime() < RECENT_WINDOW_MS,
    );
    if (recent.length === 0) return null;
    // Find the activity with the most recent reflection.
    const byActivity = new Map<string, Reflection[]>();
    for (const r of recent) {
      const key = r.activityId ?? "__personal__";
      const arr = byActivity.get(key) ?? [];
      arr.push(r);
      byActivity.set(key, arr);
    }
    let bestKey: string | null = null;
    let bestStart = 0;
    for (const [key, list] of byActivity) {
      const earliest = Math.min(...list.map((r) => new Date(r.createdAt).getTime()));
      if (earliest > bestStart) {
        bestStart = earliest;
        bestKey = key;
      }
    }
    if (!bestKey || bestKey === "__personal__") return null;
    const activity = scopedActivities.find((a) => a.id === bestKey);
    if (!activity) return null;
    return { activity, reflections: byActivity.get(bestKey)!, startedAt: bestStart };
  }, [scopedReflections, scopedActivities, now]);

  if (!liveSession) {
    return <EmptyLiveState groupName={group?.name} />;
  }

  const inFlight = buildInFlight(liveSession.reflections, liveSession.activity, now);
  const startedAgoMin = Math.max(1, Math.floor((now - liveSession.startedAt) / 60_000));

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 rounded-3xl border border-primary/30 bg-card/40 px-5 py-5 sm:px-6">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-primary">
            <Radio className="h-3 w-3" />
            Live session
          </p>
          <h2 className="mt-1 font-display text-2xl tracking-tight">
            {liveSession.activity.title}
          </h2>
          <p className="mt-1 text-[13px] text-foreground/70">
            Started {startedAgoMin} min ago · {inFlight.length} student
            {inFlight.length === 1 ? "" : "s"} in flight
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link
            href={`/app/groups/${liveSession.activity.groupId}/activities/${liveSession.activity.id}/share`}
          >
            Open share screen
          </Link>
        </Button>
      </header>

      <ul className="space-y-2">
        {inFlight.map((item) => (
          <LiveRow key={item.reflection.id} item={item} />
        ))}
      </ul>

      <TranscriptStream items={inFlight} />
    </section>
  );
}

function LiveRow({ item }: { item: InFlight }) {
  const { reflection, status, responseCount, promptCount } = item;
  const meta = METADATA[status];
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border/50 bg-card/40 px-4 py-3",
        status === "alert" && "border-l-2 border-l-triage-rose bg-triage-rose-bg/30",
      )}
    >
      <span aria-hidden className={cn("h-2.5 w-2.5 shrink-0 rounded-full", meta.dotClass)} />
      <span className="w-32 shrink-0 truncate font-mono text-[13px] tabular-nums font-medium">
        {reflection.participantName}
      </span>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]",
          meta.chipClass,
        )}
      >
        {meta.icon}
        {meta.label}
      </span>
      <span className="flex-1 truncate font-mono tabular-nums text-[12px] text-foreground/60">
        {status === "recording" && (
          <>
            {formatDuration(item.ageMs)} · q{Math.min(responseCount + 1, promptCount)} of {promptCount}
          </>
        )}
        {status === "done" && (
          <>
            Level {reflection.analysis?.reflectionLevel ?? "?"} · {formatRelativeTime(reflection.createdAt)}
          </>
        )}
        {status === "stuck" && (
          <>
            {formatDuration(item.ageMs)} on q{Math.min(responseCount + 1, promptCount)}
          </>
        )}
        {status === "alert" && (
          <>
            Severe content flagged · review now
          </>
        )}
      </span>
    </li>
  );
}

function TranscriptStream({ items }: { items: InFlight[] }) {
  // Take the most recent five non-empty response snippets across all in-flight reflections.
  const samples = useMemo(() => {
    const all: { id: string; text: string; at: string; name: string }[] = [];
    for (const item of items) {
      for (const resp of item.reflection.responses) {
        const text = resp.text?.trim();
        if (!text) continue;
        all.push({
          id: `${item.reflection.id}-${resp.promptId}`,
          text,
          at: resp.createdAt,
          name: item.reflection.participantName,
        });
      }
    }
    all.sort((a, b) => (a.at < b.at ? 1 : -1));
    return all.slice(0, 5);
  }, [items]);

  if (samples.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/20 p-5 text-center text-[12px] text-foreground/50">
        Streaming transcript samples will appear here as students respond.
      </div>
    );
  }

  return (
    <section
      aria-live="polite"
      aria-atomic="false"
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/30 px-5 py-5"
    >
      <div className="pointer-events-none absolute -top-12 right-8 h-44 w-44 opacity-30">
        <RippleField intensity={0.05} />
      </div>
      <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Streaming snippets
      </p>
      <ul className="space-y-2">
        {samples.map((s, i) => (
          <li
            key={s.id}
            className={cn(
              "font-display italic leading-snug text-foreground/55",
              i === 0 && "text-foreground/75",
              "text-[14px]",
            )}
            style={{ opacity: Math.max(0.35, 1 - i * 0.16) }}
          >
            <span className="text-[10px] not-italic uppercase tracking-[0.18em] text-muted-foreground">
              {s.name}
            </span>
            <span className="mx-2 text-muted-foreground/50">·</span>
            &ldquo;{snippet(s.text)}&rdquo;
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyLiveState({ groupName }: { groupName?: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/30 p-12 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <RippleField intensity={0.04} />
      </div>
      <div className="relative mx-auto mb-3 flex h-12 w-12 items-center justify-center">
        <GlowingDot mode="steady" className="!relative !z-0" />
      </div>
      <h3 className="font-display text-xl tracking-tight">No live session right now.</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-foreground/70">
        {groupName
          ? `Start an activity from the ${groupName} group page to see student reflections in real time.`
          : "Start an activity from a group page to see student reflections in real time."}
      </p>
      <div className="relative mt-5">
        <Button asChild size="sm" variant="outline">
          <Link href="/app">
            <Mic className="h-4 w-4" />
            Open a group
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ---------- helpers ----------

const METADATA: Record<
  InFlight["status"],
  { label: string; icon: React.ReactNode; dotClass: string; chipClass: string }
> = {
  recording: {
    label: "Recording",
    icon: <Mic className="h-3 w-3" />,
    dotClass: "bg-triage-blue ring-1 ring-foreground/10",
    chipClass: "bg-triage-blue-bg text-triage-blue ring-1 ring-inset ring-triage-blue/30",
  },
  done: {
    label: "Done",
    icon: <CheckCircle2 className="h-3 w-3" />,
    dotClass: "bg-triage-sunny",
    chipClass: "bg-triage-sunny-bg text-triage-sunny ring-1 ring-inset ring-triage-sunny/30",
  },
  stuck: {
    label: "Stuck",
    icon: <Hourglass className="h-3 w-3" />,
    dotClass: "bg-triage-orange",
    chipClass: "bg-triage-orange-bg text-triage-orange ring-1 ring-inset ring-triage-orange/30",
  },
  alert: {
    label: "Alert",
    icon: <AlertTriangle className="h-3 w-3" />,
    dotClass: "bg-triage-rose",
    chipClass: "bg-triage-rose-bg text-triage-rose ring-1 ring-inset ring-triage-rose/30",
  },
};

function buildInFlight(reflections: Reflection[], activity: Activity, now: number): InFlight[] {
  const promptCount = activity.prompts.length || 1;
  return reflections
    .map((r) => {
      const ageMs = now - new Date(r.createdAt).getTime();
      const responseCount = r.responses.length;
      const hasAlert = (r.analysis?.contentAlerts ?? []).some((a) => a.severity === "high");
      let status: InFlight["status"];
      if (hasAlert) {
        status = "alert";
      } else if (r.completedAt || r.analysis) {
        status = "done";
      } else if (responseCount === 0 && ageMs > STUCK_AFTER_MS) {
        status = "stuck";
      } else if (responseCount > 0 && ageMs - responseCount * STUCK_AFTER_MS > STUCK_AFTER_MS) {
        status = "stuck";
      } else {
        status = "recording";
      }
      return { reflection: r, status, ageMs, responseCount, promptCount };
    })
    .sort((a, b) => statusRank(a.status) - statusRank(b.status));
}

function statusRank(s: InFlight["status"]): number {
  if (s === "alert") return 0;
  if (s === "stuck") return 1;
  if (s === "recording") return 2;
  return 3;
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function snippet(text: string): string {
  const clean = text.trim();
  if (clean.length <= 120) return clean;
  return `${clean.slice(0, 117)}…`;
}
