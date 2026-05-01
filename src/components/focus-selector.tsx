"use client";

import { Check } from "lucide-react";
import { FOCUS_OPTIONS } from "@/lib/focus-catalog";
import type { FocusId } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  value?: FocusId;
  onChange: (id: FocusId) => void;
  /** Optional restricted subset (e.g. for younger grade bands). */
  options?: FocusId[];
}

export function FocusSelector({ value, onChange, options }: Props) {
  const list = options
    ? FOCUS_OPTIONS.filter((f) => options.includes(f.id))
    : FOCUS_OPTIONS;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((focus) => {
        const selected = value === focus.id;
        return (
          <button
            key={focus.id}
            type="button"
            onClick={() => onChange(focus.id)}
            className={cn(
              "group relative rounded-2xl border bg-card p-4 text-left transition-all",
              "hover:-translate-y-0.5 hover:shadow-md",
              selected
                ? "border-primary/60 bg-accent/60 shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.55)]"
                : "border-border/70 hover:border-primary/30",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xl leading-none">{focus.emoji}</span>
              {selected && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>
            <div className="mt-3 text-sm font-semibold tracking-tight text-foreground">
              {focus.label}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{focus.blurb}</div>
            <div className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground/70">
              {focus.bestFor}
            </div>
          </button>
        );
      })}
    </div>
  );
}
