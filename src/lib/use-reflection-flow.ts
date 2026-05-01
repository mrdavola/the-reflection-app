"use client";

/**
 * Reflection flow state machine
 *
 * Drives the six-screen student reflection experience:
 *   setup → prompt → recording → analyzing → recharge → insights
 *
 * Owns the microphone stream, audio level, speech-recognition transcript,
 * silence detection, prompt list, and the calls into /api/ai/prompts and
 * /api/ai/analyze. The recharge interlude only plays once per session, after
 * the FINAL prompt's analyzing finishes.
 *
 * Two modes:
 *   - "personal"   : full AI follow-ups + insights, saves via storage.
 *   - "share-link" : curated prompts only (no AI follow-ups), parent owns save.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAudioLevel } from "@/lib/use-audio-level";
import type { ReflectionAnalysis } from "@/lib/types";
import { deriveInsight, type ReflectionInsight } from "@/lib/insights";

export type { ReflectionInsight } from "@/lib/insights";
export { deriveInsight } from "@/lib/insights";

export type ReflectionStep =
  | "setup"
  | "prompt"
  | "recording"
  | "analyzing"
  | "recharge"
  | "insights";

export type ReflectionMode = "personal" | "share-link";

interface MinimalSRAlternative {
  transcript: string;
}
interface MinimalSRResult {
  isFinal: boolean;
  length: number;
  readonly [index: number]: MinimalSRAlternative;
}
interface MinimalSREvent extends Event {
  resultIndex: number;
  results: { length: number; readonly [index: number]: MinimalSRResult };
}
interface MinimalSRErrorEvent extends Event {
  error: string;
}
interface MinimalSRInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((e: Event) => void) | null;
  onend: ((e: Event) => void) | null;
  onerror: ((e: MinimalSRErrorEvent) => void) | null;
  onresult: ((e: MinimalSREvent) => void) | null;
}
type MinimalSRConstructor = new () => MinimalSRInstance;

function getRecognitionCtor(): MinimalSRConstructor | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return (w.SpeechRecognition || w.webkitSpeechRecognition) ?? null;
}

const MINIMUM_RECORDING_SECONDS = 5;
const SILENCE_AUTO_STOP_MS = 5000;
const SILENCE_TICK_MS = 250;
const ANALYZE_MIN_HOLD_MS = 3000;
const RECHARGE_MS = 5000;
const MAX_AI_FOLLOWUPS = 2; // 1 seed + up to 2 follow-ups = 3 total prompts.

export interface UseReflectionFlowOptions {
  mode: ReflectionMode;
  /** Initial seed prompts. For personal mode usually a single objective-derived prompt;
   *  for share-link mode the curated activity prompts. */
  seedPrompts: string[];
  /** Required for AI follow-ups + final analysis. Personal mode passes the user's objective. */
  objective?: string;
  /** Required for AI calls. */
  focus?: string;
  gradeBand?: string;
  language?: string;
  /** Personal mode: cap on AI-generated follow-ups. Default 2. */
  maxFollowUps?: number;
  /** Called once the flow lands on the final insights screen. Parent persists the reflection here. */
  onComplete?: (payload: {
    prompts: string[];
    transcripts: string[];
    insight: ReflectionInsight | null;
    rawAnalysis: ReflectionAnalysis | null;
  }) => void | Promise<void>;
}

export interface UseReflectionFlowResult {
  step: ReflectionStep;
  prompts: string[];
  promptIndex: number;
  currentPrompt: string;
  totalEstimate: number;
  transcripts: string[];
  currentTranscript: string;
  audioLevel: number;
  elapsedSeconds: number;
  silenceCountdown: number | null;
  insight: ReflectionInsight | null;
  rawAnalysis: ReflectionAnalysis | null;
  /** Status label for analyzing screen. */
  analyzingLabel: "FORMING NEXT QUESTION" | "FINDING CLARITY";
  /** True when there's no Web Speech support; UI should fall back to typed entry. */
  speechSupported: boolean;
  /** Active recording stream (for components that want their own audio analysis). */
  stream: MediaStream | null;
  /** Mic permission error or speech-recognition error to surface in UI. */
  error: string | null;
  /** Move from setup → prompt. */
  beginPrompt: () => void;
  /** Move from prompt → recording (after TTS finishes or user taps mic). */
  startRecording: () => Promise<void>;
  /** User-initiated stop — only valid after MINIMUM_RECORDING_SECONDS. */
  stopRecording: () => void;
  /** Reset the entire flow. */
  reset: () => void;
}

