"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal Web Speech API typings — vendor-prefixed in some browsers.
interface SRAlternative {
  transcript: string;
  confidence: number;
}
interface SRResult {
  isFinal: boolean;
  length: number;
  readonly [index: number]: SRAlternative;
}
interface SRResultList {
  length: number;
  readonly [index: number]: SRResult;
}
interface SREvent extends Event {
  resultIndex: number;
  results: SRResultList;
}
interface SRErrorEvent extends Event {
  error: string;
  message?: string;
}
interface SRInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((e: Event) => void) | null;
  onend: ((e: Event) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onresult: ((e: SREvent) => void) | null;
}
type SRConstructor = new () => SRInstance;

const MAX_TRANSCRIPT_CHARS = 6000;

function getSpeechRecognitionCtor(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return (w.SpeechRecognition || w.webkitSpeechRecognition) ?? null;
}

export interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  transcript: string;
  interim: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
  error: string | null;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SRInstance | null>(null);
  // The user-visible "should be listening" intent. Used to auto-restart when
  // Chrome cuts the recognizer off via onend.
  const wantListeningRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize once on mount.
  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event: SREvent) => {
      let interimChunk = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalChunk += text;
        } else {
          interimChunk += text;
        }
      }
      if (finalChunk) {
        setTranscript((prev) => {
          const next = (prev ? prev + " " : "") + finalChunk.trim();
          // 5-min rolling window — drop oldest chars when over the limit.
          if (next.length > MAX_TRANSCRIPT_CHARS) {
            return next.slice(next.length - MAX_TRANSCRIPT_CHARS);
          }
          return next;
        });
      }
      setInterim(interimChunk);
    };

    rec.onerror = (event: SRErrorEvent) => {
      // "no-speech" and "aborted" are routine and shouldn't surface as errors.
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(event.error || "speech_error");
    };

    rec.onend = () => {
      // If the user still wants to be listening, restart on the next tick —
      // Chrome periodically ends the session on its own.
      if (wantListeningRef.current) {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          try {
            rec.start();
          } catch {
            // If start throws (e.g. already-started), just ignore — onstart
            // / onend will reconcile the state.
          }
        }, 250);
      } else {
        setListening(false);
        setInterim("");
      }
    };

    rec.onstart = () => {
      setListening(true);
      setError(null);
    };

    recognitionRef.current = rec;

    return () => {
      wantListeningRef.current = false;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.onstart = null;
        rec.abort();
      } catch {
        // ignore teardown errors
      }
      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    wantListeningRef.current = true;
    setError(null);
    try {
      rec.start();
    } catch {
      // Already started — ignore.
    }
  }, []);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    wantListeningRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      // ignore
    }
    setListening(false);
    setInterim("");
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  return { supported, listening, transcript, interim, start, stop, reset, error };
}
