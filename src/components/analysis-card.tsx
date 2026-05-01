"use client";

import { motion } from "framer-motion";
import {
  Brain,
  ClipboardList,
  Compass,
  Heart,
  Lightbulb,
  ListChecks,
  Quote,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RubricResults } from "@/components/rubric-results";
import { cn } from "@/lib/utils";
import type { ReflectionAnalysis, Rubric } from "@/lib/types";

interface Props {
  analysis: ReflectionAnalysis;
  showScore?: boolean;
  showTeacherFollowUp?: boolean;
  rubric?: Rubric;
}

export function AnalysisCard({
  analysis,
  showScore = true,
  showTeacherFollowUp = false,
  rubric,
}: Props) {
  const colorVariant = analysis.scoreColor;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden">
        <div
          className={cn(
            "px-6 py-5 border-b border-border/60",
            colorVariant === "sunny" && "bg-triage-sunny-bg",
            colorVariant === "orange" && "bg-triage-orange-bg",
            colorVariant === "blue" && "bg-triage-blue-bg",
            colorVariant === "rose" && "bg-triage-rose-bg",
          )}
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-foreground/70">
                Reflection insight
              </div>
              <h2 className="font-display text-2xl leading-tight tracking-tight text-foreground">
                {analysis.summary}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={colorVariant}>{analysis.understandingLabel}</Badge>
              <Badge variant="outline">Level {analysis.reflectionLevel} of 4</Badge>
              {showScore && (
                <Badge variant="muted">{analysis.understandingScore}% clarity</Badge>
              )}
            </div>
          </div>
          {showScore && (
            <div className="mt-4">
              <Progress value={analysis.understandingScore} />
              <div className="mt-1 text-[11px] text-foreground/60">
                Clarity is an estimate — not a grade.
              </div>
            </div>
          )}
        </div>

        <CardContent className="grid gap-6 pt-6 lg:grid-cols-2">
          <Section icon={<Sparkles className="h-4 w-4 text-primary" />} title="Feedback">
            <p className="text-sm leading-relaxed text-foreground/90">
              {analysis.feedback}
            </p>
          </Section>

          <Section icon={<Lightbulb className="h-4 w-4 text-primary" />} title="Suggested next step">
            <p className="text-sm leading-relaxed text-foreground/90">
              {analysis.suggestedNextStep}
            </p>
          </Section>

          <Section icon={<ListChecks className="h-4 w-4 text-primary" />} title="Strengths noticed">
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90 marker:text-primary">
              {analysis.strengthsNoticed.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Section>

          {rubric && rubric.enabled && analysis.rubricResults && analysis.rubricResults.length > 0 && (
            <div className="lg:col-span-2">
              <Section
                icon={<ClipboardList className="h-4 w-4 text-primary" />}
                title="Rubric"
              >
                <RubricResults rubric={rubric} results={analysis.rubricResults} />
              </Section>
            </div>
          )}

          <Section icon={<Brain className="h-4 w-4 text-primary" />} title="Cognitive skills">
            <div className="flex flex-wrap gap-1.5">
              {analysis.keyCognitiveSkills.map((s) => (
                <Badge key={s} variant="primary">
                  {s}
                </Badge>
              ))}
            </div>
          </Section>

          {analysis.crossCurricularConnections.length > 0 && (
            <Section
              icon={<Sparkles className="h-4 w-4 text-primary" />}
              title="Cross-curricular connections"
            >
              <div className="flex flex-wrap gap-1.5">
                {analysis.crossCurricularConnections.map((c) => (
                  <Badge key={c} variant="primary">
                    {c}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          <Section icon={<Heart className="h-4 w-4 text-primary" />} title="Mindset & tone">
            <div className="grid gap-2 text-sm">
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Mindset</span>
                <div className="text-foreground">
                  {analysis.mindset} — {analysis.mindsetSummary}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Tone</span>
                <div className="text-foreground">
                  {analysis.tone} — {analysis.toneSummary}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Motivation</span>
                <div className="capitalize text-foreground">{analysis.motivationSignal}</div>
              </div>
            </div>
          </Section>

          <Section icon={<Compass className="h-4 w-4 text-primary" />} title="Zone of proximal development">
            <p className="text-sm capitalize text-foreground/90">
              {analysis.zone} zone
            </p>
            <p className="text-xs text-muted-foreground">
              {zoneBlurb(analysis.zone)}
            </p>
          </Section>

          <Section icon={<Quote className="h-4 w-4 text-primary" />} title="Hidden lesson">
            <p className="text-sm italic text-foreground/85">{analysis.hiddenLesson}</p>
          </Section>

          {analysis.studentQuotes.length > 0 && (
            <Section
              icon={<Quote className="h-4 w-4 text-primary" />}
              title="In their own words"
            >
              <div className="space-y-2">
                {analysis.studentQuotes.map((q, i) => (
                  <blockquote
                    key={i}
                    className="rounded-r-md border-l-2 border-l-primary bg-accent/40 px-3 py-2 font-display text-sm italic leading-relaxed text-foreground/85"
                  >
                    &ldquo;{q}&rdquo;
                  </blockquote>
                ))}
              </div>
            </Section>
          )}

          <Section icon={<TrendingUp className="h-4 w-4 text-primary" />} title="Possible bias">
            <p className="text-sm text-foreground/90">
              <span className="font-medium">{analysis.possibleCognitiveBias.label}.</span>{" "}
              {analysis.possibleCognitiveBias.explanation}
            </p>
          </Section>
        </CardContent>

        {(analysis.contentAlerts.length > 0 || showTeacherFollowUp) && (
          <>
            <Separator />
            <CardContent className="grid gap-4 pt-5 lg:grid-cols-2">
              {showTeacherFollowUp && (
                <Section icon={<Sparkles className="h-4 w-4 text-secondary" />} title="Suggested teacher follow-up">
                  <p className="text-sm text-foreground/90">{analysis.teacherFollowUp}</p>
                </Section>
              )}
              {analysis.contentAlerts.length > 0 && (
                <Section
                  icon={<ShieldAlert className="h-4 w-4 text-triage-rose" />}
                  title="Content review needed"
                >
                  <ul className="space-y-1.5 text-sm">
                    {analysis.contentAlerts.map((a, i) => (
                      <li key={i} className="rounded-lg bg-triage-rose-bg/60 p-2 text-foreground/90 ring-1 ring-triage-rose/20">
                        <div className="text-xs font-medium uppercase tracking-wider text-triage-rose">
                          {a.type} · {a.severity}
                        </div>
                        <div className="text-xs text-foreground/80">"{a.excerpt}"</div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    The Reflection App flags language that may need adult review. Your professional judgment, not the AI's, decides next steps.
                  </p>
                </Section>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </motion.div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <CardHeader className="flex-row items-center gap-2 p-0 pb-2">
        {icon}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      </CardHeader>
      <div>{children}</div>
    </div>
  );
}

function zoneBlurb(zone: ReflectionAnalysis["zone"]) {
  switch (zone) {
    case "below":
      return "Could use more support — try modeling or scaffolds before next reflection.";
    case "ideal":
      return "Right in the sweet spot for guided challenge.";
    case "above":
      return "Ready for an extension or to teach a peer.";
    case "high":
      return "Operating well above expected level — push with a tougher prompt.";
    default:
      return "Needs more detail to place — a quick check-in would help.";
  }
}
