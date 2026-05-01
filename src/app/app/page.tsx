"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Flame, GraduationCap, LibraryBig, Plus, Sparkles, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TriageCard } from "@/components/triage-card";
import { SeedDemoData } from "@/components/seed-demo-data";
import { formatRelativeTime } from "@/lib/utils";
import { computeCurrentStreak } from "@/lib/streaks";
import type { Reflection } from "@/lib/types";

export default function DashboardHome() {
  const groups = useStore((s) => s.groups);
  const reflections = useStore((s) => s.reflections);
  const personal = reflections.filter((r) => r.activityId === null);
  const recentGroup = reflections.filter((r) => r.activityId !== null).slice(0, 6);
  const currentStreak = computeCurrentStreak(personal.map((r) => r.createdAt));

  return (
    <div className="space-y-10">
      <section className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-7">
          <h1 className="font-display text-4xl leading-tight tracking-tight">
            Reflect a little. <span className="text-muted-foreground">Learn a lot.</span>
          </h1>
          <p className="mt-2 max-w-xl text-foreground/75">
            Pick up where you left off, or start something new. Your reflections,
            groups, and activities live here.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href="/app/personal">
                <Sparkles className="h-4 w-4" />
                New personal reflection
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/app/groups/new">
                <Plus className="h-4 w-4" />
                Create a group
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/app/library">
                <LibraryBig className="h-4 w-4" />
                Activity library
              </Link>
            </Button>
          </div>
        </div>
        <div className="md:col-span-5">
          <Card className="bg-gradient-to-br from-primary/[0.04] via-card to-secondary/[0.04]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Quick stats</CardTitle>
                <Badge variant="primary">All-time</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Groups" value={groups.length} />
                <Stat label="Reflections" value={reflections.length} />
                <Stat label="Personal" value={personal.length} />
                <Stat
                  label="Current streak"
                  value={currentStreak}
                  icon={<Flame className="h-3.5 w-3.5 text-triage-orange" />}
                />
              </div>
              <Link
                href="/app/growth"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                View your growth
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Your groups"
          actionHref="/app/groups/new"
          actionLabel="New group"
        />
        {groups.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="h-6 w-6" />}
            title="No groups yet"
            body="Create a class, cohort, or team to assign reflection activities and see analytics."
            cta={{ href: "/app/groups/new", label: "Create your first group" }}
            extra={
              reflections.length === 0 ? (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <span className="text-xs text-muted-foreground">
                    Or load demo data to explore the app
                  </span>
                  <SeedDemoData />
                </div>
              ) : null
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <GroupTile key={g.id} group={g} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Recent personal reflections" actionHref="/app/personal" actionLabel="New reflection" />
        {personal.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title="Nothing personal yet"
            body="Personal reflections are private. Try one and see what surfaces."
            cta={{ href: "/app/personal", label: "Start a personal reflection" }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {personal.slice(0, 6).map((r) => (
              <PersonalRow key={r.id} reflection={r} />
            ))}
          </div>
        )}
      </section>

      {recentGroup.length > 0 && (
        <section>
          <SectionHeader title="Latest from your groups" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentGroup.map((r) => (
              <TriageCard
                key={r.id}
                reflection={r}
                href={`/app/reflections/${r.id}`}
                showScore
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
      <div className="flex items-center gap-1.5 text-2xl font-display font-semibold tracking-tight text-foreground">
        {icon}
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function SectionHeader({
  title,
  actionHref,
  actionLabel,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="font-display text-2xl tracking-tight">{title}</h2>
      {actionHref && actionLabel && (
        <Button asChild size="sm" variant="ghost">
          <Link href={actionHref}>
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  cta,
  extra,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta?: { href: string; label: string };
  extra?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="max-w-sm">{body}</CardDescription>
        {cta && (
          <Button asChild className="mt-2">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        )}
        {extra}
      </CardContent>
    </Card>
  );
}

function GroupTile({ group }: { group: { id: string; name: string; gradeBand: string; createdAt: string } }) {
  const reflections = useStore((s) => s.reflections.filter((r) => r.groupId === group.id));
  const activities = useStore((s) => s.activities.filter((a) => a.groupId === group.id));

  return (
    <Link
      href={`/app/groups/${group.id}`}
      className="group flex h-full flex-col gap-2 rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-xl tracking-tight">{group.name}</div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {prettyGrade(group.gradeBand)}
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
      <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="muted">{activities.length} activities</Badge>
        <Badge variant="muted">{reflections.length} reflections</Badge>
      </div>
    </Link>
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

function prettyGrade(g: string) {
  const map: Record<string, string> = {
    "k-2": "K–2",
    "3-5": "Grades 3–5",
    "6-8": "Middle school",
    "9-12": "High school",
    "higher-ed": "Higher education",
    adult: "Adult learners",
    professional: "Professional learning",
  };
  return map[g] ?? g;
}
