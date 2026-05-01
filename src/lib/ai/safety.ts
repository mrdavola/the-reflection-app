// Lightweight client/server-shared keyword scanner for student safety alerts.
// The spec requires conservative wording — we flag, we never diagnose.

const SEVERE = [
  "suicide",
  "kill myself",
  "end it all",
  "self harm",
  "self-harm",
  "cutting myself",
  "hurt myself",
  "want to die",
  "abuse",
  "molest",
];

const MODERATE = [
  "hate",
  "violence",
  "fight",
  "weapon",
  "gun",
  "bullying",
  "bullied",
];

const PROFANITY_HINT = ["fuck", "shit", "bitch"];

export interface SafetyAlert {
  type: string;
  severity: "low" | "med" | "high";
  excerpt: string;
}

export function scanForAlerts(text: string): SafetyAlert[] {
  const lower = text.toLowerCase();
  const alerts: SafetyAlert[] = [];

  for (const phrase of SEVERE) {
    if (lower.includes(phrase)) {
      alerts.push({
        type: "Wellbeing concern",
        severity: "high",
        excerpt: extract(text, phrase),
      });
    }
  }
  for (const phrase of MODERATE) {
    if (lower.includes(phrase)) {
      alerts.push({
        type: "Conflict or safety mention",
        severity: "med",
        excerpt: extract(text, phrase),
      });
    }
  }
  for (const phrase of PROFANITY_HINT) {
    if (lower.includes(phrase)) {
      alerts.push({
        type: "Possible profanity",
        severity: "low",
        excerpt: extract(text, phrase),
      });
    }
  }
  return alerts;
}

function extract(text: string, phrase: string): string {
  const i = text.toLowerCase().indexOf(phrase);
  if (i === -1) return "";
  const start = Math.max(0, i - 40);
  const end = Math.min(text.length, i + phrase.length + 40);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}
