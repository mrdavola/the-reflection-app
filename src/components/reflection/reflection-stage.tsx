"use client";

/**
 * The full-bleed recording stage.
 *
 * Composes RippleField + GlowingDot + the live transcript + silence countdown
 * + recording controls. All decoration is pointer-events-none except the Stop
 * button. This component is presentational — the parent owns the
 * useReflectionFlow state machine and passes props down.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Lock, Square } from "lucide-react";
import { GlowingDot, RippleField } from "@/components/ambient";

const MINIMUM_RECORDING_SECONDS = 5;

interface Props {
  prompt: string;
  audioLevel: number;
  /** The user's current best transcript so far (final + interim). */
  transcript: string;
  elapsedSeconds: number;
  /** Number of seconds remaining before auto-stop fires. null = no countdown. */
  silenceCountdown: number | null;
  /** Optional. Show "Question N of M" label above the prompt. */
  questionLabel?: string;
  onStop: () => void;
  /** Optional error string to surface (mic permission, etc). */
  error?: string | null;
}

export function ReflectionStage({
  prompt,
  audioLevel,
  transcript,
  elapsedSeconds,
  silenceCountdown,
  questionLabel,
  onStop,
  error,
}: Props) {
  const minimumReached = elapsedSeconds >= MINIMUM_RECORDING_SECONDS;
  const last60 = useMemo(() => takeLast(transcript, 60), [transcript]);
  const transcriptOpacity = audioLevel > 5 ? 1 : 0.4;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-background overflow-hidden"
    >
      {/* Ambient ripples — react to audio level */}
      <RippleField intensity={Math.max(0.05, audioLevel / 100)} />

      {/* Glowing center dot */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <GlowingDot audioLevel={audioLevel} />
      </div>

      {/* Top: prompt overlay (very faint) */}
      <div className="absolute inset-x-0 top-0 px-6 pt-12 md:pt-16 pointer-events-none">
        <div className="mx-auto max-w-3xl text-center">
          {questionLabel && (
            <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem] mb-4 opacity-60">
              {questionLabel}
            </p>
          )}
          <p
            className="font-display italic text-[1.5rem] md:text-[1.875rem] leading-[1.35] text-foreground"
            style={{ opacity: 0.2 }}
          >
            {prompt}
          </p>
        </div>
      </div>

      {/* Bottom stack: transcript / silence countdown / timer / stop */}
      <div className="absolute inset-x-0 bottom-0 px-6 pb-10 md:pb-14 pointer-events-none">
        <div className="mx-auto max-w-2xl flex flex-col items-center gap-6">
          {/* Live transcript — the user's last words drift back into the dark */}
          <div
            aria-live="polite"
            className="min-h-[2.5rem] w-full text-center transition-opacity duration-300"
            style={{ opacity: transcriptOpacity }}
          >
            {last60 ? (
              <p className="font-display italic text-[1rem] md:text-[1.125rem] leading-[1.5] text-foreground/70">
                {last60.startsWith("…") ? last60 : last60}
              </p>
            ) : (
              <p className="font-display italic text-[1rem] md:text-[1.125rem] leading-[1.5] text-foreground/30">
                Speak when you&rsquo;re ready.
              </p>
            )}
          </div>

          {/* Silence countdown — only visible during the final 3s before auto-stop */}
          <div className="h-5 text-center">
            {silenceCountdown !== null && (
              <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem] text-primary/80">
                Pausing… finishing in {silenceCountdown}
              </p>
            )}
          </div>

          {/* Timer */}
          <p
            className={`font-mono text-sm tabular-nums transition-colors ${
              minimumReached ? "text-primary/80" : "text-foreground/40"
            }`}
          >
            {formatDuration(elapsedSeconds)}
            {!minimumReached && (
              <span className="text-foreground/30">
                {" "}
                / {formatDuration(MINIMUM_RECORDING_SECONDS)} min
              </span>
            )}
          </p>

          {/* Stop button — locked until 5s */}
          <button
            type="button"
            onClick={onStop}
            disabled={!minimumReached}
            aria-label={minimumReached ? "End thought" : "Keep reflecting"}
            className={`pointer-events-auto inline-flex items-center gap-2 rounded-full px-6 h-11 text-[0.7rem] uppercase tracking-[0.3em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              minimumReached
                ? "border border-primary/40 bg-background/40 text-foreground/80 hover:border-primary/70 hover:shadow-[0_0_24px_-4px_oklch(0.78_0.105_230/0.5)]"
                : "border border-border/50 bg-background/30 text-foreground/30 cursor-not-allowed"
            }`}
          >
            {minimumReached ? (
              <>
                <Square className="h-3 w-3 fill-current" />
                End thought
              </>
            ) : (
              <>
                <Lock className="h-3 w-3" />
                Keep reflecting…
              </>
            )}
          </button>

          {error && (
            <p
              role="alert"
              className="text-[0.75rem] text-destructive/80 max-w-sm text-center"
            >
              {errorMessage(error)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function takeLast(text: string, n: number): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.length <= n) return trimmed;
  return "…" + trimmed.slice(trimmed.length - n).trimStart();
}

function errorMessage(code: string): string {
  switch (code) {
    case "microphone_unsupported":
      return "Your browser doesn't support microphone access. Try Chrome or Safari.";
    case "microphone_denied":
      return "We couldn't access the microphone. Check your browser's site permissions.";
    case "no-speech":
      return "";
    default:
      return "Something interrupted the recording. Please try again.";
  }
}
