import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getModel, HAS_AI } from "@/lib/ai/models";
import { PromptListSchema } from "@/lib/ai/schemas";
import { mockPrompts } from "@/lib/ai/mock";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  objective: z.string().min(1),
  focus: z.string().min(1),
  gradeBand: z.string().default("9-12"),
  language: z.string().default("English"),
  count: z.number().int().min(1).max(5).default(3),
  prior: z
    .array(z.object({ promptText: z.string(), text: z.string() }))
    .optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  if (!HAS_AI) {
    return NextResponse.json({
      prompts: mockPrompts({
        objective: input.objective,
        focus: input.focus,
        count: input.count,
        language: input.language,
        prior: input.prior,
      }),
      source: "mock",
    });
  }

  try {
    const { object } = await generateObject({
      model: getModel("fast"),
      schema: PromptListSchema,
      system: buildSystemPrompt(input.language),
      prompt: buildPromptInstruction(input),
    });
    return NextResponse.json({ prompts: object.prompts.slice(0, input.count), source: "ai" });
  } catch (err) {
    console.error("[ai/prompts] falling back to mock:", err);
    return NextResponse.json({
      prompts: mockPrompts({
        objective: input.objective,
        focus: input.focus,
        count: input.count,
        language: input.language,
        prior: input.prior,
      }),
      source: "mock-fallback",
    });
  }
}

function isSpanish(language: string): boolean {
  return language === "Spanish" || language.toLowerCase().startsWith("es");
}

function buildSystemPrompt(language: string): string {
  const base =
    "You are a reflection coach generating short, open-ended prompts. Prompts must be developmentally appropriate, reference the learner's objective, and be designed to surface thinking rather than yes/no answers. Never give complicated language. Return only prompts; no preamble.";
  if (isSpanish(language)) {
    return `${base}\n\nIMPORTANT: Generate every prompt in Spanish (español). Use natural, learner-friendly Spanish appropriate for the grade band.`;
  }
  return base;
}

function buildPromptInstruction(input: z.infer<typeof Body>) {
  const priorText =
    input.prior && input.prior.length
      ? `\n\nThe learner has already answered:\n${input.prior
          .map((p) => `Q: ${p.promptText}\nA: ${p.text}`)
          .join("\n\n")}\n\nGenerate ${input.count} adaptive follow-up prompt(s) that reference what the learner actually said.`
      : `\n\nGenerate ${input.count} reflection prompt(s) tailored to this objective.`;

  return [
    `Objective:\n${input.objective}`,
    `Reflection focus: ${input.focus}`,
    `Grade band / level: ${input.gradeBand}`,
    `Language: ${input.language}`,
    priorText,
    "Each prompt should be one short, open-ended question (15-30 words). Avoid yes/no questions. Avoid generic prompts like 'how did it go?'.",
  ].join("\n");
}
