"use client";

import { useCallback, useRef, useState } from "react";

export type VoicePersona = "Aoede" | "Puck" | "Charon" | "Kore";

interface UseTTSOptions {
  voice?: VoicePersona;
  muted?: boolean;
}

interface SpeakOptions {
  voiceOverride?: VoicePersona;
  onEnded?: () => void;
}

/**
 * Wraps server-side Gemini TTS via /api/ai/tts.
 * Returns play function plus loading/playing state for latency masking UI.
 */
export function useTTS({ voice = "Aoede", muted = false }: UseTTSOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(
    async (text: string, opts: SpeakOptions = {}) => {
      stop();
      setIsLoading(true);

      try {
        const res = await fetch("/api/ai/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: opts.voiceOverride ?? voice }),
        });
        if (!res.ok) throw new Error(`TTS request failed: ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsLoading(false);
          setIsPlaying(true);
        };
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          opts.onEnded?.();
        };
        audio.onerror = () => {
          setIsLoading(false);
          setIsPlaying(false);
        };

        if (!muted || opts.voiceOverride) {
          await audio.play();
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("TTS error", err);
        setIsLoading(false);
      }
    },
    [voice, muted, stop],
  );

  return { speak, stop, isLoading, isPlaying };
}
