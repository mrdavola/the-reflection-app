"use client";

import type { ReflectionAnalysis, Rubric } from "./types";

export async function generatePrompts(input: {
  objective: string;
  focus: string;
  gradeBand?: string;
  count?: number;
  language?: string;
  prior?: { promptText: string; text: string }[];
}): Promise<{ prompts: string[]; source: string }> {
  const res = await fetch("/api/ai/prompts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ count: 3, ...input }),
  });
  if (!res.ok) throw new Error("prompt_generation_failed");
  return (await res.json()) as { prompts: string[]; source: string };
}

export async function analyzeReflection(input: {
  objective: string;
  focus: string;
  gradeBand?: string;
  language?: string;
  responses: { promptText: string; text: string }[];
  rubric?: Rubric;
}): Promise<{ analysis: ReflectionAnalysis; source: string }> {
  const res = await fetch("/api/ai/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("analyze_failed");
  return (await res.json()) as { analysis: ReflectionAnalysis; source: string };
}

export async function generateGroupSummary(input: {
  groupName: string;
  objective?: string;
  focus?: string;
  reflections: {
    participantName: string;
    summary?: string;
    level?: number;
    mindset?: string;
    tone?: string;
    transcript?: string;
  }[];
}) {
  const res = await fetch("/api/ai/group-summary", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("group_summary_failed");
  return (await res.json()) as {
    summary: {
      understandingParagraph: string;
      teacherMovesParagraph: string;
      recommendedTeacherMoves: string[];
      commonStrengths: string[];
      commonStruggles: string[];
      studentsNeedingFollowUp: string[];
      studentsReadyForExtension: string[];
    };
    source: string;
  };
}
