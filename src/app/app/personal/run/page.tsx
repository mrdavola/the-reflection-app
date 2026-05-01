"use client";

/**
 * Personal reflection run page — the moment.
 *
 * Hosts the six-step state machine from useReflectionFlow and renders the
 * appropriate surface for each step. The recording stage is full-bleed; the
 * setup/prompt/insights screens get a centered serif column. AnimatePresence
 * fades between them.
 *
 * Save: when the flow completes, we map the analysis through deriveInsight
 * already, but we also persist the *full* reflection (with the original
 * AnalysisSchema) to the storage layer so /app/reflections/[id] can show all
 * the existing detail. Personal-flow store hands us objective + focus.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, Loader2, Mic, RotateCw, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ReflectionStage,
  RechargeScreen,
  InsightsLayout,
} from "@/components/reflection";
import { useReflectionFlow, type ReflectionInsight } from "@/lib/use-reflection-flow";
import { useTTS } from "@/lib/use-tts";
import { personalFlow, usePersonalFlow } from "@/lib/personal-flow-store";
import { store, useStore } from "@/lib/storage";
import { getFocus } from "@/lib/focus-catalog";
import type {
  PromptResponse,
  Reflection,
  ReflectionAnalysis,
} from "@/lib/types";

const TTS_PREF_KEY = "refleckt:personal:tts-enabled";

export default function PersonalRunPage() {
  const router = useRouter();
  const flow = usePersonalFlow();
  const user = useStore((s) => s.user);

  const [savedReflectionId, setSavedReflectionId] = useState<string | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  useEffect(() => {
    if (!user) store.ensureUser();
  }, [user]);

  // Read the user's voice TTS preference (defaults OFF).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setTtsEnabled(window.localStorage.getItem(TTS_PREF_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  // Guard: bounce back to setup if the store is empty.
  useEffect(() => {
    if (!flow.objective || !flow.focus || flow.prompts.length === 0) {
      router.replace("/app/personal");
    }
  }, [flow.objective, flow.focus, flow.prompts.length, router]);

  const seedPrompts = useMemo(() => flow.prompts.slice(0, 1), [flow.prompts]);

  const handleComplete = useCallback(
    async (payload: {
      prompts: string[];
      transcripts: string[];
      insight: ReflectionInsight | null;
      rawAnalysis: ReflectionAnalysis | null;
    }) => {
      if (!flow.objective || !flow.focus) return;
      const owner = store.ensureUser();
      const responses: PromptResponse[] = payload.prompts.map((p, i) => ({
        promptId: `p-${i}`,
        promptText: p,
        inputType: "audio",
        text: payload.transcripts[i] ?? "",
        durationSeconds: 0,
        createdAt: new Date().toISOString(),
      }));

      const newRef: Omit<Reflection, "id" | "createdAt"> = {
        activityId: null,
        groupId: null,
        participantId: null,
        participantName: owner.name,
        ownerUserId: owner.id,
        objective: flow.objective,
        focus: flow.focus,
        responses,
        analysis: payload.rawAnalysis ?? undefined,
        completedAt: new Date().toISOString(),
        feedbackVisibility: "show",
        scoreVisibility: "show",
      };
      const saved = store.createReflection(newRef);
      setSavedReflectionId(saved.id);
      personalFlow.set({ analysis: payload.rawAnalysis });
    },
    [flow.objective, flow.focus],
  );

  const reflection = useReflectionFlow({
    mode: "personal",
    seedPrompts,
    objective: flow.objective || undefined,
    focus: flow.focus ?? undefined,
    gradeBand: "adult",
    language: "English",
    maxFollowUps: 2,
    onComplete: handleComplete,
  });

  const { speak: speakTts, isLoading: ttsLoading, isPlaying: ttsPlaying, stop: stopTts } =
    useTTS({ voice: "Aoede", muted: !ttsEnabled });

  const focusMeta = useMemo(() => (flow.focus ? getFocus(flow.focus) : null), [flow.focus]);

  // Auto-start the flow once we land on this page.
  useEffect(() => {
    if (reflection.step === "setup" && flow.prompts.length > 0) {
      reflection.beginPrompt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When TTS is enabled, speak the prompt as we enter the prompt step, then
  // auto-start recording when audio finishes.
  useEffect(() => {
    if (!ttsEnabled) return;
    if (reflection.step !== "prompt") return;
    if (!reflection.currentPrompt) return;
    void speakTts(reflection.currentPrompt, {
      onEnded: () => {
        void reflection.startRecording();
      },
    });
    return () => stopTts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reflection.step, reflection.currentPrompt, ttsEnabled]);

  const insightsActions = useMemo(
    () => [
      {
        label: "Read transcript",
        icon: <BookOpen className="h-3 w-3" />,
        href: savedReflectionId ? `/app/reflections/${savedReflectionId}` : undefined,
      },
      {
        label: "Reflect again",
        icon: <RotateCw className="h-3 w-3" />,
        onClick: () => {
          personalFlow.reset();
          reflection.reset();
          router.push("/app/personal");
        },
      },
    ],
    [savedReflectionId, reflection, router],
  );

  // Render -----

  // Recording stage is full-bleed; everything else gets a centered column.
  if (reflection.step === "recording") {
    return (
      <ReflectionStage
        prompt={reflection.currentPrompt}
        audioLevel={reflection.audioLevel}
        transcript={reflection.currentTranscript}
        elapsedSeconds={reflection.elapsedSeconds}
        silenceCountdown={reflection.silenceCountdown}
        questionLabel={`Question ${pad2(reflection.promptIndex + 1)} of ${pad2(reflection.totalEstimate)}`}
        error={reflection.error}
        onStop={() => reflection.stopRecording()}
      />
    );
  }

  if (reflection.step === "recharge") {
    return <RechargeScreen />;
  }

  if (reflection.step === "insights" && reflection.insight) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <AnimatePresence mode="wait">
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <InsightsLayout
              insight={reflection.insight}
              eyebrow={focusMeta?.label}
              actions={insightsActions}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // setup / prompt / analyzing — share a centered column.
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12 md:py-20">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              stopTts();
              reflection.reset();
              router.push("/app/personal");
            }}
            className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>
          {focusMeta && (
            <span className="text-[0.7rem] uppercase tracking-[0.3em] text-foreground/40">
              {focusMeta.label}
            </span>
          )}
        </header>

        <AnimatePresence mode="wait">
          {reflection.step === "prompt" && (
            <motion.section
              key="prompt"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center gap-10 pt-8 md:pt-16"
            >
              <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
                Question {pad2(reflection.promptIndex + 1)} of {pad2(reflection.totalEstimate)}
              </p>
              <h1 className="font-display text-[2.25rem] md:text-[2.625rem] leading-[1.15] tracking-[-0.018em] max-w-[60ch]">
                {reflection.currentPrompt}
              </h1>

              {ttsEnabled && (ttsLoading || ttsPlaying) && (
                <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem] text-primary/80 inline-flex items-center gap-2">
                  {ttsLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Warming up voice…
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3 w-3" />
                      Speaking
                    </>
                  )}
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  stopTts();
                  void reflection.startRecording();
                }}
                aria-label="Start recording"
                className="group relative grid h-16 w-16 place-items-center rounded-full border border-primary/40 bg-background transition-all hover:border-primary/70 hover:shadow-[0_0_28px_-4px_oklch(0.78_0.105_230/0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Mic className="h-6 w-6 text-primary group-hover:scale-105 transition-transform" />
              </button>

              <p className="text-[0.75rem] text-foreground/50">
                {ttsEnabled
                  ? "Recording will start automatically when the prompt finishes — or tap the mic to begin now."
                  : "Tap when you're ready. Speak as long as you need."}
              </p>

              {reflection.error && (
                <p role="alert" className="text-[0.75rem] text-destructive/80">
                  {reflection.error === "microphone_denied"
                    ? "We couldn't access the microphone. Check your browser permissions."
                    : "Something interrupted the mic. Please try again."}
                </p>
              )}
            </motion.section>
          )}

          {reflection.step === "analyzing" && (
            <motion.section
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center text-center gap-6 pt-24"
            >
              <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem] text-primary/80">
                {reflection.analyzingLabel}
              </p>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="grid h-16 w-16 place-items-center rounded-full border border-primary/30"
              >
                <Sparkles className="h-5 w-5 text-primary/80" />
              </motion.div>
              <p className="text-[0.875rem] text-foreground/60 max-w-sm">
                {reflection.analyzingLabel === "FORMING NEXT QUESTION"
                  ? "Listening carefully to what you just shared, and finding the right next question."
                  : "Reading what you said with care, looking for what's true and what's next."}
              </p>
            </motion.section>
          )}

          {reflection.step === "setup" && (
            <motion.section
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-6 pt-24"
            >
              <p className="text-foreground/60">Preparing your reflection…</p>
              <Button
                variant="ghost"
                onClick={() => reflection.beginPrompt()}
              >
                Begin
              </Button>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}
