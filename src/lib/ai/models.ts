// Centralised model selection. We route through Vercel AI Gateway using
// "provider/model" strings so we can flip providers per call site without
// installing provider-specific SDKs.

export const MODELS = {
  /** Fast, low-cost — for prompt generation, coaching nudges, lesson tools. */
  fast: "google/gemini-2.5-flash",
  /** Higher quality — for full reflection feedback + analysis + class summaries. */
  smart: "google/gemini-2.5-pro",
  /** Audio transcription — Whisper is purpose-built and stays. */
  transcribe: "openai/whisper-1",
} as const;

export const HAS_GATEWAY = Boolean(process.env.AI_GATEWAY_API_KEY);
