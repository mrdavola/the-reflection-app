"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Filter, GraduationCap, LayoutGrid, List, Grid3x3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/storage";
import type { Group, Reflection, ScoreColor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TriageRow, type TriageRowData } from "./triage-row";

interface Props {
  group: Group | null;
}

type ViewMode = "cards" | "compact" | "heatmap";
type SortMode = "attention" | "name" | "recent" | "level-high" | "level-low";
type FilterMode = "all" | ScoreColor;

const SEEN_KEY = "reflection-app:dashboard-seen";

const COLOR_RANK: Record<ScoreColor, number> = {
  rose: 0,
  orange: 1,
  blue: 2,
  sunny: 3,
};

export function TriageTab({ group }: Props) {
  const reflections = useStore((s) => s.reflections);
  const [view, setView] = useState<ViewMode>("cards");
  const [sort, setSort] = useState<SortMode>("attention");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [seen, setSeen] = useState<Set<string>>(() => loadSeen());

  // Persist seen across sessions.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
    } catch {
      // ignore quota errors
    }
  }, [seen]);

  const groupReflections = useMemo<Reflection[]>(() => {
    if (!group) return [];
    return reflections.filter((r) => r.groupId === group.id);
  }, [reflections, group]);

  const rows = useMemo<TriageRowData[]>(
    () => groupReflections.map(buildRowData),
    [groupReflections],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.color === filter);
  }, [rows, filter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      // Safety alerts always pin to top.
      if (a.hasSafetyAlert !== b.hasSafetyAlert) {
        return a.hasSafetyAlert ? -1 : 1;
      }
      switch (sort) {
        case "attention":
          if (COLOR_RANK[a.color] !== COLOR_RANK[b.color]) {
            return COLOR_RANK[a.color] - COLOR_RANK[b.color];
          }
          return a.level - b.level;
        case "name":
          return a.reflection.participantName.localeCompare(b.reflection.participantName);
        case "recent":
          return a.reflection.createdAt < b.reflection.createdAt ? 1 : -1;
        case "level-high":
          return b.level - a.level;
        case "level-low":
          return a.level - b.level;
        default:
          return 0;
      }
    });
    return copy;
  }, [filtered, sort]);

  const handleMarkSeen = (id: string) => {
    setSeen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!group) {
    return <NoGroupState />;
  }

  if (rows.length === 0) {
    return <NoReflectionsState groupId={group.id} />;
  }

  return (
    <section className="space-y-4">
      <Toolbar
        view={view}
        onViewChange={setView}
        sort={sort}
        onSortChange={setSort}
        filter={filter}
        onFilterChange={setFilter}
        total={rows.length}
        visible={sorted.length}
      />

      {sorted.length === 0 ? (
        <EmptyFilterState onReset={() => setFilter("all")} />
      ) : view === "heatmap" ? (
        <Heatmap rows={sorted} />
      ) : (
        <ul
          className={cn(
            "rounded-2xl border border-border/60 bg-card/30 overflow-hidden",
            view === "compact" ? "divide-y divide-border/30" : "",
          )}
        >
          {sorted.map((row) => (
            <TriageRow
              key={row.reflection.id}
              data={row}
              density={view === "compact" ? "compact" : "cards"}
              seen={seen.has(row.reflection.id)}
              onMarkSeen={handleMarkSeen}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------- toolbar ----------

function Toolbar({
  view,
  onViewChange,
  sort,
  onSortChange,
  filter,
  onFilterChange,
  total,
  visible,
}: {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  sort: SortMode;
  onSortChange: (s: SortMode) => void;
  filter: FilterMode;
  onFilterChange: (f: FilterMode) => void;
  total: number;
  visible: number;
}) {
  const sortLabels: Record<SortMode, string> = {
    attention: "Needs attention",
    name: "Name A–Z",
    recent: "Most recent",
    "level-high": "Highest level",
    "level-low": "Lowest level",
  };
  const filterLabels: Record<FilterMode, string> = {
    all: "All",
    sunny: "Sunny only",
    orange: "Orange only",
    blue: "Blue only",
    rose: "Rose only",
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <div className="flex items-center gap-2">
        <ViewToggle view={view} onChange={onViewChange} />
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {visible} of {total}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
              {filterLabels[filter]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
            {(Object.keys(filterLabels) as FilterMode[]).map((f) => (
              <DropdownMenuItem key={f} onClick={() => onFilterChange(f)}>
                <span
                  aria-hidden
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    f === "all" && "bg-muted-foreground/40",
                    f === "sunny" && "bg-triage-sunny",
                    f === "orange" && "bg-triage-orange",
                    f === "blue" && "bg-triage-blue",
                    f === "rose" && "bg-triage-rose",
                  )}
                />
                <span className="flex-1">{filterLabels[f]}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Sort
              </span>
              <span>{sortLabels[sort]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort</DropdownMenuLabel>
            {(Object.keys(sortLabels) as SortMode[]).map((s) => (
              <DropdownMenuItem key={s} onClick={() => onSortChange(s)}>
                <span className="flex-1">{sortLabels[s]}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const opts: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: "cards", label: "Cards", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    { id: "compact", label: "Compact", icon: <List className="h-3.5 w-3.5" /> },
    { id: "heatmap", label: "Heatmap", icon: <Grid3x3 className="h-3.5 w-3.5" /> },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border/70 bg-card/60 p-0.5">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            view === o.id
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={view === o.id}
        >
          {o.icon}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

// ---------- heatmap ----------

function Heatmap({ rows }: { rows: TriageRowData[] }) {
  const cellColor: Record<ScoreColor, string> = {
    sunny: "bg-triage-sunny/80 text-background",
    orange: "bg-triage-orange/80 text-background",
    blue: "bg-triage-blue/80 text-background",
    rose: "bg-triage-rose/80 text-background",
  };
  return (
    <div className="rounded-2xl border border-border/60 bg-card/30 p-4">
      <div className="grid grid-cols-7 gap-2 sm:grid-cols-7 md:grid-cols-7">
        {rows.map((r) => (
          <Link
            key={r.reflection.id}
            href={`/app/reflections/${r.reflection.id}`}
            title={`${r.reflection.participantName} · L${r.level} · ${r.quote || "—"}`}
            className={cn(
              "group relative aspect-square flex items-center justify-center rounded-xl text-xs font-mono font-semibold tabular-nums",
              "ring-1 ring-inset ring-foreground/10 transition-transform hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              cellColor[r.color],
              r.hasSafetyAlert && "ring-2 ring-triage-rose ring-offset-1 ring-offset-background",
            )}
          >
            <span aria-hidden>{initials(r.reflection.participantName)}</span>
            <span className="sr-only">
              {r.reflection.participantName}, level {r.level}, {r.color}
            </span>
            <span className="absolute -bottom-0.5 right-1 text-[9px] opacity-80">L{r.level}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ---------- empty states ----------

function NoGroupState() {
  return (
    <div className="rounded-3xl border border-dashed border-border/70 bg-card/30 p-12 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <GraduationCap className="h-6 w-6" />
      </div>
      <h3 className="font-display text-xl tracking-tight">Pick a group to triage</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-foreground/70">
        Use the group selector above to focus the triage view on one class. Or create your first group.
      </p>
      <Button asChild className="mt-5" size="sm">
        <Link href="/app/groups/new">Create a group</Link>
      </Button>
    </div>
  );
}

function NoReflectionsState({ groupId }: { groupId: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border/70 bg-card/30 p-12 text-center">
      <h3 className="font-display text-xl tracking-tight">No reflections yet</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-foreground/70">
        Once students respond to an activity, they appear here in default-by-attention order.
      </p>
      <Button asChild className="mt-5" size="sm" variant="outline">
        <Link href={`/app/groups/${groupId}`}>Open the group</Link>
      </Button>
    </div>
  );
}

function EmptyFilterState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-card/30 p-8 text-center text-sm text-foreground/70">
      No reflections match this filter.
      <button
        type="button"
        onClick={onReset}
        className="ml-2 font-medium text-primary hover:underline"
      >
        Show all
      </button>
    </div>
  );
}

// ---------- helpers ----------

function buildRowData(reflection: Reflection): TriageRowData {
  const a = reflection.analysis;
  const color: ScoreColor = a?.scoreColor ?? "blue";
  const level = a?.reflectionLevel ?? 1;
  const quote = pickQuote(reflection);
  const teacherMove = pickMove(reflection);
  const hasSafetyAlert =
    (a?.contentAlerts ?? []).some((alert) => alert.severity === "high") ?? false;
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

function pickMove(r: Reflection): string {
  if (r.analysis?.teacherFollowUp) return r.analysis.teacherFollowUp;
  if (r.analysis?.suggestedNextStep) return r.analysis.suggestedNextStep;
  return "";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function loadSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}
