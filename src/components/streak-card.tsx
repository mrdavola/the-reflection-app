"use client";

import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  computeCurrentStreak,
  computeLongestStreak,
} from "@/lib/streaks";
import { cn } from "@/lib/utils";

interface Props {
  dates: string[];
  totalReflections: number;
  className?: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

export function StreakCard({ dates, totalReflections, className }: Props) {
  const current = computeCurrentStreak(dates);
  const longest = computeLongestStreak(dates);

  const today = startOfLocalDay(new Date());
  const dayKeys = new Set<string>();
  for (const iso of dates) {
    const t = new Date(iso);
    if (!Number.isNaN(t.getTime())) dayKeys.add(localDayKey(t));
  }

  // Last 7 days, oldest -> today
  const last7: { key: string; weekday: string; filled: boolean; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * MS_PER_DAY);
    const key = localDayKey(d);
    last7.push({
      key,
      weekday: WEEKDAY[d.getDay()],
      filled: dayKeys.has(key),
      isToday: i === 0,
    });
  }

  return (
    <Card className={cn("bg-gradient-to-br from-primary/[0.05] via-card to-secondary/[0.04]", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-triage-orange" />
            Reflection streak
          </CardTitle>
          <Badge variant={current > 0 ? "primary" : "muted"}>
            {current > 0 ? "Active" : "Idle"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-end gap-3">
          <div className="font-display text-5xl font-semibold leading-none tracking-tight">
            {current}
          </div>
          <div className="pb-1 text-sm text-muted-foreground">
            day{current === 1 ? "" : "s"} in a row
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            Last 7 days
          </div>
          <div className="flex items-center justify-between gap-1.5">
            {last7.map((d, i) => (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "h-7 w-7 rounded-full ring-1 transition-colors",
                    d.filled
                      ? "bg-triage-orange ring-triage-orange/40"
                      : "bg-muted/50 ring-border",
                    d.isToday && !d.filled && "ring-2 ring-primary/40",
                  )}
                  aria-label={`${d.key} ${d.filled ? "reflected" : "no reflection"}`}
                />
                <div
                  className={cn(
                    "text-[10px] font-medium",
                    d.isToday ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {d.weekday}
                  {/* unique key suffix so duplicate weekday letters don't clash visually */}
                  <span className="sr-only">{` ${i}`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="Longest streak" value={`${longest} day${longest === 1 ? "" : "s"}`} />
          <MiniStat label="Total reflections" value={String(totalReflections)} />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 ring-1 ring-border/60">
      <div className="font-display text-lg font-semibold tracking-tight text-foreground">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
