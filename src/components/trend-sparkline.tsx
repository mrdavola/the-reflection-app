"use client";

import { cn } from "@/lib/utils";

interface Props {
  points: number[]; // each value 1–4 (reflection level)
  width?: number;
  height?: number;
  className?: string;
}

function colorForLevel(level: number): string {
  // Mirrors the analysis-side level→scoreColor mapping.
  // 1 → blue, 2 → orange, 3+ → sunny.
  const rounded = Math.round(level);
  if (rounded >= 3) return "hsl(var(--triage-sunny))";
  if (rounded === 2) return "hsl(var(--triage-orange))";
  return "hsl(var(--triage-blue))";
}

export function TrendSparkline({
  points,
  width = 80,
  height = 28,
  className,
}: Props) {
  if (points.length === 0) return null;

  const padX = 3;
  const padY = 4;
  const innerW = Math.max(1, width - padX * 2);
  const innerH = Math.max(1, height - padY * 2);

  // Map level 1 → bottom of chart, level 4 → top of chart.
  const xFor = (i: number) => {
    if (points.length <= 1) return width / 2;
    return padX + (i / (points.length - 1)) * innerW;
  };
  const yFor = (level: number) => {
    const clamped = Math.max(1, Math.min(4, level));
    const t = (clamped - 1) / 3; // 0 at level 1, 1 at level 4
    return padY + (1 - t) * innerH;
  };

  if (points.length < 2) {
    const cx = xFor(0);
    const cy = yFor(points[0]);
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={cn("overflow-visible", className)}
        role="img"
        aria-label={`Reflection trend, single point at level ${points[0]}`}
      >
        <circle cx={cx} cy={cy} r={3} fill={colorForLevel(points[0])} />
      </svg>
    );
  }

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(2)} ${yFor(p).toFixed(2)}`)
    .join(" ");

  const lastLevel = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      role="img"
      aria-label={`Reflection trend across ${points.length} reflections, latest level ${lastLevel}`}
    >
      <path
        d={pathD}
        fill="none"
        stroke="hsl(var(--foreground) / 0.35)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={xFor(i)}
          cy={yFor(p)}
          r={2.25}
          fill={colorForLevel(p)}
        />
      ))}
    </svg>
  );
}
