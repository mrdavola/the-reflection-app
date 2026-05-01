/**
 * Insight derivation helpers — extracted from `use-reflection-flow.ts` so
 * non-hook callers (reflection detail page, tests) can derive the four-key
 * insights shape from a stored ReflectionAnalysis without pulling in the
 * full reflection-flow state machine.
 *
 * Contract: `deriveInsight(analysis, transcripts)` always returns a
 * complete `ReflectionInsight`. Missing fields fall back to the user's
 * own first sentence + a deterministic quote keyed off the insight text.
 */

import type { ReflectionAnalysis } from "@/lib/types";

export interface ReflectionInsight {
  user_quote: string;
  core_insight: string;
  next_ripple: string;
  inspirational_quote: string;
}

const FALLBACK_QUOTES: string[] = [
  "Between stimulus and response there is a space. In that space is our power to choose. — Viktor Frankl",
  "We do not learn from experience. We learn from reflecting on experience. — John Dewey",
  "An unexamined life is not worth living. — Socrates",
  "What we are seeking is what is seeking. — Saint Francis of Assisi",
  "The longest journey is the journey inward. — Dag Hammarskjöld",
  "When you know better, you do better. — Maya Angelou",
];

export function pickQuote(seed: string): string {
  if (!seed) return FALLBACK_QUOTES[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return FALLBACK_QUOTES[Math.abs(hash) % FALLBACK_QUOTES.length];
}

export function firstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^[^.!?]+[.!?]?/);
  return (match?.[0] ?? trimmed).trim().slice(0, 220);
}

/**
 * Maps the existing AnalysisSchema → the four-key insights shape that the
 * Master Educator layout expects. We don't change the API; we adapt at the edge.
 */
export function deriveInsight(
  analysis: ReflectionAnalysis | null | undefined,
  transcripts: string[],
): ReflectionInsight {
  const fallbackTranscript = transcripts.find((t) => t && t.trim().length > 0) ?? "";
  const userQuote =
    analysis?.studentQuotes?.[0]?.trim() ||
    firstSentence(fallbackTranscript) ||
    "";

  const coreInsight =
    analysis?.hiddenLesson?.trim() ||
    analysis?.summary?.trim() ||
    "Something honest came through.";

  const nextRipple =
    analysis?.suggestedNextStep?.trim() ||
    "Carry one specific thing into the next hour.";

  const inspirationalQuote = pickQuote(coreInsight + userQuote);

  return {
    user_quote: userQuote,
    core_insight: coreInsight,
    next_ripple: nextRipple,
    inspirational_quote: inspirationalQuote,
  };
}
