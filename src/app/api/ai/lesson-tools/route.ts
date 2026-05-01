import { NextResponse } from "next/server";
import { generateText } from "ai";
import { z } from "zod";
import { MODELS, HAS_GATEWAY } from "@/lib/ai/models";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  kind: z.enum(["summarize", "exit-ticket", "translate"]),
  transcript: z.string().default(""),
  targetLanguage: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { kind, transcript, targetLanguage } = parsed.data;
  const trimmed = transcript.trim();

  if (!HAS_GATEWAY) {
    return NextResponse.json({ text: mockResult(kind, trimmed, targetLanguage), source: "mock" });
  }

  try {
    const { system, prompt } = buildToolPrompt(kind, trimmed, targetLanguage);
    const { text } = await generateText({
      model: MODELS.fast,
      system,
      prompt,
    });
    return NextResponse.json({ text: text.trim(), source: "ai" });
  } catch (err) {
    console.error("[ai/lesson-tools] falling back to mock:", err);
    return NextResponse.json({
      text: mockResult(kind, trimmed, targetLanguage),
      source: "mock-fallback",
    });
  }
}

function buildToolPrompt(
  kind: "summarize" | "exit-ticket" | "translate",
  transcript: string,
  targetLanguage?: string,
): { system: string; prompt: string } {
  if (kind === "summarize") {
    return {
      system:
        "You are an instructional coach. Summarize a snippet of a teacher's live lesson into 3–5 short bullets capturing the top points. No preamble — just the bullets.",
      prompt: `Lesson transcript:\n${transcript || "(no transcript yet)"}\n\nReturn 3–5 bullet points.`,
    };
  }
  if (kind === "exit-ticket") {
    return {
      system:
        "You are an instructional coach. Write ONE short reflective exit-ticket question grounded in the lesson transcript. The question should ask students to apply, connect, or reflect — not just recall. No preamble, no numbering.",
      prompt: `Lesson transcript:\n${transcript || "(no transcript yet)"}\n\nReturn one question.`,
    };
  }
  const lang = targetLanguage?.trim() || "Spanish";
  const last = transcript.slice(-200);
  return {
    system: `You translate short lesson snippets into ${lang}. Return only the translation, no preamble.`,
    prompt: `Translate this into ${lang}:\n\n${last || "(nothing to translate yet)"}`,
  };
}

function mockResult(
  kind: "summarize" | "exit-ticket" | "translate",
  transcript: string,
  targetLanguage?: string,
): string {
  const trimmed = transcript.trim();
  const last = trimmed.slice(-200);
  const firstWords = trimmed.split(/\s+/).slice(0, 8).join(" ") || "(no transcript yet)";
  if (kind === "summarize") {
    if (!trimmed) return "- No lesson transcript yet — start listening to capture what's said.";
    return [
      `- Opening idea: ${firstWords}…`,
      `- Lesson is ${trimmed.length} characters in; teacher is building context.`,
      `- Key recent moment: ${last.slice(-80) || trimmed.slice(0, 80)}`,
    ].join("\n");
  }
  if (kind === "exit-ticket") {
    if (!trimmed) return "What's one question you still have about today's lesson?";
    return `In your own words, what was the most important idea so far, and how would you explain it to a classmate?`;
  }
  const lang = targetLanguage?.trim() || "Spanish";
  if (!last) return `(${lang}) Nada que traducir todavía.`;
  return `(${lang}) ${last}`;
}
