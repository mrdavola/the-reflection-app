"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil, Sparkles, Share2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { TriageRow, type TriageRowData } from "@/components/dashboard";
import { getFocus } from "@/lib/focus-catalog";
import { useStore } from "@/lib/storage";
import type { Reflection, ScoreColor } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

const SEEN_KEY = (activityId: string) =>
  `reflection-app:activity-seen:${activityId}`;

export default function ActivityDetailPage() {
  const params = useParams<{ id: string; activityId: string }>();
  const groupId = params.id;
  const activityId = params.activityId;

  const group = useStore((s) => s.groups.find((g) => g.id === groupId));
  const activity = useStore((s) => s.activities.find((a) => a.id === activityId));
  const reflections = useStore((s) =>
    s.reflections
      .filter((r) => r.activityId === activityId)
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  );
  const participantCount = useStore(
    (s) =>
      s.participants.filter((p) => p.groupId === groupId).length ||
      s.groups.find((g) => g.id === groupId)?.participantIds.length ||
      0,
  );

  const [seen, setSeen] = useState<Set<string>>(() => loadSeen(activityId));

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SEEN_KEY(activityId), JSON.stringify([...seen]));
    } catch {
      // ignore
    }
  }, [seen, activityId]);

  const rows = useMemo<TriageRowData[]>(
    () => reflections.map(buildRowData),
    [reflections],
  );

  if (!group || !activity) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <CardTitle>Activity not found</CardTitle>
            <CardDescription>
              This activity may have been deleted.
            </CardDescription>
            <Button asChild className="mt-2">
              <Link href={`/app/groups/${groupId}`}>Back to group</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const focus = getFocus(activity.focus);
  const handleMarkSeen = (id: string) => {
    setSeen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-10">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/app/groups/${group.id}?tab=activities`}>
            <ArrowLeft className="h-4 w-4" />
            Back to {group.name}
          </Link>
        </Button>
      </div>

      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
              {focus.label}
              {activity.status === "draft" ? " · Draft" : " · Live"}
            </p>
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
              {activity.title || "Untitled activity"}
            </h1>
            {activity.objective && (
              <p className="max-w-prose font-display italic text-lg text-foreground/75">
                {activity.objective}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-sm">
              <Badge variant="muted">
                <Users className="h-3 w-3" />
                {reflections.length} of {participantCount || "?"} reflected
              </Badge>
              {activity.assignedAt && (
                <Badge variant="outline">
                  Assigned {formatRelativeTime(activity.assignedAt)}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link
                href={`/app/groups/${group.id}/activities/${activity.id}/setup`}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link
                href={`/app/groups/${group.id}/activities/${activity.id}/share`}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Link>
            </Button>
          </div>
        </div>
        <hr className="rule-soft mt-2" />
      </header>

      {/* Prompts */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-tight">Prompts</h2>
        {activity.prompts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No prompts yet — open Edit to add some.
            </CardContent>
          </Card>
        ) : (
          <ol className="overflow-hidden rounded-2xl border border-border/60 bg-card/30 divide-y divide-border/40">
            {activity.prompts.map((p, idx) => (
              <li key={p.id} className="flex items-start gap-4 px-5 py-4">
                <span className="font-display text-2xl leading-none text-foreground/40 tabular-nums">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg leading-snug">{p.text}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {p.source === "ai" ? "AI-generated" : "Teacher-written"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Reflections triage */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl tracking-tight">
              Reflections
            </h2>
            <p className="text-sm text-muted-foreground">
              Each row is one student&apos;s most recent answer.
            </p>
          </div>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {rows.length}
          </span>
        </div>
        {rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-card/30 px-6 py-12 text-center">
            <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="font-display text-lg">Awaiting first reflection</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-foreground/70">
              Share the link from the Share page — replies land here in real
              time.
            </p>
            <Button asChild className="mt-5" size="sm">
              <Link
                href={`/app/groups/${group.id}/activities/${activity.id}/share`}
              >
                <Share2 className="h-4 w-4" />
                Open share moment
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-border/60 bg-card/30">
            {rows.map((row) => (
              <TriageRow
                key={row.reflection.id}
                data={row}
                density="cards"
                seen={seen.has(row.reflection.id)}
                onMarkSeen={handleMarkSeen}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function buildRowData(reflection: Reflection): TriageRowData {
  const a = reflection.analysis;
  const color: ScoreColor = a?.scoreColor ?? "blue";
  const level = a?.reflectionLevel ?? 1;
  const quote = pickQuote(reflection);
  const teacherMove = a?.teacherFollowUp ?? a?.suggestedNextStep ?? "";
  const hasSafetyAlert = (a?.contentAlerts ?? []).some(
    (alert) => alert.severity === "high",
  );
  return { reflection, color, level, quote, teacherMove, hasSafetyAlert };
}

function pickQuote(r: Reflection): string {
  const fromAnalysis = r.analysis?.studentQuotes?.[0];
  if (fromAnalysis && fromAnalysis.trim()) return cleanQuote(fromAnalysis);
  const fromResponse = r.responses[0]?.text;
  if (fromResponse && fromResponse.trim()) {
    const clean = fromResponse.trim();
    return clean.length > 160 ? `${clean.slice(0, 157)}…` : clean;
  }
  return "";
}

function cleanQuote(q: string): string {
  const trimmed = q.replace(/^["“”']|["“”']$/g, "").trim();
  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed;
}

function loadSeen(activityId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY(activityId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}
