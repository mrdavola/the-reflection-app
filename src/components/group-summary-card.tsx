"use client";

import { Sparkles, Users, ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GroupSummary } from "@/lib/types";

interface Props {
  groupName: string;
  reflectionCount: number;
  summary: Pick<
    GroupSummary,
    | "understandingParagraph"
    | "teacherMovesParagraph"
    | "recommendedTeacherMoves"
    | "commonStrengths"
    | "commonStruggles"
    | "studentsNeedingFollowUp"
    | "studentsReadyForExtension"
  >;
  loading?: boolean;
  onRegenerate?: () => void;
}

export function GroupSummaryCard({
  groupName,
  reflectionCount,
  summary,
  loading,
  onRegenerate,
}: Props) {
  return (
    <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/[0.06] via-card to-secondary/[0.06]">
      <div className="absolute right-[-30px] top-[-30px] h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute left-[-40px] bottom-[-40px] h-44 w-44 rounded-full bg-secondary/15 blur-3xl" />
      <CardContent className="relative grid gap-6 p-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">
              <Sparkles className="h-3 w-3" />
              Class summary
            </Badge>
            <Badge variant="muted">
              <Users className="h-3 w-3" />
              {reflectionCount} reflection{reflectionCount === 1 ? "" : "s"}
            </Badge>
            <span className="text-xs text-muted-foreground">{groupName}</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded shimmer" />
              <div className="h-4 w-full rounded shimmer" />
              <div className="h-4 w-2/3 rounded shimmer" />
            </div>
          ) : (
            <p className="font-display text-lg leading-relaxed text-foreground/90 sm:text-xl">
              {summary.understandingParagraph}
            </p>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Teacher moves for tomorrow
            </h3>
            {loading ? (
              <div className="h-12 w-full rounded shimmer" />
            ) : (
              <p className="text-sm leading-relaxed text-foreground/85">
                {summary.teacherMovesParagraph}
              </p>
            )}
          </div>

          {summary.recommendedTeacherMoves.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Suggested moves
              </h3>
              <ul className="space-y-1.5">
                {summary.recommendedTeacherMoves.map((m, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-lg bg-card/70 px-3 py-2 text-sm ring-1 ring-border/60"
                  >
                    <ListChecks className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {summary.commonStrengths.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Common strengths
              </h3>
              <ul className="space-y-1 text-sm">
                {summary.commonStrengths.map((s) => (
                  <li key={s} className="text-foreground/85">• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {summary.commonStruggles.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Common struggles
              </h3>
              <ul className="space-y-1 text-sm">
                {summary.commonStruggles.map((s) => (
                  <li key={s} className="text-foreground/85">• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {summary.studentsNeedingFollowUp.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pull for check-in
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {summary.studentsNeedingFollowUp.map((n) => (
                  <Badge key={n} variant="orange">{n}</Badge>
                ))}
              </div>
            </div>
          )}
          {summary.studentsReadyForExtension.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ready for extension
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {summary.studentsReadyForExtension.map((n) => (
                  <Badge key={n} variant="sunny">{n}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {onRegenerate && (
        <div className="relative flex items-center justify-end gap-2 border-t border-border/50 px-6 py-3">
          <button
            type="button"
            onClick={onRegenerate}
            className="text-xs font-medium text-primary hover:underline"
          >
            Regenerate summary
          </button>
        </div>
      )}
    </Card>
  );
}
