"use client";

import { useMemo } from "react";
import Link from "next/link";
import { TrendingDown, TrendingUp, Minus, ListTree, Layers } from "lucide-react";
import { useStore } from "@/lib/storage";
import { GrowthChart } from "@/components/growth-chart";
import { TrendSparkline } from "@/components/trend-sparkline";
import { Button } from "@/components/ui/button";
import type { Group, Reflection, ScoreColor } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  group: Group | null;
}

export function InsightsTab({ group }: Props) {
  const reflections = useStore((s) => s.reflections);

  const groupReflections = useMemo<Reflection[]>(() => {
    if (!group) return reflections;
    return reflections.filter((r) => r.groupId === group.id);
  }, [reflections, group]);

  if (!group && reflections.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 bg-card/30 p-12 text-center">
        <h3 className="font-display text-xl tracking-tight">Insights will appear here</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-foreground/70">
          As reflections come in, this view shows class trends, recurring themes, and a focus
          heatmap so you can see what is changing week over week.
        </p>
      </div>
    );
  }

  if (groupReflections.length === 0 && group) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 bg-card/30 p-12 text-center">
        <h3 className="font-display text-xl tracking-tight">
          {group.name} is too quiet for insights yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-foreground/70">
          Once a few students reflect, the trend chart, recurring themes, and focus heatmap will
          appear here.
        </p>
        <Button asChild className="mt-5" size="sm" variant="outline">
          <Link href={`/app/groups/${group.id}`}>Open the group</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <AverageLevelCard reflections={groupReflections} />
      <RecurringThemesCard reflections={groupReflections} />
      <FocusHeatmapCard reflections={groupReflections} />
      <div className="lg:col-span-3">
        <GrowthChartBlock reflections={groupReflections} />
      </div>
    </div>
  );
}

// ---------- avg level + trend ----------

function AverageLevelCard({ reflections }: { reflections: Reflection[] }) {
  const stats = useMemo(() => computeAverageStats(reflections), [reflections]);

  if (!stats) {
    return (
      <Card title="Class average level" subtitle="Trend">
        <p className="text-sm text-foreground/70">
          Add a few analyzed reflections — the class average and its trend will land here.
        </p>
      </Card>
    );
  }

  const Trend = stats.delta > 0.05 ? TrendingUp : stats.delta < -0.05 ? TrendingDown : Minus;
  const trendTone =
    stats.delta > 0.05
      ? "text-triage-sunny"
      : stats.delta < -0.05
        ? "text-triage-orange"
        : "text-muted-foreground";

  return (
    <Card title="Class average level" subtitle="Last vs. previous half">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-5xl tracking-tight tabular-nums">
          {stats.recent.toFixed(1)}
        </span>
        <span className="text-sm text-foreground/60">/ 4</span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <span className="font-mono tabular-nums text-foreground/70">
          {stats.previous.toFixed(1)} → {stats.recent.toFixed(1)}
        </span>
        <span className={cn("inline-flex items-center gap-1 font-medium", trendTone)}>
          <Trend className="h-4 w-4" />
          {stats.deltaPct >= 0 ? "+" : ""}
          {stats.deltaPct}%
        </span>
      </div>
      <div className="mt-4">
        <TrendSparkline points={stats.points} width={200} height={36} className="text-foreground/60" />
      </div>
      <p className="mt-3 text-[12px] text-muted-foreground">
        Across {stats.count} analyzed reflection{stats.count === 1 ? "" : "s"}.
      </p>
    </Card>
  );
}

// ---------- recurring themes (placeholder) ----------

