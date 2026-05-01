"use client";

export const dynamic = "force-dynamic";

/**
 * Share-link reflection stage.
 *
 * Same useReflectionFlow + ReflectionStage as the personal route, but:
 *   - mode="share-link" → no AI follow-ups, prompts come straight from the
 *     activity's curated list.
 *   - On completion, persist via storage.createReflection just like the old
 *     run page did, then navigate to /r/[shareCode]/done?reflectionId=...
 *   - TTS is never auto-enabled for share-link mode (cost + classroom safety).
 */

import {
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Mic, Sparkles } from "lucide-react";
import {
  ReflectionStage,
  RechargeScreen,
  InsightsLayout,
} from "@/components/reflection";
import {
  useReflectionFlow,
  type ReflectionInsight,
} from "@/lib/use-reflection-flow";
import { store, useStore } from "@/lib/storage";
import { getFocus } from "@/lib/focus-catalog";
import type {
  PromptResponse,
  Reflection,
  ReflectionAnalysis,
} from "@/lib/types";

interface Props {
  params: Promise<{ shareCode: string }>;
}

export default function ShareRunPage(props: Props) {
  return (
    <Suspense fallback={null}>
      <ShareRunPageInner {...props} />
    </Suspense>
  );
}

function ShareRunPageInner({ params }: Props) {
  const { shareCode } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = (searchParams.get("name") ?? "").trim();

  const activity = useStore((s) =>
    s.activities.find((a) => a.shareCode === shareCode),
  );
  const group = useStore((s) =>
    activity ? s.groups.find((g) => g.id === activity.groupId) : undefined,
  );

  const [savedReflectionId, setSavedReflectionId] = useState<string | null>(null);

  // Guards: missing activity, or non-anonymous group with no name → bounce.
  useEffect(() => {
    if (!activity || !group) {
      // Wait one tick — store may still be hydrating from localStorage.
      const id = setTimeout(() => {
        const fresh = store.getActivityByShareCode(shareCode);
        if (!fresh) router.replace(`/r/${shareCode}`);
      }, 200);
      return () => clearTimeout(id);
    }
    if (group.accessType !== "anonymous" && !name) {
      router.replace(`/r/${shareCode}`);
    }
  }, [activity, group, name, router, shareCode]);

  const seedPrompts = useMemo(() => {
    return activity?.prompts.map((p) => p.text) ?? [];
  }, [activity?.prompts]);

  const focusMeta = useMemo(
    () => (activity ? getFocus(activity.focus) : null),
    [activity],
  );

  const handleComplete = useCallback(
    async (payload: {
      prompts: string[];
      transcripts: string[];
      insight: ReflectionInsight | null;
      rawAnalysis: ReflectionAnalysis | null;
    }) => {
      if (!activity || !group) return;
      const responses: PromptResponse[] = payload.prompts.map((p, i) => {
        const promptId = activity.prompts[i]?.id ?? `dynamic-${i}`;
        return {
          promptId,
          promptText: p,
          inputType: "audio",
          text: payload.transcripts[i] ?? "",
          durationSeconds: 0,
          createdAt: new Date().toISOString(),
        };
      });

      const participant = name
        ? store.ensureParticipant(group.id, name, false)
        : store.ensureParticipant(group.id, "Anonymous", true);

      const newRef: Omit<Reflection, "id" | "createdAt"> = {
        activityId: activity.id,
        groupId: group.id,
        participantId: participant.id,
        participantName: name || "Anonymous",
        ownerUserId: group.ownerId,
        objective: activity.objective,
        focus: activity.focus,
        responses,
        analysis: payload.rawAnalysis ?? undefined,
        feedbackVisibility: activity.feedbackVisibility,
        scoreVisibility: activity.scoreVisibility,
        completedAt: new Date().toISOString(),
      };
      const saved = store.createReflection(newRef);
      setSavedReflectionId(saved.id);
    },
    [activity, group, name],
  );

  const reflection = useReflectionFlow({
    mode: "share-link",
    seedPrompts,
    objective: activity?.objective,
    focus: activity?.focus,
    gradeBand: group?.gradeBand ?? "9-12",
    language: activity?.language ?? "English",
    maxFollowUps: 0, // share-link mode = curated only
    onComplete: handleComplete,
  });

  // Auto-advance setup → prompt once seedPrompts are populated.
  useEffect(() => {
    if (
      reflection.step === "setup" &&
      seedPrompts.length > 0 &&
      activity &&
      group
    ) {
      reflection.beginPrompt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedPrompts.length, activity, group]);

  // Once we land on insights, navigate to /done after a beat. We render the
  // insights screen briefly so the student feels acknowledged, then the
  // calmer thank-you takes over on /done.
  useEffect(() => {
    if (reflection.step === "insights" && savedReflectionId) {
      const id = setTimeout(() => {
        router.replace(`/r/${shareCode}/done?reflectionId=${savedReflectionId}`);
      }, 4500);
      return () => clearTimeout(id);
    }
  }, [reflection.step, savedReflectionId, router, shareCode]);

  if (!activity || !group) {
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md items-center justify-center px-6 text-center">
        <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
          Loading reflection…
        </p>
      </div>
    );
  }

  // ---- Recording stage (full-bleed) ----
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
      <div className="min-h-[100dvh] bg-background pt-16">
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
            />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ---- Setup / Prompt / Analyzing — centered column ----
  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col gap-10 px-6 py-24">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              reflection.reset();
              router.push(`/r/${shareCode}`);
            }}
            className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>
          {focusMeta && (
            <span className="text-[0.7rem] uppercase tracking-[0.3em] text-foreground/40">
              {group.name} · {focusMeta.label}
            </span>
          )}
        </header>

        <AnimatePresence mode="wait">
          {reflection.step === "prompt" && (
            <motion.section
              key={`prompt-${reflection.promptIndex}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center gap-10 pt-8 md:pt-16"
            >
              <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
                Question {pad2(reflection.promptIndex + 1)} of{" "}
                {pad2(reflection.totalEstimate)}
              </p>
              <h1 className="font-display text-[2.25rem] md:text-[2.625rem] leading-[1.15] tracking-[-0.018em] max-w-[60ch]">
                {reflection.currentPrompt}
              </h1>

              <button
                type="button"
                onClick={() => void reflection.startRecording()}
                aria-label="Start recording"
                className="group relative grid h-16 w-16 place-items-center rounded-full border border-primary/40 bg-background transition-all hover:border-primary/70 hover:shadow-[0_0_28px_-4px_oklch(0.78_0.105_230/0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Mic className="h-6 w-6 text-primary group-hover:scale-105 transition-transform" />
              </button>

              <p className="text-[0.75rem] text-foreground/50">
                Tap when you&rsquo;re ready. Speak as long as you need.
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
                Reading what you said with care.
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
