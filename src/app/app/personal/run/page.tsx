"use client";

/**
 * Personal reflection run page
 *
 * Reads prompts from the personal-flow store, walks the user through one prompt
 * at a time, then runs analysis. Once analysis lands we render the <Recharge>
 * component inline (rather than as its own route) and route the user to the
 * reflection detail page when they finish or skip the recharge moment.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AudioRecorder, type AudioRecorderResult } from "@/components/audio-recorder";
import { PromptBubble } from "@/components/prompt-bubble";
import { GeneratingFeedback } from "@/components/loading-states";
import { Recharge } from "@/components/recharge";
import { SentenceStarters } from "@/components/sentence-starters";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { analyzeReflection } from "@/lib/api-client";
import { getFocus } from "@/lib/focus-catalog";
import { personalFlow, usePersonalFlow } from "@/lib/personal-flow-store";
import { store, useStore } from "@/lib/storage";
import type { PromptResponse, Reflection } from "@/lib/types";

type Stage = "answering" | "analyzing" | "recharge" | "redirecting";

export default function PersonalRunPage() {
  const router = useRouter();
  const flow = usePersonalFlow();
  const user = useStore((s) => s.user);

  // Make sure a user exists for ownerUserId. ensureUser is safe on the client.
  useEffect(() => {
    if (!user) store.ensureUser();
  }, [user]);

  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("answering");
  const [savedReflectionId, setSavedReflectionId] = useState<string | null>(null);

  // Guard: if flow is empty, send the user back to /app/personal.
  useEffect(() => {
    if (flow.prompts.length === 0 || !flow.objective || !flow.focus) {
      router.replace("/app/personal");
    }
  }, [flow.prompts.length, flow.objective, flow.focus, router]);

  const total = flow.prompts.length;
  const current = flow.prompts[index];
  const focusMeta = useMemo(
    () => (flow.focus ? getFocus(flow.focus) : null),
    [flow.focus],
  );

  const progressValue = total > 0 ? Math.round((index / total) * 100) : 0;

  async function handlePromptComplete(result: AudioRecorderResult) {
    const promptText = current;
    if (!promptText) return;
    const response: PromptResponse = {
      promptId: `p-${index}`,
      promptText,
      inputType: result.inputType,
      text: result.text,
      audioBlobUrl: result.audioBlobUrl,
      durationSeconds: result.durationSeconds,
      createdAt: new Date().toISOString(),
    };
    personalFlow.appendResponse(response);

    if (index < total - 1) {
      setIndex((i) => i + 1);
      return;
    }

    // Last prompt → analyze.
    await runAnalysis([...flow.responses, response]);
  }

  async function runAnalysis(responses: PromptResponse[]) {
    if (!flow.objective || !flow.focus) return;
    setStage("analyzing");
    try {
      const { analysis } = await analyzeReflection({
        objective: flow.objective,
        focus: flow.focus,
        responses: responses.map((r) => ({
          promptText: r.promptText,
          text: r.text,
        })),
      });

      const owner = store.ensureUser();
      const newRef: Omit<Reflection, "id" | "createdAt"> = {
        activityId: null,
        groupId: null,
        participantId: null,
        participantName: owner.name,
        ownerUserId: owner.id,
        objective: flow.objective,
        focus: flow.focus,
        responses,
        analysis,
        completedAt: new Date().toISOString(),
        feedbackVisibility: "show",
        scoreVisibility: "show",
      };
      const saved = store.createReflection(newRef);
      personalFlow.set({ analysis });
      setSavedReflectionId(saved.id);
      setStage("recharge");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't analyze your reflection. Try again.");
      setStage("answering");
    }
  }

  function handleRechargeComplete(data: { takeaway?: string }) {
    if (!savedReflectionId) {
      router.push("/app");
      return;
    }
    if (data.takeaway) {
      // Persist the takeaway as a synthetic response so it shows up on the detail page.
      const reflection = store.getReflection(savedReflectionId);
      if (reflection) {
        const takeawayResponse: PromptResponse = {
          promptId: "takeaway",
          promptText: "One takeaway from this reflection",
          inputType: "text",
          text: data.takeaway,
          createdAt: new Date().toISOString(),
        };
        store.updateReflection(savedReflectionId, {
          responses: [...reflection.responses, takeawayResponse],
        });
      }
    }
    setStage("redirecting");
    personalFlow.reset();
    router.push(`/app/reflections/${savedReflectionId}`);
  }

  if (stage === "analyzing") {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <GeneratingFeedback label="Reading your reflection with care…" />
      </div>
    );
  }

  if (stage === "recharge") {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <Recharge onComplete={handleRechargeComplete} />
      </div>
    );
  }

  if (stage === "redirecting") {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <GeneratingFeedback label="Saving your reflection…" />
      </div>
    );
  }

  if (total === 0 || !current) {
    // Briefly empty before the redirect effect runs.
    return null;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-2">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild size="sm" variant="ghost">
          <button
            type="button"
            onClick={() => {
              if (index === 0) {
                router.push("/app/personal");
              } else {
                setIndex((i) => Math.max(0, i - 1));
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            {index === 0 ? "Back" : "Previous"}
          </button>
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {focusMeta && (
            <Badge variant="muted" className="gap-1">
              <span>{focusMeta.emoji}</span>
              {focusMeta.label}
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Question {index + 1} of {total}
          </Badge>
        </div>
      </header>

      <div>
        <Progress value={progressValue} />
        <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
          {progressValue}% through
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${index}-${current}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6"
        >
          <PromptBubble prompt={current} index={index} total={total} />
          {/*
           * Personal flow is for educator self-reflection, so we hardcode
           * gradeBand="adult" rather than reading from any user record.
           * AudioRecorder owns its own textarea state, so we copy the
           * starter to the clipboard for the user to paste in.
           */}
          <SentenceStarters
            gradeBand="adult"
            focus={flow.focus ?? undefined}
            onPick={(s) => {
              if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                navigator.clipboard
                  .writeText(s)
                  .then(() => toast.success("Copied — paste into your reflection"))
                  .catch(() => toast.error("Couldn't copy. Long-press or right-click to copy."));
              } else {
                toast("Copy not supported in this browser.");
              }
            }}
          />
          <AudioRecorder
            allowText
            minimumSpeakingSeconds={15}
            submitLabel={index === total - 1 ? "Finish reflection" : "Next"}
            onComplete={handlePromptComplete}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
