import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getModel, HAS_AI } from "@/lib/ai/models";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  transcript: z.string().default(""),
  recentSuggestions: z.array(z.string()).default([]),
  gradeBand: z.string().optional(),
  subject: z.string().optional(),
});

const CoachOutput = z.object({
  suggestions: z.array(z.string()).min(0).max(3),
});

const COACH_SYSTEM_PROMPT = `You are an instructional coach. Listen to a snippet of a teacher's lesson and offer at most 1–3 short, actionable nudges (10–22 words each). Examples: 'Ask a student to summarize the key idea so far.', 'Try a 30-second think-pair-share before moving on.'. Avoid restating what the teacher said. Avoid generic platitudes. If the snippet is too short or unclear, return an empty array.`;

const MOCK_SUGGESTIONS = [
  "Ask a student to summarize the key point in their own words.",
  "Pause for a 15-second silent think before the next question.",
  "Try a quick turn-and-talk before continuing.",
  "Ask 'what's something you're still wondering about?'",
];

function pickMock(transcript: string): string[] {
  const len = transcript.trim().length;
  if (len < 40) return [];
  // Deterministic 1–2 picks based on transcript length so it shifts as the
  // lesson grows but doesn't churn every poll.
  const start = Math.floor(len / 80) % MOCK_SUGGESTIONS.length;
  const count = len % 3 === 0 ? 2 : 1;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(MOCK_SUGGESTIONS[(start + i) % MOCK_SUGGESTIONS.length]);
  }
  return out;
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { transcript, recentSuggestions, gradeBand, subject } = parsed.data;
  const trimmed = transcript.trim();

  if (!HAS_AI) {
    return NextResponse.json({ suggestions: pickMock(trimmed), source: "mock" });
  }

  if (trimmed.length < 40) {
    return NextResponse.json({ suggestions: [], source: "ai" });
  }

  try {
    const userPrompt = buildPrompt({ transcript: trimmed, recentSuggestions, gradeBand, subject });
    const { object } = await generateObject({
      model: getModel("fast"),
      schema: CoachOutput,
      system: COACH_SYSTEM_PROMPT,
      prompt: userPrompt,
    });
    return NextResponse.json({ suggestions: object.suggestions, source: "ai" });
  } catch (err) {
    console.error("[ai/coach] falling back to mock:", err);
    return NextResponse.json({
      suggestions: pickMock(trimmed),
      source: "mock-fallback",
    });
  }
}

function buildPrompt(args: {
  transcript: string;
  recentSuggestions: string[];
  gradeBand?: string;
  subject?: string;
}): string {
  const lines: string[] = [];
  if (args.gradeBand) lines.push(`Grade band: ${args.gradeBand}`);
  if (args.subject) lines.push(`Subject: ${args.subject}`);
  lines.push("");
  lines.push("Recent lesson transcript (rolling window):");
  lines.push(args.transcript);
  if (args.recentSuggestions.length > 0) {
    lines.push("");
    lines.push("Don't repeat: " + args.recentSuggestions.map((s) => `"${s}"`).join("; "));
  }
  lines.push("");
  lines.push("Return 0–3 fresh, actionable nudges (10–22 words each).");
  return lines.join("\n");
}
