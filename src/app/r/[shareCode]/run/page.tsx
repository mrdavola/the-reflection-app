"use client";

export const dynamic = "force-dynamic";

import { Suspense, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AudioRecorder, type AudioRecorderResult } from "@/components/audio-recorder";
import { PromptBubble } from "@/components/prompt-bubble";
import { GeneratingFeedback } from "@/components/loading-states";
import { SentenceStarters } from "@/components/sentence-starters";
import { ModelingMode } from "@/components/modeling-mode";
import { useStore, store } from "@/lib/storage";
import { analyzeReflection, generatePrompts } from "@/lib/api-client";
import { t, type Lang } from "@/lib/i18n/strings";
import type { PromptResponse } from "@/lib/types";

function isSpanishLang(language?: string): boolean {
  if (!language) return false;
  return language === "Spanish" || language.toLowerCase().startsWith("es");
}

type Stage = "running" | "analyzing";

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

  const [prompts, setPrompts] = useState<string[]>([]);
  const [responses, setResponses] = useState<PromptResponse[]>([]);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("running");
  const [adapting, setAdapting] = useState(false);
  const [modelingDismissed, setModelingDismissed] = useState(false);
  const initialised = useRef(false);

  const lang: Lang = isSpanishLang(activity?.language) ? "es" : "en";

  // initialise prompts from the activity (snapshot once on mount)
  useEffect(() => {
    if (initialised.current) return;
    if (!activity) return;
    initialised.current = true;
    setPrompts(activity.prompts.map((p) => p.text));
  }, [activity]);

  // missing-data redirect: name required for non-anonymous, activity must exist
  useEffect(() => {
    if (!activity || !group) {
      router.replace(`/r/${shareCode}`);
      return;
    }
    if (group.accessType !== "anonymous" && !name) {
      router.replace(`/r/${shareCode}`);
    }
  }, [activity, group, name, router, shareCode]);

  const totalEstimate = useMemo(
    () => Math.max(prompts.length, activity?.prompts.length ?? 0),
    [prompts.length, activity?.prompts.length],
  );

  const finishReflection = useCallback(
    async (allResponses: PromptResponse[]) => {
      if (!activity || !group) return;
      setStage("analyzing");
      try {
        const { analysis } = await analyzeReflection({
          objective: activity.objective,
          focus: activity.focus,
          gradeBand: group.gradeBand,
          language: activity.language,
          responses: allResponses.map((r) => ({
            promptText: r.promptText,
            text: r.text,
          })),
          rubric: activity.rubric,
        });

        const participant = name
          ? store.ensureParticipant(group.id, name, false)
          : store.ensureParticipant(group.id, "Anonymous", true);

        const reflection = store.createReflection({
          activityId: activity.id,
          groupId: group.id,
          participantId: participant.id,
          participantName: name || "Anonymous",
          ownerUserId: group.ownerId,
          objective: activity.objective,
          focus: activity.focus,
          responses: allResponses,
          analysis,
          feedbackVisibility: activity.feedbackVisibility,
          scoreVisibility: activity.scoreVisibility,
          completedAt: new Date().toISOString(),
        });

        router.replace(`/r/${shareCode}/done?reflectionId=${reflection.id}`);
      } catch (err) {
        console.error(err);
        toast.error("We couldn't generate your feedback. Please try again.");
        setStage("running");
      }
    },
    [activity, group, name, router, shareCode],
  );

  const handleResponse = useCallback(
    async (result: AudioRecorderResult) => {
      if (!activity || !group) return;
      const promptText = prompts[index] ?? "";
      const promptId =
        activity.prompts[index]?.id ?? `dynamic-${index}`;
      const newResponse: PromptResponse = {
        promptId,
        promptText,
        inputType: result.inputType,
        text: result.text,
        audioBlobUrl: result.audioBlobUrl,
        durationSeconds: Math.round(result.durationSeconds),
        createdAt: new Date().toISOString(),
      };
      const nextResponses = [...responses, newResponse];
      setResponses(nextResponses);

      // Adaptive: after first response, generate the rest of the prompts.
      if (
        activity.promptMode === "first-teacher-then-ai" &&
        index === 0 &&
        prompts.length > 1
      ) {
        setAdapting(true);
        try {
          const remainingCount = Math.max(activity.prompts.length - 1, 1);
          const { prompts: aiPrompts } = await generatePrompts({
            objective: activity.objective,
            focus: activity.focus,
            gradeBand: group.gradeBand,
            language: activity.language,
            count: remainingCount,
            prior: nextResponses.map((r) => ({
              promptText: r.promptText,
              text: r.text,
            })),
          });
          const stitched = [
            prompts[0],
            ...aiPrompts.slice(0, remainingCount),
          ];
          setPrompts(stitched);
        } catch (err) {
          console.error(err);
          toast("We'll keep your teacher's prompts since the AI couldn't adapt right now.");
        } finally {
          setAdapting(false);
        }
      }

      // last prompt? analyze + persist; else advance
      if (index >= prompts.length - 1) {
        await finishReflection(nextResponses);
      } else {
        setIndex(index + 1);
      }
    },
    [activity, group, index, prompts, responses, finishReflection],
  );

  if (!activity || !group) {
    return null;
  }

  if (stage === "analyzing") {
    const reading = lang === "es"
      ? `Leyendo la reflexión de ${name || "este alumno"}…`
      : `Reading ${name ? `${name}'s` : "your"} reflection…`;
    return (
      <div className="pt-8">
        <GeneratingFeedback label={reading} />
      </div>
    );
  }

  // Modeling mode: show the weak/strong example before the first prompt.
  if (
    activity.modelingEnabled === true &&
    !modelingDismissed &&
    index === 0 &&
    responses.length === 0
  ) {
    return (
      <div className="pt-4">
        <ModelingMode
          objective={activity.objective}
          focus={activity.focus}
          onSkip={() => setModelingDismissed(true)}
        />
      </div>
    );
  }

  const currentPrompt = prompts[index] ?? "";

  const questionLabel =
    lang === "es"
      ? `Pregunta ${index + 1} de ${totalEstimate}`
      : `Question ${index + 1} of ${totalEstimate}`;
  const reflectingAs =
    lang === "es" ? `Reflexionando como ${name}` : `Reflecting as ${name}`;
  const adaptingMsg =
    lang === "es"
      ? "Adaptando las próximas preguntas a lo que acabas de decir…"
      : "Tailoring the next prompts to what you just said…";
  const finishLabel = lang === "es" ? "Terminar" : "Finish";
  const copySuccess =
    lang === "es"
      ? "Copiado — pégalo en tu reflexión"
      : "Copied — paste into your reflection";
  const copyFail =
    lang === "es"
      ? "No se pudo copiar. Mantén presionado o haz clic derecho para copiar."
      : "Couldn't copy. Long-press or right-click to copy.";
  const copyUnsupported =
    lang === "es"
      ? "Copiar no está disponible en este navegador."
      : "Copy not supported in this browser.";

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium uppercase tracking-wider text-muted-foreground">
          {questionLabel}
        </span>
        {name && (
          <span className="text-muted-foreground">{reflectingAs}</span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <PromptBubble
          key={`${index}-${currentPrompt}`}
          prompt={currentPrompt}
          index={index}
          total={totalEstimate}
        />
      </AnimatePresence>

      {adapting ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
          {adaptingMsg}
        </div>
      ) : (
        <>
          <SentenceStarters
            gradeBand={group.gradeBand}
            focus={activity.focus}
            lang={lang}
            onPick={(s) => {
              if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                navigator.clipboard
                  .writeText(s)
                  .then(() => toast.success(copySuccess))
                  .catch(() => toast.error(copyFail));
              } else {
                toast(copyUnsupported);
              }
            }}
          />
          <AudioRecorder
            key={`recorder-${index}`}
            minimumSpeakingSeconds={activity.minimumSpeakingSeconds || 15}
            allowText={activity.recordingMode !== "audio-only"}
            submitLabel={
              index >= prompts.length - 1 ? finishLabel : t(lang, "next")
            }
            onComplete={handleResponse}
          />
        </>
      )}
    </div>
  );
}
