"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AudioRecorder } from "@/components/audio-recorder";
import { FocusSelector } from "@/components/focus-selector";
import { GeneratingFeedback } from "@/components/loading-states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generatePrompts } from "@/lib/api-client";
import { getFocus } from "@/lib/focus-catalog";
import { personalFlow, usePersonalFlow } from "@/lib/personal-flow-store";
import type { FocusId } from "@/lib/types";

export default function PersonalEntryPage() {
  const router = useRouter();
  const flow = usePersonalFlow();

  const [objective, setObjective] = useState("");
  const [focus, setFocus] = useState<FocusId | null>(null);
  const [stage, setStage] = useState<"objective" | "focus" | "generating">(
    "objective",
  );
  const [error, setError] = useState<string | null>(null);

  // Pre-fill if returning mid-flow.
  useEffect(() => {
    if (flow.objective && !objective) setObjective(flow.objective);
    if (flow.focus && !focus) setFocus(flow.focus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusMeta = useMemo(() => (focus ? getFocus(focus) : null), [focus]);

  async function handleGenerate() {
    if (!objective.trim() || !focus) return;
    setError(null);
    setStage("generating");
    try {
      const { prompts } = await generatePrompts({
        objective,
        focus,
        count: 3,
      });
      if (!prompts || prompts.length === 0) {
        throw new Error("no prompts");
      }
      personalFlow.set({
        objective,
        focus,
        prompts,
        responses: [],
        analysis: null,
        takeaway: "",
      });
      router.push("/app/personal/run");
    } catch (e) {
      console.error(e);
      setError("We couldn't generate prompts just now. Try again in a moment.");
      setStage("focus");
      toast.error("Couldn't generate prompts. Try again.");
    }
  }

  if (stage === "generating") {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <GeneratingFeedback label="Crafting your prompts…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      <header className="space-y-3 text-center sm:text-left">
        <Badge variant="primary" className="inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Personal reflection
        </Badge>
        <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          Tell me about something you&rsquo;re working on.
        </h1>
        <p className="max-w-xl text-foreground/75">
          A class you&rsquo;re teaching, a project you&rsquo;re shipping, a habit
          you&rsquo;re building. Speak it out loud or type a few sentences — I&rsquo;ll
          ask three good questions.
        </p>
      </header>

      <section className="space-y-3">
        <SectionLabel step={1} title="What are you working on?" />
        <AudioRecorder
          allowText
          minimumSpeakingSeconds={10}
          submitLabel="Looks good"
          initialText={objective}
          onComplete={(result) => {
            const next = result.text.trim();
            if (!next) return;
            setObjective(next);
            setStage("focus");
            // smooth scroll to focus
            requestAnimationFrame(() => {
              document
                .getElementById("focus-section")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          }}
        />
        {objective && stage !== "objective" && (
          <p className="rounded-2xl bg-muted/40 p-3 text-sm text-foreground/80">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Your objective
            </span>
            <span className="mt-1 block">{objective}</span>
          </p>
        )}
      </section>

      <AnimatePresence>
        {stage !== "objective" && (
          <motion.section
            id="focus-section"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-3"
          >
            <SectionLabel step={2} title="Pick a focus for this reflection" />
            <p className="text-sm text-muted-foreground">
              The focus shapes what kind of questions you&rsquo;ll see — pick what
              fits how you want to think today.
            </p>
            <FocusSelector value={focus ?? undefined} onChange={setFocus} />
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {focusMeta && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/70 bg-card/95 p-4 shadow-lg backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl leading-none">{focusMeta.emoji}</span>
              <div>
                <div className="text-sm font-semibold">{focusMeta.label}</div>
                <div className="text-xs text-muted-foreground">
                  {focusMeta.blurb}
                </div>
              </div>
            </div>
            <Button size="lg" onClick={handleGenerate}>
              Generate prompts
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function SectionLabel({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {step}
      </span>
      <h2 className="font-display text-2xl tracking-tight">{title}</h2>
    </div>
  );
}
