"use client";

import Link from "next/link";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Reflection, ScoreColor } from "@/lib/types";

export interface TriageRowData {
  reflection: Reflection;
  color: ScoreColor;
  level: number;
  quote: string;
  teacherMove: string;
  hasSafetyAlert: boolean;
}

interface Props {
  data: TriageRowData;
  density: "cards" | "compact";
  seen: boolean;
  onMarkSeen: (id: string) => void;
}

const dotClass: Record<ScoreColor, string> = {
  sunny: "bg-triage-sunny",
  orange: "bg-triage-orange",
  blue: "bg-triage-blue",
  rose: "bg-triage-rose",
};

const chipClass: Record<ScoreColor, string> = {
  sunny: "bg-triage-sunny-bg text-triage-sunny ring-triage-sunny/20",
  orange: "bg-triage-orange-bg text-triage-orange ring-triage-orange/20",
  blue: "bg-triage-blue-bg text-triage-blue ring-triage-blue/20",
  rose: "bg-triage-rose-bg text-triage-rose ring-triage-rose/30",
};

export function TriageRow({ data, density, seen, onMarkSeen }: Props) {
  const { reflection, color, level, quote, teacherMove, hasSafetyAlert } = data;
  const compact = density === "compact";
  const href = `/app/reflections/${reflection.id}`;

  return (
    <li
      className={cn(
        "group relative flex items-stretch gap-3 border-b border-border/40 transition-colors",
        "hover:bg-card/60 focus-within:bg-card/60",
        hasSafetyAlert && "bg-triage-rose-bg/30 border-l-2 border-l-triage-rose pl-2",
        seen && "opacity-60",
        compact ? "py-1.5" : "py-3",
      )}
    >
      {/* Status dot */}
      <span
        aria-hidden
        className={cn(
          "mt-2 h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-foreground/10",
          dotClass[color],
        )}
      />

      {/* Name */}
      <span
        className={cn(
          "shrink-0 truncate font-mono tabular-nums font-medium text-foreground",
          compact ? "w-28 text-[12px]" : "w-32 text-[13px] mt-0.5",
        )}
        title={reflection.participantName}
      >
        {reflection.participantName}
      </span>

      {/* Level chip */}
      <span
        className={cn(
          "shrink-0 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
          chipClass[color],
          compact ? "h-5" : "h-5 mt-0.5",
        )}
        aria-label={`Reflection level ${level} of 4`}
      >
        L{level}
      </span>

      {/* Quote + (optionally) teacher move */}
      <div className={cn("min-w-0 flex-1", compact ? "" : "pr-2")}>
        <p
          className={cn(
            "font-display italic text-foreground/75 leading-snug truncate",
            compact ? "text-[13px]" : "text-[14px]",
          )}
          title={quote}
        >
          {quote ? `“${quote}”` : "—"}
        </p>
        {!compact && teacherMove && (
          <p
            className="mt-1 truncate text-[12.5px] leading-snug text-foreground/55"
            title={teacherMove}
          >
            {teacherMove}
          </p>
        )}
      </div>

      {/* Hover affordances */}
      <div
        className={cn(
          "relative z-10 shrink-0 flex items-center gap-1 self-center pr-1",
          "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkSeen(reflection.id);
          }}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.16em] transition-colors",
            "text-muted-foreground hover:bg-muted hover:text-foreground",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label={seen ? `Mark ${reflection.participantName} as unseen` : `Mark ${reflection.participantName} as seen`}
        >
          {seen ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {seen ? "Unsee" : "Seen"}
        </button>
        <Link
          href={href}
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] uppercase tracking-[0.16em] transition-colors",
            "text-foreground/80 hover:bg-primary/15 hover:text-primary",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          Open
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Whole-row clickable layer (sits below action buttons via z-index). */}
      <Link
        href={href}
        aria-label={`Open ${reflection.participantName}'s reflection`}
        tabIndex={-1}
        className="absolute inset-0 z-0"
      />
    </li>
  );
}
