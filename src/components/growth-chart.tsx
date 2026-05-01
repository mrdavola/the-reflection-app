"use client";

import { cn, formatDate } from "@/lib/utils";
import type { Reflection, ScoreColor } from "@/lib/types";

interface Props {
  reflections: Reflection[];
  className?: string;
}

interface Point {
  x: number;
  y: number;
  level: 1 | 2 | 3 | 4;
  color: ScoreColor;
  date: string;
}

const VIEW_W = 640;
const VIEW_H = 220;
const PAD_LEFT = 36;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 32;

const COLOR_MAP: Record<ScoreColor, string> = {
  sunny: "hsl(var(--triage-sunny))",
  orange: "hsl(var(--triage-orange))",
  blue: "hsl(var(--triage-blue))",
  rose: "hsl(var(--triage-rose))",
};

export function GrowthChart({ reflections, className }: Props) {
  // Most recent 30 with analyses, then ordered chronologically (oldest -> newest).
  const scored = reflections
    .filter((r) => r.analysis)
    .slice(0, 30)
    .reverse();

  if (scored.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[180px] items-center justify-center rounded-3xl border border-dashed border-border/70 bg-card/40 p-6 text-sm text-muted-foreground",
          className,
        )}
      >
        Reflect a few times — your growth chart will appear here.
      </div>
    );
  }

  const innerW = VIEW_W - PAD_LEFT - PAD_RIGHT;
  const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;

  const xFor = (i: number) =>
    scored.length === 1
      ? PAD_LEFT + innerW / 2
      : PAD_LEFT + (i / (scored.length - 1)) * innerW;
  // Level 1 -> bottom, Level 4 -> top.
  const yFor = (level: number) =>
    PAD_TOP + ((4 - level) / 3) * innerH;

  const points: Point[] = scored.map((r, i) => ({
    x: xFor(i),
    y: yFor(r.analysis!.reflectionLevel),
    level: r.analysis!.reflectionLevel,
    color: r.analysis!.scoreColor,
    date: r.createdAt,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const firstDate = points[0].date;
  const lastDate = points[points.length - 1].date;

  return (
    <div className={cn("rounded-3xl border border-border/60 bg-card p-4 sm:p-5", className)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="block h-56 w-full"
        role="img"
        aria-label="Reflection level over time"
      >
        {/* Y gridlines + labels (levels 1–4) */}
        {[1, 2, 3, 4].map((lvl) => {
          const y = yFor(lvl);
          return (
            <g key={lvl}>
              <line
                x1={PAD_LEFT}
                x2={VIEW_W - PAD_RIGHT}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-border"
                strokeDasharray={lvl === 1 ? undefined : "2 4"}
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                L{lvl}
              </text>
            </g>
          );
        })}

        {/* Connecting line */}
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          className="text-foreground/40"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots colored by triage */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={4.5}
              fill={COLOR_MAP[p.color]}
              stroke="hsl(var(--card))"
              strokeWidth={1.5}
            />
          </g>
        ))}

        {/* First/last date labels */}
        <text
          x={PAD_LEFT}
          y={VIEW_H - 10}
          textAnchor="start"
          className="fill-muted-foreground text-[10px]"
        >
          {formatDate(firstDate)}
        </text>
        {points.length > 1 && (
          <text
            x={VIEW_W - PAD_RIGHT}
            y={VIEW_H - 10}
            textAnchor="end"
            className="fill-muted-foreground text-[10px]"
          >
            {formatDate(lastDate)}
          </text>
        )}
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-triage-sunny" />
          Sunny
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-triage-orange" />
          Orange
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-triage-blue" />
          Blue
        </span>
        <span className="ml-auto">{points.length} of last {Math.min(reflections.length, 30)} reflections</span>
      </div>
    </div>
  );
}
