"use client";

export const dynamic = "force-dynamic";

import { Suspense, use, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Heart, Lightbulb, NotebookPen, Sparkles, Wind } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AnalysisCard } from "@/components/analysis-card";
import { useStore } from "@/lib/storage";

interface Props {
  params: Promise<{ shareCode: string }>;
}

type RechargeId = "breath" | "takeaway" | "stretch" | "sentence" | "done";

export default function ShareDonePage(props: Props) {
  return (
    <Suspense fallback={null}>
      <ShareDonePageInner {...props} />
    </Suspense>
  );
}

function ShareDonePageInner({ params }: Props) {
  const { shareCode } = use(params);
  const searchParams = useSearchParams();
  const reflectionId = searchParams.get("reflectionId") ?? "";

  const reflection = useStore((s) =>
    s.reflections.find((r) => r.id === reflectionId),
  );

  const [recharge, setRecharge] = useState<RechargeId | null>(null);
  const [savedTakeaway, setSavedTakeaway] = useState("");
  const [savedSentence, setSavedSentence] = useState("");

  if (!reflection) {
    return (
      <Card className="mt-12">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl tracking-tight">All done.</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Your reflection has been saved. You can close this tab — or start another reflection below.
          </p>
          <Button asChild className="mt-2">
            <Link href={`/r/${shareCode}`}>Reflect again</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const visibility = reflection.feedbackVisibility;
  const showScore = reflection.scoreVisibility === "show";
  const analysis = reflection.analysis;

  return (
    <div className="space-y-8 pt-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Badge variant="primary" className="mb-3">
          <Check className="h-3 w-3" />
          Reflection complete
        </Badge>
        <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          Nice work{reflection.participantName && reflection.participantName !== "Anonymous" ? `, ${reflection.participantName.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-3 text-foreground/75">
          {visibility === "hide"
            ? "Your reflection has been sent to your teacher."
            : "Here's what we noticed in what you said."}
        </p>
      </motion.div>

      {visibility === "show" && analysis && (
        <AnalysisCard analysis={analysis} showScore={showScore} />
      )}

      {visibility === "summary" && analysis && (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Summary
              </div>
              <h2 className="mt-1 font-display text-xl leading-snug tracking-tight">
                {analysis.summary}
              </h2>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5" /> Suggested next step
              </div>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                {analysis.suggestedNextStep}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {visibility === "hide" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
              <Heart className="h-5 w-5" />
            </div>
            <h2 className="font-display text-2xl tracking-tight">
              Thank you — your reflection has been sent to your teacher.
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              You spoke up, and that takes courage. Your teacher will read it with care.
            </p>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl tracking-tight">Take a moment to recharge</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <RechargeOption
            id="breath"
            current={recharge}
            setCurrent={setRecharge}
            icon={<Wind className="h-4 w-4" />}
            title="Take a breath"
            blurb="Three slow breaths. In through your nose, out through your mouth."
          />
          <RechargeOption
            id="takeaway"
            current={recharge}
            setCurrent={setRecharge}
            icon={<NotebookPen className="h-4 w-4" />}
            title="Save one takeaway"
            blurb="Pick one thing to remember from today."
          />
          <RechargeOption
            id="stretch"
            current={recharge}
            setCurrent={setRecharge}
            icon={<Sparkles className="h-4 w-4" />}
            title="Stretch"
            blurb="Roll your shoulders. Reach up. Look out a window for 20 seconds."
          />
          <RechargeOption
            id="sentence"
            current={recharge}
            setCurrent={setRecharge}
            icon={<Lightbulb className="h-4 w-4" />}
            title="One sentence"
            blurb="Write a single sentence about how you feel right now."
          />
        </div>

        {recharge === "takeaway" && (
          <Card className="mt-3">
            <CardContent className="space-y-3 pt-5">
              <Textarea
                value={savedTakeaway}
                onChange={(e) => setSavedTakeaway(e.target.value)}
                placeholder="One thing I want to remember from this reflection…"
                className="min-h-[100px]"
              />
              <p className="text-[11px] text-muted-foreground">
                This stays with you on this device. Your teacher won't see it.
              </p>
            </CardContent>
          </Card>
        )}

        {recharge === "sentence" && (
          <Card className="mt-3">
            <CardContent className="space-y-3 pt-5">
              <Textarea
                value={savedSentence}
                onChange={(e) => setSavedSentence(e.target.value)}
                placeholder="Right now, I feel…"
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>
        )}

        {recharge === "breath" && (
          <Card className="mt-3">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <motion.div
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30"
              />
              <p className="text-sm text-muted-foreground">
                Match your breath to the circle. In as it grows, out as it settles.
              </p>
            </CardContent>
          </Card>
        )}

        {recharge === "stretch" && (
          <Card className="mt-3">
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-sm">Shoulders up to your ears, then down. Reach for the ceiling. Twist gently left, then right.</p>
              <p className="text-xs text-muted-foreground">Move how feels good. Take 30 seconds.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          onClick={() => setRecharge("done")}
          className={recharge === "done" ? "text-primary" : undefined}
        >
          <Check className="h-4 w-4" />
          I'm done
        </Button>
        <Button asChild>
          <Link href={`/r/${shareCode}`}>
            Reflect again
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function RechargeOption({
  id,
  current,
  setCurrent,
  icon,
  title,
  blurb,
}: {
  id: RechargeId;
  current: RechargeId | null;
  setCurrent: (id: RechargeId) => void;
  icon: React.ReactNode;
  title: string;
  blurb: string;
}) {
  const active = current === id;
  return (
    <button
      type="button"
      onClick={() => setCurrent(id)}
      className={
        "flex flex-col gap-1 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md " +
        (active
          ? "border-primary/50 bg-primary/5 shadow-md"
          : "border-border/70 bg-card")
      }
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-accent-foreground">
          {icon}
        </span>
        {title}
      </div>
      <p className="text-xs text-muted-foreground">{blurb}</p>
    </button>
  );
}
