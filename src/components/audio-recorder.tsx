"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDuration } from "@/lib/utils";

type Status = "idle" | "recording" | "processing" | "ready";

export interface AudioRecorderResult {
  text: string;
  audioBlobUrl?: string;
  durationSeconds: number;
  inputType: "audio" | "text";
}

interface Props {
  /** Minimum speaking seconds before "Next" becomes available. 0 = no minimum. */
  minimumSpeakingSeconds?: number;
  /** Optional max recording duration in seconds. */
  maxSeconds?: number;
  /** Allow students to type instead of (or alongside) recording. */
  allowText?: boolean;
  /** Initial transcript text (e.g. when re-editing). */
  initialText?: string;
  onComplete: (result: AudioRecorderResult) => void;
  /** Submit label text. Defaults to "Next". */
  submitLabel?: string;
}

export function AudioRecorder({
  minimumSpeakingSeconds = 15,
  maxSeconds = 240,
  allowText = true,
  initialText = "",
  onComplete,
  submitLabel = "Next",
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [text, setText] = useState(initialText);
  const [audioUrl, setAudioUrl] = useState<string>();
  const [error, setError] = useState<string>();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);

  const stopTimer = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    startedAtRef.current = Date.now();
    setElapsed(0);
    tickRef.current = window.setInterval(() => {
      setElapsed((Date.now() - startedAtRef.current) / 1000);
    }, 200);
  };

  const cleanup = useCallback(() => {
    stopTimer();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startRecording = async () => {
    setError(undefined);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Microphone access isn't supported in this browser. You can type your reflection instead.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setStatus("processing");
        const transcript = await transcribe(blob);
        if (transcript) setText((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
        setStatus("ready");
      };

      recorder.start();
      setStatus("recording");
      startTimer();
    } catch (err) {
      console.error(err);
      setError("Couldn't access the microphone. Check permissions or type your reflection instead.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    stopTimer();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const reset = () => {
    cleanup();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(undefined);
    setStatus("idle");
    setElapsed(0);
    setText("");
    setError(undefined);
  };

  // Auto-stop at maxSeconds while recording.
  useEffect(() => {
    if (status === "recording" && elapsed >= maxSeconds) stopRecording();
  }, [status, elapsed, maxSeconds]);

  const reachedMin = elapsed >= minimumSpeakingSeconds || text.trim().length >= 30;
  const canSubmit = (status === "ready" || (allowText && text.trim().length >= 8)) && reachedMin;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
        <button
          type="button"
          onClick={status === "recording" ? stopRecording : startRecording}
          disabled={status === "processing"}
          aria-label={status === "recording" ? "Stop recording" : "Start recording"}
          className={cn(
            "relative inline-flex h-20 w-20 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50",
            status === "recording"
              ? "bg-destructive text-destructive-foreground recording-pulse"
              : status === "processing"
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground hover:scale-[1.04]",
          )}
        >
          {status === "recording" ? (
            <Square className="h-7 w-7 fill-current" />
          ) : status === "processing" ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </button>

        <div className="flex flex-col items-center gap-1">
          <div className="font-mono text-sm tabular-nums text-foreground/80">
            {formatDuration(elapsed)}
            {minimumSpeakingSeconds > 0 && status !== "ready" && (
              <span className="text-muted-foreground">
                {" "}
                / {formatDuration(minimumSpeakingSeconds)} minimum
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {status === "recording"
              ? reachedMin
                ? "Keep going if you have more to say. Tap to finish."
                : "Keep going. Try to explain your thinking with a little more detail."
              : status === "processing"
                ? "Transcribing your response…"
                : status === "ready"
                  ? "Got it. Review your transcript below or re-record if needed."
                  : "Tap the mic to begin. Or type your answer instead."}
          </p>
        </div>

        {audioUrl && status === "ready" && (
          <audio src={audioUrl} controls className="w-full max-w-md" />
        )}

        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      {allowText && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Transcript / your answer
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or speak your reflection. Even a few sentences with a specific detail goes a long way."
            className="min-h-[140px]"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{text.trim().split(/\s+/).filter(Boolean).length} words</span>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() =>
            onComplete({
              text: text.trim(),
              audioBlobUrl: audioUrl,
              durationSeconds: elapsed,
              inputType: audioUrl ? "audio" : "text",
            })
          }
          disabled={!canSubmit}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return undefined;
}

async function transcribe(blob: Blob): Promise<string> {
  try {
    const fd = new FormData();
    fd.append("audio", blob, "audio.webm");
    const res = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
    if (!res.ok) return "";
    const data = (await res.json()) as { text?: string };
    return data.text ?? "";
  } catch {
    return "";
  }
}
