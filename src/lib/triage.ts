/**
 * Canonical triage helpers — shared between the dashboard tab and the group /
 * activity surfaces. All three sites previously carried near-identical copies
 * of buildRowData / pickQuote / cleanQuote; consolidate here so they stay in
 * lockstep when the heuristics evolve.
 */

import type { Reflection, ScoreColor } from "./types";
import type { TriageRowData } from "@/components/dashboard/triage-row";

const QUOTE_MAX_LEN = 160;
const QUOTE_TRIM_LEN = 157;

export function buildRowData(reflection: Reflection): TriageRowData {
  const a = reflection.analysis;
  const color: ScoreColor = a?.scoreColor ?? "blue";
  const level = a?.reflectionLevel ?? 1;
  const quote = pickQuote(reflection);
  const teacherMove = a?.teacherFollowUp ?? a?.suggestedNextStep ?? "";
  const hasSafetyAlert = (a?.contentAlerts ?? []).some(
    (alert) => alert.severity === "high",
  );
  return { reflection, color, level, quote, teacherMove, hasSafetyAlert };
}

export function pickQuote(reflection: Reflection): string {
  const fromAnalysis = reflection.analysis?.studentQuotes?.[0];
  if (fromAnalysis && fromAnalysis.trim()) return cleanQuote(fromAnalysis);
  const fromResponse = reflection.responses[0]?.text;
  if (fromResponse && fromResponse.trim()) {
    const clean = fromResponse.trim();
    return clean.length > QUOTE_MAX_LEN
      ? `${clean.slice(0, QUOTE_TRIM_LEN)}…`
      : clean;
  }
  return "";
}

export function cleanQuote(text: string): string {
  const trimmed = text.replace(/^["“”']|["“”']$/g, "").trim();
  return trimmed.length > QUOTE_MAX_LEN
    ? `${trimmed.slice(0, QUOTE_TRIM_LEN)}…`
    : trimmed;
}