function RecurringThemesCard({ reflections }: { reflections: Reflection[] }) {
  const themes = useMemo(() => deriveLocalThemes(reflections), [reflections]);
  return (
    <Card
      title="Recurring themes"
      subtitle="Patterns across the class"
      icon={<ListTree className="h-3.5 w-3.5" />}
      badge="Local"
    >
      {themes.length === 0 ? (
        <p className="text-sm text-foreground/70">
          Once enough reflections are analyzed, recurring themes — common cognitive moves and
          struggles — will surface here with a suggested teacher response.
        </p>
      ) : (
        <ul className="space-y-3">
          {themes.map((t) => (
            <li
              key={t.label}
              className="rounded-xl border border-border/40 bg-card/40 px-3 py-3"
            >
              <p className="font-display italic text-foreground/85 text-[15px] leading-snug">
                &ldquo;{t.label}&rdquo;
              </p>
              <p className="mt-1 flex items-start gap-2 text-[12.5px] text-foreground/60">
                <span aria-hidden className="mt-1 inline-block h-px w-3 bg-border/80" />
                <span>{t.move}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Themes from `/api/ai/group-summary` coming soon — derived locally from skill tags for now.
      </p>
    </Card>
  );
}

// ---------- focus area heatmap ----------

function FocusHeatmapCard({ reflections }: { reflections: Reflection[] }) {
  const grid = useMemo(() => buildFocusHeatmap(reflections), [reflections]);
  return (
    <Card
      title="Focus area heatmap"
      subtitle="Last 7 days"
      icon={<Layers className="h-3.5 w-3.5" />}
    >
      {grid.students.length === 0 ? (
        <p className="text-sm text-foreground/70">
          When students reflect over the next week, this is where you&rsquo;ll see who is rising,
          who is steady, and who needs a check-in.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-xs">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="w-24 py-1 pr-2 text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Student
                </th>
                {grid.days.map((d) => (
                  <th
                    key={d.key}
                    scope="col"
                    className="py-1 text-center text-[10px] font-mono tabular-nums text-muted-foreground"
                  >
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.students.map((row) => (
                <tr key={row.name}>
                  <th
                    scope="row"
                    className="truncate py-1 pr-2 text-left text-[12px] font-medium text-foreground/85"
                    title={row.name}
                  >
                    {row.name}
                  </th>
                  {row.cells.map((cell, i) => (
                    <td key={i} className="px-0.5 py-0.5">
                      <span
                        aria-label={
                          cell ? `${row.name} ${grid.days[i].label} level ${cell.level}` : `${row.name} ${grid.days[i].label} no reflection`
                        }
                        className={cn(
                          "block h-5 w-full rounded-md ring-1 ring-inset",
                          cell ? colorBgClass(cell.color) : "bg-muted/30 ring-border/30",
                        )}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ---------- main growth chart block ----------

function GrowthChartBlock({ reflections }: { reflections: Reflection[] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/30 p-5">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Growth over time
          </p>
          <h3 className="font-display text-xl tracking-tight">Class growth chart</h3>
        </div>
      </header>
      <GrowthChart reflections={reflections} />
    </div>
  );
}

// ---------- generic Card ----------

function Card({
  title,
  subtitle,
  children,
  icon,
  badge,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string;
}) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card/30 p-5">
      <header className="mb-4">
        {subtitle && (
          <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {icon}
            {subtitle}
          </p>
        )}
        <div className="mt-1 flex items-center justify-between gap-2">
          <h3 className="font-display text-xl tracking-tight">{title}</h3>
          {badge && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
      </header>
      {children}
    </article>
  );
}

// ---------- math + helpers ----------

interface AverageStats {
  recent: number;
  previous: number;
  delta: number;
  deltaPct: number;
  points: number[];
  count: number;
}

function computeAverageStats(reflections: Reflection[]): AverageStats | null {
  const scored = reflections
    .filter((r) => r.analysis)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)); // chronological
  if (scored.length < 2) {
    if (scored.length === 1) {
      const lvl = scored[0].analysis!.reflectionLevel;
      return {
        recent: lvl,
        previous: lvl,
        delta: 0,
        deltaPct: 0,
        points: [lvl],
        count: 1,
      };
    }
    return null;
  }
  const half = Math.floor(scored.length / 2);
  const previous = avg(scored.slice(0, half).map((r) => r.analysis!.reflectionLevel));
  const recent = avg(scored.slice(half).map((r) => r.analysis!.reflectionLevel));
  const delta = recent - previous;
  const deltaPct = previous === 0 ? 0 : Math.round((delta / previous) * 100);
  return {
    previous,
    recent,
    delta,
    deltaPct,
    points: scored.map((r) => r.analysis!.reflectionLevel),
    count: scored.length,
  };
}

function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

interface Theme {
  label: string;
  move: string;
}

function deriveLocalThemes(reflections: Reflection[]): Theme[] {
  const tally = new Map<string, number>();
  for (const r of reflections) {
    const skills = r.analysis?.keyCognitiveSkills ?? [];
    for (const skill of skills) {
      const key = skill.trim();
      if (!key) continue;
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
    if (r.analysis?.hiddenLesson) {
      const key = r.analysis.hiddenLesson.trim();
      if (key) tally.set(key, (tally.get(key) ?? 0) + 1);
    }
  }
  const sorted = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  return sorted.map(([label, count]) => ({
    label,
    move: count > 1
      ? `Spotlight one student who showed this and ask the class to add to it.`
      : `Pull this thread tomorrow with a single follow-up question.`,
  }));
}

interface FocusGrid {
  days: { key: string; label: string }[];
  students: { name: string; cells: ({ color: ScoreColor; level: number } | null)[] }[];
}

function buildFocusHeatmap(reflections: Reflection[]): FocusGrid {
  const today = startOfLocalDay(new Date());
  const days: FocusGrid["days"] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * 86_400_000);
    days.push({ key: localDayKey(d), label: shortDayLabel(d) });
  }

  const namesInOrder: string[] = [];
  const byStudent: Map<string, Map<string, { color: ScoreColor; level: number }>> = new Map();
  for (const r of reflections) {
    if (!r.analysis) continue;
    const name = r.participantName;
    if (!byStudent.has(name)) {
      byStudent.set(name, new Map());
      namesInOrder.push(name);
    }
    const day = localDayKey(new Date(r.createdAt));
    if (!days.some((d) => d.key === day)) continue;
    byStudent.get(name)!.set(day, {
      color: r.analysis.scoreColor,
      level: r.analysis.reflectionLevel,
    });
  }

  // Cap students shown to 14 (the densest readable in a card).
  const students = namesInOrder.slice(0, 14).map((name) => {
    const dayMap = byStudent.get(name)!;
    return {
      name,
      cells: days.map((d) => dayMap.get(d.key) ?? null),
    };
  });

  return { days, students };
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shortDayLabel(d: Date): string {
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${weekday[0]}${d.getDate()}`;
}

function colorBgClass(color: ScoreColor): string {
  switch (color) {
    case "sunny":
      return "bg-triage-sunny/85 ring-triage-sunny/30";
    case "orange":
      return "bg-triage-orange/85 ring-triage-orange/30";
    case "blue":
      return "bg-triage-blue/85 ring-triage-blue/30";
    case "rose":
      return "bg-triage-rose/85 ring-triage-rose/30";
  }
}