export function useReflectionFlow(opts: UseReflectionFlowOptions): UseReflectionFlowResult {
  const {
    mode,
    seedPrompts,
    objective,
    focus,
    gradeBand,
    language,
    maxFollowUps = MAX_AI_FOLLOWUPS,
    onComplete,
  } = opts;

  const [step, setStep] = useState<ReflectionStep>("setup");
  const [prompts, setPrompts] = useState<string[]>(seedPrompts);
  const [promptIndex, setPromptIndex] = useState(0);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const [insight, setInsight] = useState<ReflectionInsight | null>(null);
  const [rawAnalysis, setRawAnalysis] = useState<ReflectionAnalysis | null>(null);
  const [analyzingLabel, setAnalyzingLabel] = useState<
    "FORMING NEXT QUESTION" | "FINDING CLARITY"
  >("FINDING CLARITY");
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  const audioLevel = useAudioLevel(stream);

  // refs for closures inside RAF / timer loops
  const recognitionRef = useRef<MinimalSRInstance | null>(null);
  const wantListeningRef = useRef(false);
  const isRecordingRef = useRef(false);
  const startedAtRef = useRef(0);
  const lastSpokeAtRef = useRef(0);
  const finalTranscriptRef = useRef("");
  const interimRef = useRef("");
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Aborts in-flight /api/ai/prompts and /api/ai/analyze fetches if the user
  // resets the flow or unmounts mid-analyze. Without this, late-resolving
  // fetches could double-spawn follow-ups or set state on a torn-down hook.
  const controllerRef = useRef<AbortController | null>(null);
  // Holds the recharge → insights setTimeout so we can clear it on unmount /
  // reset / mic-stop and avoid setStep firing on a torn-down hook.
  const rechargeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest `finalizeTranscriptAndAdvance` — kept in a ref so the silence
  // interval (started at recording-time) always calls the current closure.
  const finalizeRef = useRef<((finalText: string) => Promise<void>) | null>(null);

  // Latest seedPrompts reference, in case caller passes a stable shape but new array.
  useEffect(() => {
    setPrompts((prev) => (prev.length === 0 ? seedPrompts : prev));
  }, [seedPrompts]);

  // Probe Web Speech support on mount.
  useEffect(() => {
    setSpeechSupported(!!getRecognitionCtor());
  }, []);

  // ----- Recognition lifecycle helpers -----

  const handleResult = useCallback((event: MinimalSREvent) => {
    let interim = "";
    let finalChunk = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript ?? "";
      if (result.isFinal) finalChunk += text;
      else interim += text;
    }
    if (finalChunk) {
      finalTranscriptRef.current =
        (finalTranscriptRef.current ? finalTranscriptRef.current + " " : "") +
        finalChunk.trim();
    }
    interimRef.current = interim;
    const combined = (
      finalTranscriptRef.current +
      (interim ? (finalTranscriptRef.current ? " " : "") + interim : "")
    ).trim();
    setCurrentTranscript(combined);
    if (combined.length > 0) {
      lastSpokeAtRef.current = Date.now();
    }
  }, []);

  const buildRecognition = useCallback((): MinimalSRInstance | null => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = handleResult;
    rec.onerror = (e: MinimalSRErrorEvent) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      setError(e.error || "speech_error");
    };
    rec.onstart = () => setError(null);
    rec.onend = () => {
      // Browsers periodically end the session — restart if we still want to listen.
      if (wantListeningRef.current && isRecordingRef.current) {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          try {
            rec.start();
          } catch {
            // Already started or transitional state — ignore.
          }
        }, 50);
      }
    };
    return rec;
  }, [handleResult]);

  // ----- Cleanup helpers -----

  const stopMicAndRecognition = useCallback(() => {
    wantListeningRef.current = false;
    isRecordingRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.onresult = null;
        rec.onend = null;
        rec.onerror = null;
        rec.onstart = null;
        rec.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (rechargeTimeoutRef.current) {
      clearTimeout(rechargeTimeoutRef.current);
      rechargeTimeoutRef.current = null;
    }
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    setSilenceCountdown(null);
  }, []);

  // Always tear down on unmount.
  useEffect(() => {
    return () => {
      stopMicAndRecognition();
    };
  }, [stopMicAndRecognition]);

  // ----- Core actions -----

  const beginPrompt = useCallback(() => {
    setStep("prompt");
  }, []);

  const finalizeTranscriptAndAdvance = useCallback(
    async (finalText: string) => {
      const text = finalText.trim();
      const nextTranscripts = [...transcripts, text];
      setTranscripts(nextTranscripts);
      setCurrentTranscript("");
      finalTranscriptRef.current = "";
      interimRef.current = "";

      const isFinalPrompt = promptIndex >= prompts.length - 1;
      const canFollowUp =
        mode === "personal" &&
        prompts.length - 1 < maxFollowUps &&
        text.length > 0 &&
        !!objective &&
        !!focus;

      if (!isFinalPrompt) {
        // We have a curated/queued prompt waiting — go straight to it.
        setPromptIndex((i) => i + 1);
        setStep("prompt");
        return;
      }

      if (canFollowUp) {
        setAnalyzingLabel("FORMING NEXT QUESTION");
        setStep("analyzing");
        const startedAt = Date.now();
        controllerRef.current?.abort();
        const followUpController = new AbortController();
        controllerRef.current = followUpController;
        try {
          const res = await fetch("/api/ai/prompts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              objective,
              focus,
              gradeBand: gradeBand ?? "adult",
              language: language ?? "English",
              count: 1,
              prior: prompts.map((p, i) => ({
                promptText: p,
                text: nextTranscripts[i] ?? "",
              })),
            }),
            signal: followUpController.signal,
          });
          if (followUpController.signal.aborted) return;
          const data = (await res.json()) as { prompts?: string[] };
          if (followUpController.signal.aborted) return;
          const followUp = data.prompts?.[0];
          await holdAtLeast(startedAt, ANALYZE_MIN_HOLD_MS);
          if (followUpController.signal.aborted) return;
          if (followUp) {
            setPrompts((prev) => [...prev, followUp]);
            setPromptIndex((i) => i + 1);
            setStep("prompt");
            return;
          }
        } catch (err) {
          if (isAbortError(err)) return; // silent — caller initiated
          console.error("[reflection-flow] follow-up failed:", err);
          await holdAtLeast(startedAt, ANALYZE_MIN_HOLD_MS);
          // fall through to final analysis
        }
      }

      // Final analysis path.
      setAnalyzingLabel("FINDING CLARITY");
      setStep("analyzing");
      const analyzeStarted = Date.now();
      let derivedAnalysis: ReflectionAnalysis | null = null;
      controllerRef.current?.abort();
      const analyzeController = new AbortController();
      controllerRef.current = analyzeController;
      try {
        if (objective && focus) {
          const res = await fetch("/api/ai/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              objective,
              focus,
              gradeBand: gradeBand ?? "adult",
              language: language ?? "English",
              responses: prompts.map((p, i) => ({
                promptText: p,
                text: nextTranscripts[i] ?? "",
              })),
            }),
            signal: analyzeController.signal,
          });
          if (analyzeController.signal.aborted) return;
          const data = (await res.json()) as { analysis?: ReflectionAnalysis };
          if (analyzeController.signal.aborted) return;
          if (data.analysis) derivedAnalysis = data.analysis;
        }
      } catch (err) {
        if (isAbortError(err)) return; // silent — caller initiated
        console.error("[reflection-flow] analyze failed:", err);
      }
      await holdAtLeast(analyzeStarted, ANALYZE_MIN_HOLD_MS);
      if (analyzeController.signal.aborted) return;

      const derivedInsight = deriveInsight(derivedAnalysis, nextTranscripts);
      setRawAnalysis(derivedAnalysis);
      setInsight(derivedInsight);

      // Recharge plays once between final analysis and insights.
      setStep("recharge");
      rechargeTimeoutRef.current = setTimeout(() => {
        rechargeTimeoutRef.current = null;
        setStep("insights");
        if (onComplete) {
          void Promise.resolve(
            onComplete({
              prompts,
              transcripts: nextTranscripts,
              insight: derivedInsight,
              rawAnalysis: derivedAnalysis,
            }),
          );
        }
      }, RECHARGE_MS);
    },
    [
      transcripts,
      promptIndex,
      prompts,
      mode,
      maxFollowUps,
      objective,
      focus,
      gradeBand,
      language,
      onComplete,
    ],
  );

  // Keep the ref in sync with the freshest closure.
  useEffect(() => {
    finalizeRef.current = finalizeTranscriptAndAdvance;
  }, [finalizeTranscriptAndAdvance]);

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;
    if (elapsedSeconds < MINIMUM_RECORDING_SECONDS) return; // guard
    const finalText = (finalTranscriptRef.current + " " + interimRef.current).trim();
    stopMicAndRecognition();
    setElapsedSeconds(0);
    void finalizeRef.current?.(finalText);
  }, [elapsedSeconds, stopMicAndRecognition]);

  // Auto-stop when silent + above the minimum.
  const tickSilence = useCallback(() => {
    if (!isRecordingRef.current) return;
    const now = Date.now();
    const silentMs =
      lastSpokeAtRef.current === 0 ? 0 : now - lastSpokeAtRef.current;
    const elapsed = (now - startedAtRef.current) / 1000;
    const haveText = finalTranscriptRef.current.trim().length > 0;

    if (haveText && elapsed >= MINIMUM_RECORDING_SECONDS && silentMs > 1500) {
      // Show countdown only inside the final 3s window before auto-stop.
      const remaining = Math.ceil((SILENCE_AUTO_STOP_MS - silentMs) / 1000);
      if (silentMs >= 2000 && silentMs < SILENCE_AUTO_STOP_MS) {
        setSilenceCountdown(Math.max(1, remaining));
      } else {
        setSilenceCountdown(null);
      }
    } else {
      setSilenceCountdown(null);
    }

    if (
      haveText &&
      elapsed >= MINIMUM_RECORDING_SECONDS &&
      silentMs >= SILENCE_AUTO_STOP_MS
    ) {
      const finalText = (finalTranscriptRef.current + " " + interimRef.current).trim();
      stopMicAndRecognition();
      setElapsedSeconds(0);
      void finalizeRef.current?.(finalText);
    }
  }, [stopMicAndRecognition]);

  const startRecording = useCallback(async () => {
    setError(null);
    setCurrentTranscript("");
    finalTranscriptRef.current = "";
    interimRef.current = "";
    lastSpokeAtRef.current = 0;
    setSilenceCountdown(null);
    setElapsedSeconds(0);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("microphone_unsupported");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      console.error("[reflection-flow] mic permission denied:", err);
      setError("microphone_denied");
      return;
    }

    isRecordingRef.current = true;
    startedAtRef.current = Date.now();

    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds((Date.now() - startedAtRef.current) / 1000);
    }, 200);

    silenceTimerRef.current = setInterval(tickSilence, SILENCE_TICK_MS);

    // Speech recognition is best-effort — recording works even if it's missing.
    const rec = buildRecognition();
    if (rec) {
      recognitionRef.current = rec;
      wantListeningRef.current = true;
      try {
        rec.start();
      } catch {
        // already started on a fast remount — onend will reconcile
      }
    }

    setStep("recording");
  }, [buildRecognition, tickSilence]);

  const reset = useCallback(() => {
    stopMicAndRecognition();
    if (rechargeTimeoutRef.current) {
      clearTimeout(rechargeTimeoutRef.current);
      rechargeTimeoutRef.current = null;
    }
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    setStep("setup");
    setPrompts(seedPrompts);
    setPromptIndex(0);
    setTranscripts([]);
    setCurrentTranscript("");
    finalTranscriptRef.current = "";
    interimRef.current = "";
    setInsight(null);
    setRawAnalysis(null);
    setElapsedSeconds(0);
    setSilenceCountdown(null);
    setError(null);
  }, [seedPrompts, stopMicAndRecognition]);

  const currentPrompt = prompts[promptIndex] ?? "";
  const totalEstimate = useMemo(() => {
    if (mode === "share-link") return seedPrompts.length;
    return Math.max(prompts.length, 1 + Math.min(maxFollowUps, 2));
  }, [mode, seedPrompts.length, prompts.length, maxFollowUps]);

  return {
    step,
    prompts,
    promptIndex,
    currentPrompt,
    totalEstimate,
    transcripts,
    currentTranscript,
    audioLevel,
    elapsedSeconds,
    silenceCountdown,
    insight,
    rawAnalysis,
    analyzingLabel,
    speechSupported,
    stream,
    error,
    beginPrompt,
    startRecording,
    stopRecording,
    reset,
  };
}

// ----- helpers -----

async function holdAtLeast(startedAtMs: number, minMs: number) {
  const elapsed = Date.now() - startedAtMs;
  if (elapsed < minMs) {
    await new Promise<void>((resolve) => setTimeout(resolve, minMs - elapsed));
  }
}

function isAbortError(err: unknown): boolean {
  return (
    err instanceof DOMException && err.name === "AbortError"
  ) || (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name?: unknown }).name === "AbortError"
  );
}

