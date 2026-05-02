import type { SafetyAlert } from "./types";

const RED_PATTERNS: Array<{
  category: SafetyAlert["category"];
  title: string;
  pattern: RegExp;
}> = [
  {
    category: "self_harm",
    title: "Possible self-harm language",
    pattern: /\b(kill myself|hurt myself|suicide|end my life|don't want to live)\b/i,
  },
  {
    category: "personal_safety",
    title: "Personal safety concern",
    pattern: /\b(i do not feel safe|i don't feel safe|unsafe at home|scared to go home)\b/i,
  },
  {
    category: "abuse",
    title: "Possible abuse disclosure",
    pattern: /\b(being abused|hit me|hurts me at home|touches me)\b/i,
  },
  {
    category: "threat",
    title: "Threat language",
    pattern: /\b(i will hurt|going to hurt|bring a weapon|shoot up)\b/i,
  },
];

const AMBER_PATTERNS: Array<{
  category: SafetyAlert["category"];
  title: string;
  pattern: RegExp;
}> = [
  {
    category: "profanity",
    title: "Profanity detected",
    pattern: /\b(damn|hell|shit|fuck)\b/i,
  },
  {
    category: "negative_tone",
    title: "Negative tone",
    pattern: /\b(i hate this|this is stupid|i give up|i can't do this)\b/i,
  },
];

export function classifyTranscriptSafety(transcript: string): SafetyAlert | null {
  const normalized = transcript.trim();

  for (const rule of RED_PATTERNS) {
    const match = normalized.match(rule.pattern);
    if (match) {
      return {
        severity: "red",
        category: rule.category,
        title: rule.title,
        message: "Review the transcript and recording before taking action.",
        matchedText: match[0],
      };
    }
  }

  for (const rule of AMBER_PATTERNS) {
    const match = normalized.match(rule.pattern);
    if (match) {
      return {
        severity: "amber",
        category: rule.category,
        title: rule.title,
        message: "Check whether this needs teacher follow-up.",
        matchedText: match[0],
      };
    }
  }

  return null;
}
