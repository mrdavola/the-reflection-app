"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VoicePersona } from "./voice-persona-prefs";

// Re-exported here for backwards compatibility with existing consumers.
export type { VoicePersona };

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
  // Track the active object URL so we can revoke it on stop / unmount,
  // not just on natural `ended`. Otherwise the URL leaks if the component
  // unmounts mid-playback or the user calls stop() before audio finishes.
  const urlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
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
        urlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsLoading(false);
          setIsPlaying(true);
        };
        audio.onended = () => {
          setIsPlaying(false);
          if (urlRef.current === url) {
            URL.revokeObjectURL(url);
            urlRef.current = null;
          } else {
            URL.revokeObjectURL(url);
          }
          opts.onEnded?.();
        };
        audio.onerror = () => {
          setIsLoading(false);
          setIsPlaying(false);
          if (urlRef.current === url) {
            URL.revokeObjectURL(url);
            urlRef.current = null;
          }
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

  // Revoke any lingering URL + stop playback if the consumer unmounts.
  useEffect(() => () => stop(), [stop]);

  return { speak, stop, isLoading, isPlaying };
}
