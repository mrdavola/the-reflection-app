// Centralised model selection. We use Vercel AI Gateway "provider/model" strings
// so we don't lock into a single provider — flip these per call site as needed.

export const MODELS = {
  /** Fast, low-cost — for prompt generation. */
  fast: "anthropic/claude-haiku-4-5",
  /** Higher quality — for feedback + analysis. */
  smart: "anthropic/claude-sonnet-4-6",
  /** Whisper-style transcription. */
  transcribe: "openai/whisper-1",
} as const;

export const HAS_GATEWAY = Boolean(process.env.AI_GATEWAY_API_KEY);
