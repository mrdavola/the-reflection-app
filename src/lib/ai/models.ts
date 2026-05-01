// Centralised model selection. Two providers are supported:
//
//   1. Vercel AI Gateway — set AI_GATEWAY_API_KEY. We pass plain
//      "provider/model" strings, which the gateway resolves.
//   2. Direct Google AI Studio — set GOOGLE_GENERATIVE_AI_API_KEY. We use
//      the @ai-sdk/google provider so generateText/generateObject work
//      against Gemini without the gateway.
//
// The gateway wins when both are set. Whisper transcription (in
// /api/ai/transcribe) only works through the gateway today.
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

type Tier = "fast" | "smart";

const GATEWAY_IDS: Record<Tier, string> = {
  fast: "google/gemini-2.5-flash",
  smart: "google/gemini-2.5-pro",
};

const DIRECT_IDS: Record<Tier, string> = {
  fast: "gemini-2.5-flash",
  smart: "gemini-2.5-pro",
};

export const HAS_GATEWAY = Boolean(process.env.AI_GATEWAY_API_KEY);
export const HAS_DIRECT_GOOGLE = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
export const HAS_AI = HAS_GATEWAY || HAS_DIRECT_GOOGLE;

export const TRANSCRIBE_MODEL = "openai/whisper-1";

/**
 * Returns a model identifier the AI SDK accepts: a gateway string when the
 * gateway is configured, otherwise a `@ai-sdk/google` model instance.
 */
export function getModel(tier: Tier): LanguageModel {
  if (HAS_GATEWAY) return GATEWAY_IDS[tier];
  return google(DIRECT_IDS[tier]);
}

/** Legacy alias kept for any direct string lookups (gateway path only). */
export const MODELS = {
  fast: GATEWAY_IDS.fast,
  smart: GATEWAY_IDS.smart,
  transcribe: TRANSCRIBE_MODEL,
} as const;
