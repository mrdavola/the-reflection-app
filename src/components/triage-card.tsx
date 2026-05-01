"use client";

import Link from "next/link";
import { ArrowUpRight, Clock, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Reflection } from "@/lib/types";

interface Props {
  reflection: Reflection;
  href: string;
  showScore?: boolean;
}

export function TriageCard({ reflection, href, showScore = true }: Props) {
  const a = reflection.analysis;
  const color = a?.scoreColor ?? "blue";
  const hasAlert = (a?.contentAlerts.length ?? 0) > 0;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full flex-col gap-4 rounded-3xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg",
        color === "sunny" && "border-triage-sunny/30 bg-triage-sunny-bg",
        color === "orange" && "border-triage-orange/30 bg-triage-orange-bg",
        color === "blue" && "border-triage-blue/30 bg-triage-blue-bg",
        color === "rose" && "border-triage-rose/40 bg-triage-rose-bg",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-foreground/60">
            {a?.understandingLabel ?? "Awaiting analysis"}
          </div>
          <div className="mt-1 text-base font-semibold tracking-tight text-foreground">
            {reflection.participantName}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {a && showScore && (
            <span
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-background",
                color === "sunny" && "bg-triage-sunny",
                color === "orange" && "bg-triage-orange",
                color === "blue" && "bg-triage-blue",
                color === "rose" && "bg-triage-rose",
              )}
              aria-label={`Reflection level ${a.reflectionLevel} of 4`}
            >
              {a.reflectionLevel}
            </span>
          )}
          {hasAlert && (
            <Badge variant="rose" className="!ring-triage-rose/50">
              <ShieldAlert className="h-3 w-3" />
              Review
            </Badge>
          )}
        </div>
      </div>

      <p className="line-clamp-3 text-sm text-foreground/85">
        {a?.summary ??
          reflection.responses[0]?.text?.slice(0, 160) ??
          "Reflection submitted — awaiting analysis."}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        {a?.mindset && <Badge variant="outline">{a.mindset}</Badge>}
        {a?.tone && <Badge variant="outline">{a.tone}</Badge>}
        {a?.keyCognitiveSkills.slice(0, 2).map((skill) => (
          <Badge key={skill} variant="muted">
            {skill}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px] text-foreground/60">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(reflection.createdAt)}
        </span>
        <span className="inline-flex items-center gap-1 font-medium text-foreground/80 transition-colors group-hover:text-foreground">
          Open
          <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
