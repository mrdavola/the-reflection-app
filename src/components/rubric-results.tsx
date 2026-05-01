"use client";

import { cn } from "@/lib/utils";
import type { ReflectionAnalysis, Rubric } from "@/lib/types";

interface Props {
  rubric: Rubric;
  results: NonNullable<ReflectionAnalysis["rubricResults"]>;
}

const LEVEL_LABELS = ["Beginning", "Developing", "Proficient", "Strong"] as const;

export function RubricResults({ rubric, results }: Props) {
  // Map results by criterionId so we render in the rubric's order and gracefully
  // handle missing entries (e.g. if a model dropped one).
  const byId = new Map(results.map((r) => [r.criterionId, r]));

  return (
    <div className="space-y-3">
      {rubric.criteria.map((criterion) => {
        const result = byId.get(criterion.id);
        const level = result?.level;
        return (
          <div
            key={criterion.id}
            className="rounded-2xl border border-border/70 bg-card/60 p-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <div className="text-sm font-medium text-foreground">
                {criterion.label}
              </div>
              {typeof level === "number" && (
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {LEVEL_LABELS[level - 1]} · {level}/4
                </div>
              )}
            </div>
            {criterion.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {criterion.description}
              </p>
            )}
            <div className="mt-2 grid grid-cols-4 gap-1" aria-hidden>
              {[1, 2, 3, 4].map((seg) => (
                <div
                  key={seg}
                  className={cn(
                    "h-1.5 rounded-full",
                    typeof level === "number" && seg <= level
                      ? "bg-primary"
                      : "bg-muted",
                  )}
                />
              ))}
            </div>
            {result?.evidence ? (
              <p className="mt-2 text-xs italic text-foreground/80">
                &ldquo;{result.evidence}&rdquo;
              </p>
            ) : (
              <p className="mt-2 text-xs italic text-muted-foreground">
                No evidence captured for this criterion.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
