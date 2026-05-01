"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { PrintStyles } from "@/components/print-styles";
import { useStore } from "@/lib/storage";
import { formatDate } from "@/lib/utils";

export default function ParticipantPortfolioPage() {
  const params = useParams<{ id: string; participantId: string }>();
  const search = useSearchParams();
  const groupId = params.id;
  const participantId = params.participantId;
  const shouldAutoPrint = search.get("print") === "1";

  const group = useStore((s) => s.groups.find((g) => g.id === groupId));
  const participant = useStore((s) =>
    s.participants.find((p) => p.id === participantId),
  );
  const reflections = useStore((s) =>
    s.reflections
      .filter(
        (r) =>
          r.groupId === groupId &&
          (r.participantId === participantId ||
            (!r.participantId &&
              r.participantName &&
              participant &&
              r.participantName.toLowerCase() === participant.name.toLowerCase())),
      )
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  );
  const activities = useStore((s) =>
    s.activities.filter((a) => a.groupId === groupId),
  );

  const dateRange = useMemo(() => {
    if (reflections.length === 0) return null;
    const sorted = reflections
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    return {
      first: sorted[0].createdAt,
      last: sorted[sorted.length - 1].createdAt,
    };
  }, [reflections]);

  useEffect(() => {
    if (!shouldAutoPrint) return;
    if (!group || !participant) return;
    // Wait briefly so the store hydrates and the layout settles before printing.
    const t = window.setTimeout(() => {
      window.print();
    }, 600);
    return () => window.clearTimeout(t);
  }, [shouldAutoPrint, group, participant]);

  if (!group || !participant) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <CardTitle>Portfolio not available</CardTitle>
            <CardDescription>
              This portfolio link doesn&apos;t resolve on this device. The
              group or participant may have been removed.
            </CardDescription>
            <Button asChild className="mt-2">
              <Link href="/app">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-6">
      <PrintStyles />

      <div
        data-no-print
        className="mb-6 flex flex-wrap items-center justify-between gap-2"
      >
        <Button asChild variant="ghost" size="sm">
          <Link
            href={`/app/groups/${groupId}/participants/${participantId}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to participant
          </Link>
        </Button>
        <Button
          onClick={() => {
            if (typeof window !== "undefined") window.print();
          }}
        >
          <Printer className="h-4 w-4" />
          Print / save as PDF
        </Button>
      </div>

      <article className="print-surface space-y-12">
        <section className="print-title-page space-y-4 border-b pb-10">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Reflection Portfolio
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-tight">
            {participant.name}
          </h1>
          <p className="text-lg text-foreground/80">{group.name}</p>
          {dateRange && (
            <p className="text-sm text-muted-foreground">
              {formatDate(dateRange.first)} – {formatDate(dateRange.last)} ·{" "}
              {reflections.length} reflection
              {reflections.length === 1 ? "" : "s"}
            </p>
          )}
          {reflections.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No reflections recorded yet.
            </p>
          )}
        </section>

        {reflections.map((r) => {
          const activity = activities.find((a) => a.id === r.activityId);
          const a = r.analysis;
          return (
            <section
              key={r.id}
              className="print-reflection space-y-5"
              aria-label={`Reflection from ${formatDate(r.createdAt)}`}
            >
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {formatDate(r.createdAt)}
                </p>
                <h2 className="font-display text-2xl leading-tight tracking-tight">
                  {activity?.title || r.objective || "Reflection"}
                </h2>
                {(activity?.objective || r.objective) && (
                  <p className="text-sm text-foreground/80">
                    <span className="font-medium">Objective:</span>{" "}
                    {activity?.objective || r.objective}
                  </p>
                )}
              </div>

              {r.responses.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display text-lg tracking-tight">
                    Prompts &amp; responses
                  </h3>
                  <ol className="space-y-3">
                    {r.responses.map((resp, i) => (
                      <li key={`${resp.promptId}-${i}`} className="space-y-1">
                        <p className="text-sm font-semibold leading-snug">
                          Q{i + 1}. {resp.promptText}
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                          {resp.text || (
                            <span className="italic text-muted-foreground">
                              No transcript saved.
                            </span>
                          )}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {a && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-lg tracking-tight">
                      Summary
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {a.summary}
                    </p>
                  </div>

                  {a.strengthsNoticed.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold">Strengths noticed</h4>
                      <ul className="ml-5 list-disc text-sm leading-relaxed text-foreground/90">
                        {a.strengthsNoticed.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {a.suggestedNextStep && (
                    <div>
                      <h4 className="text-sm font-semibold">
                        Suggested next step
                      </h4>
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {a.suggestedNextStep}
                      </p>
                    </div>
                  )}

                  {a.hiddenLesson && (
                    <div>
                      <h4 className="text-sm font-semibold">Hidden lesson</h4>
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {a.hiddenLesson}
                      </p>
                    </div>
                  )}

                  {a.keyCognitiveSkills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold">
                        Key cognitive skills
                      </h4>
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {a.keyCognitiveSkills.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </article>
    </div>
  );
}
