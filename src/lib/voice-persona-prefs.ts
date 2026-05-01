/**
 * Single source of truth for voice persona preferences.
 *
 * Two localStorage keys live here. Both the settings page (write side) and the
 * personal reflection run page (read side) must use these helpers — never the
 * raw key strings — so the contract can't drift.
 */

export const VOICE_PREF_KEY = "refleckt:personal:voice";
export const TTS_ENABLED_KEY = "refleckt:personal:tts-enabled";

export const VOICE_IDS = ["Aoede", "Puck", "Charon", "Kore"] as const;
export type VoicePersona = (typeof VOICE_IDS)[number];

function isVoicePersona(v: unknown): v is VoicePersona {
  return typeof v === "string" && (VOICE_IDS as readonly string[]).includes(v);
}

export function readVoicePref(): VoicePersona {
  if (typeof window === "undefined") return "Aoede";
  try {
    const v = window.localStorage.getItem(VOICE_PREF_KEY);
    return isVoicePersona(v) ? v : "Aoede";
  } catch {
    return "Aoede";
  }
}

export function readTtsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(TTS_ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeVoicePref(voice: VoicePersona): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VOICE_PREF_KEY, voice);
  } catch {
    // ignore quota errors
  }
}

export function writeTtsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TTS_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore quota errors
  }
}
