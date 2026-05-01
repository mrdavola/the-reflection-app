import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getModel, HAS_AI } from "@/lib/ai/models";
import { AnalysisSchema } from "@/lib/ai/schemas";
import { mockAnalysis } from "@/lib/ai/mock";
import { scanForAlerts } from "@/lib/ai/safety";

export const runtime = "nodejs";
export const maxDuration = 120;

const RubricSchema = z.object({
  enabled: z.boolean(),
  criteria: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        description: z.string().optional(),
      }),
    )
    .default([]),
});

const Body = z.object({
  objective: z.string(),
  focus: z.string(),
  gradeBand: z.string().default("9-12"),
  language: z.string().default("English"),
  responses: z.array(z.object({ promptText: z.string(), text: z.string() })).min(1),
  rubric: RubricSchema.optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;
  const fullText = input.responses.map((r) => r.text).join(" ");
  const localAlerts = scanForAlerts(fullText);

  if (!HAS_AI) {
    const analysis = mockAnalysis({
      objective: input.objective,
      responses: input.responses,
      gradeBand: input.gradeBand,
      rubric: input.rubric,
      language: input.language,
    });
    analysis.contentAlerts = mergeAlerts(analysis.contentAlerts, localAlerts);
    return NextResponse.json({ analysis, source: "mock" });
  }

  try {
    const { object } = await generateObject({
      model: getModel("smart"),
      schema: AnalysisSchema,
      system: buildAnalyzeSystemPrompt(input.language),
      prompt: buildAnalyzeInstruction(input),
    });
    const analysis = { ...object, contentAlerts: mergeAlerts(object.contentAlerts ?? [], localAlerts) };
    return NextResponse.json({ analysis, source: "ai" });
  } catch (err) {
    console.error("[ai/analyze] falling back to mock:", err);
    const analysis = mockAnalysis({
      objective: input.objective,
      responses: input.responses,
      gradeBand: input.gradeBand,
      rubric: input.rubric,
      language: input.language,
    });
    analysis.contentAlerts = mergeAlerts(analysis.contentAlerts, localAlerts);
    return NextResponse.json({ analysis, source: "mock-fallback" });
  }
}

function mergeAlerts<T extends { type: string; severity: string; excerpt: string }>(
  a: T[],
  b: T[],
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of [...a, ...b]) {
    const key = `${x.type}|${x.excerpt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(x);
  }
  return out;
}

const ANALYZE_SYSTEM_PROMPT = `You are an experienced reflection coach analyzing a learner's reflection.
Be cautious — only infer what is supported by the learner's words. Never diagnose mental health.
Frame everything constructively. The "feedback" you write will be shown directly to the learner; keep it under 110 words, supportive, specific, and actionable. Sign off with a warm closing like "See you next reflection." or "Keep going."

Calibration:
- understandingScore is your *estimate* of clarity, 0-100. It is not a grade.
- reflectionLevel: 1=Beginning, 2=Developing, 3=Proficient, 4=Strong.
- scoreColor: sunny if level 3-4, orange if 2, blue if 1, rose only if a content alert is severe.
- zone: ideal/high if at-or-above expected for the grade band; below if needs more support.

For "possibleCognitiveBias" only flag a real bias if the response shows clear signs (overgeneralization, confirmation bias, anchoring on one example). Otherwise return label "No major bias detected".

For "studentQuotes": return up to 5 short, *direct* quotes pulled verbatim from the learner's words — each must be a real fragment they wrote, under 25 words, that demonstrates their understanding or thinking. Do not paraphrase, do not invent text. If nothing is quote-worthy, return an empty array.

For "crossCurricularConnections": only name a real bridge between two subject areas when the learner explicitly referenced multiple domains (e.g. they connected a math concept to a science observation, or used a historical event to frame an ELA argument). Each entry should be a short label like "Math ↔ Science: graphing experimental data". If only one domain is referenced, return an empty array — do not fabricate connections.

If a rubric is provided, evaluate the response against each criterion on a 1–4 scale (Beginning, Developing, Proficient, Strong). For each criterion, return a short 'evidence' string (≤ 200 chars) that quotes or paraphrases the learner's words demonstrating that level. Use the criterion's exact id in "criterionId". If no rubric is provided, omit "rubricResults".

Frame contentAlerts gently — say "may require adult review" not "this student is X".`;

function isSpanish(language: string): boolean {
  return language === "Spanish" || language.toLowerCase().startsWith("es");
}

function buildAnalyzeSystemPrompt(language: string): string {
  if (isSpanish(language)) {
    return `${ANALYZE_SYSTEM_PROMPT}

LANGUAGE: Write the following fields in natural, learner-friendly Spanish (español): "feedback", "summary", "mindsetSummary", "toneSummary", "hiddenLesson", "suggestedNextStep", "teacherFollowUp". Also write "strengthsNoticed", "keyCognitiveSkills", "crossCurricularConnections", and rubric "evidence" strings in Spanish. Keep all other structured field labels (e.g. understandingLabel, mindset, tone, scoreColor, zone, motivationSignal, reflectionLevel, possibleCognitiveBias.label) in English exactly as the schema requires.`;
  }
  return ANALYZE_SYSTEM_PROMPT;
}

function buildAnalyzeInstruction(input: z.infer<typeof Body>) {
  const lines = [
    `Objective: ${input.objective}`,
    `Reflection focus: ${input.focus}`,
    `Grade band: ${input.gradeBand}`,
    `Language: ${input.language}`,
  ];
  if (input.rubric?.enabled && input.rubric.criteria.length > 0) {
    lines.push("");
    lines.push("Rubric (evaluate each criterion on a 1–4 scale):");
    input.rubric.criteria.forEach((c) => {
      lines.push(
        `- id="${c.id}" label="${c.label}"${c.description ? ` — ${c.description}` : ""}`,
      );
    });
  }
  lines.push(
    `\nResponses:\n${input.responses
      .map((r, i) => `Q${i + 1}: ${r.promptText}\nA${i + 1}: ${r.text}`)
      .join("\n\n")}`,
  );
  return lines.join("\n");
}
