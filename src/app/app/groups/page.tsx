"use client";

import Link from "next/link";
import { ArrowUpRight, GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/storage";
import { getGradeBand } from "@/lib/grade-bands";
import type { Group, ScoreColor } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

export default function GroupsListPage() {
  const groups = useStore((s) =>
    s.groups
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  );
  const reflections = useStore((s) => s.reflections);
  const participants = useStore((s) => s.participants);
  const activities = useStore((s) => s.activities);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
            Workspace
          </p>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">
            Groups
          </h1>
          <p className="mt-2 max-w-prose text-foreground/70">
            One per class, cohort, or team. Open a group to assign activities,
            triage reflections, and follow individual growth.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/app/groups/new">
            <Plus className="h-4 w-4" />
            New group
          </Link>
        </Button>
      </header>

      {groups.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              participantCount={
                participants.filter((p) => p.groupId === g.id).length ||
                // fall back to participantIds length on the group itself
                g.participantIds.length
              }
              triage={summariseTriage(reflections, g.id)}
              lastActivityAt={lastActivityAt(activities, reflections, g.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CardProps {
  group: Group;
  participantCount: number;
  triage: { sunny: number; orange: number; blue: number; rose: number; total: number };
  lastActivityAt: string | null;
}

function GroupCard({ group, participantCount, triage, lastActivityAt }: CardProps) {
  const gradeBand = getGradeBand(group.gradeBand);
  return (
    <Link
      href={`/app/groups/${group.id}`}
      className={cn(
        "group relative flex h-full flex-col gap-5 rounded-3xl border border-border/70 bg-card p-6 transition-all",
        "hover:-translate-y-0.5 hover:border-primary/30",
        "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_24px_48px_-32px_rgba(120,165,220,0.18)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="margin-note uppercase tracking-[0.18em] text-[0.65rem]">
            {participantCount} {participantCount === 1 ? "Student" : "Students"}
          </p>
          <h2 className="mt-1 font-display text-xl leading-tight tracking-tight">
            {group.name}
          </h2>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
      </div>

      <div className="flex-1" />

      <TriageStrip triage={triage} />

      <div className="flex items-center justify-between text-[12px] text-foreground/60">
        <span className="font-mono uppercase tracking-[0.16em] text-[10px]">
          {gradeBand.range}
        </span>
        <span>
          {lastActivityAt
            ? `Last activity ${formatRelativeTime(lastActivityAt)}`
            : "No activity yet"}
        </span>
      </div>
    </Link>
  );
}

function TriageStrip({
  triage,
}: {
  triage: { sunny: number; orange: number; blue: number; rose: number; total: number };
}) {
  if (triage.total === 0) {
    return (
      <p className="text-[12px] italic text-foreground/55 font-display">
        Awaiting first reflection
      </p>
    );
  }
  const items: { color: ScoreColor; count: number; label: string; cls: string }[] = [
    { color: "sunny", count: triage.sunny, label: "Sunny", cls: "bg-triage-sunny" },
    { color: "orange", count: triage.orange, label: "Orange", cls: "bg-triage-orange" },
    { color: "blue", count: triage.blue, label: "Blue", cls: "bg-triage-blue" },
  ];
  if (triage.rose > 0) {
    items.unshift({
      color: "rose",
      count: triage.rose,
      label: "Rose",
      cls: "bg-triage-rose ring-2 ring-triage-rose/40",
    });
  }
  return (
    <div className="flex items-center gap-3">
      {items.map((it) => (
        <span
          key={it.color}
          className="inline-flex items-center gap-1.5"
          title={`${it.count} ${it.label.toLowerCase()}`}
        >
          <span
            aria-hidden
            className={cn("h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-foreground/10", it.cls)}
          />
          <span className="font-mono text-[12px] tabular-nums text-foreground/85">
            {it.count}
          </span>
          <span className="sr-only">
            {it.count} {it.label.toLowerCase()} reflections
          </span>
        </span>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 px-6 py-16 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <GraduationCap className="h-6 w-6" />
      </div>
      <h2 className="font-display text-2xl tracking-tight">No groups yet</h2>
      <p className="mx-auto mt-2 max-w-md text-foreground/70">
        A group is your class, cohort, or team. Make one and you can assign
        activities, share a link, and watch the triage roll in.
      </p>
      <Button asChild className="mt-6">
        <Link href="/app/groups/new">
          <Plus className="h-4 w-4" />
          Create your first group
        </Link>
      </Button>
    </div>
  );
}

// ---------- helpers ----------

type ReflectionLike = {
  groupId: string | null;
  createdAt: string;
  analysis?: {
    scoreColor: ScoreColor;
    contentAlerts?: { severity: string }[];
  };
};

type ActivityLike = {
  groupId: string;
  assignedAt?: string;
  createdAt: string;
};

function summariseTriage(reflections: ReflectionLike[], groupId: string) {
  const out = { sunny: 0, orange: 0, blue: 0, rose: 0, total: 0 };
  for (const r of reflections) {
    if (r.groupId !== groupId) continue;
    const c = r.analysis?.scoreColor;
    if (!c) continue;
    out[c] += 1;
    out.total += 1;
    if ((r.analysis?.contentAlerts ?? []).some((a) => a.severity === "high")) {
      // Already counted in its triage color; surface a rose flag too if not already rose.
      if (c !== "rose") out.rose += 1;
    }
  }
  return out;
}

function lastActivityAt(
  activities: ActivityLike[],
  reflections: ReflectionLike[],
  groupId: string,
): string | null {
  const a = activities
    .filter((x) => x.groupId === groupId)
    .map((x) => x.assignedAt ?? x.createdAt);
  const r = reflections.filter((x) => x.groupId === groupId).map((x) => x.createdAt);
  const all = [...a, ...r];
  if (all.length === 0) return null;
  return all.sort().reverse()[0];
}
