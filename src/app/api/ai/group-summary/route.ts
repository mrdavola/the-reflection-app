import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getModel, HAS_AI } from "@/lib/ai/models";
import { GroupSummarySchema } from "@/lib/ai/schemas";
import { mockGroupSummary } from "@/lib/ai/mock";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  groupName: z.string(),
  objective: z.string().optional(),
  focus: z.string().optional(),
  language: z.string().default("English"),
  reflections: z.array(
    z.object({
      participantName: z.string(),
      summary: z.string().optional().default(""),
      level: z.number().min(1).max(4).optional(),
      mindset: z.string().optional(),
      tone: z.string().optional(),
      keyCognitiveSkills: z.array(z.string()).optional(),
      transcript: z.string().optional(),
    }),
  ),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  if (!HAS_AI) {
    return NextResponse.json({
      summary: mockGroupSummary({
        groupName: input.groupName,
        reflections: input.reflections.map((r) => ({
          participantName: r.participantName,
          analysis: r.level
            ? ({
                reflectionLevel: r.level as 1 | 2 | 3 | 4,
                motivationSignal: "moderate",
              } as Parameters<typeof mockGroupSummary>[0]["reflections"][number]["analysis"])
            : null,
        })),
      }),
      source: "mock",
    });
  }

  try {
    const { object } = await generateObject({
      model: getModel("smart"),
      schema: GroupSummarySchema,
      system: buildSystemPrompt(input.language),
      prompt: buildPrompt(input),
    });
    return NextResponse.json({ summary: object, source: "ai" });
  } catch (err) {
    console.error("[ai/group-summary] falling back to mock:", err);
    return NextResponse.json({
      summary: mockGroupSummary({
        groupName: input.groupName,
        reflections: input.reflections.map((r) => ({ participantName: r.participantName, analysis: null })),
      }),
      source: "mock-fallback",
    });
  }
}

const SYSTEM_PROMPT = `You aggregate a class's reflections into a teacher-facing summary that helps the teacher decide what to do tomorrow.

Write two paragraphs:
1. understandingParagraph — what the class collectively understands or struggles with, themes across responses.
2. teacherMovesParagraph — concrete, classroom-ready instructional moves the teacher can do tomorrow.

Then list:
- recommendedTeacherMoves (3-6, action-first verbs)
- commonStrengths (short bullets, what the group is doing well)
- commonStruggles (short bullets, what's holding the group back)
- studentsNeedingFollowUp (names from the reflections that show low engagement, frustration, or low understanding)
- studentsReadyForExtension (names of strong reflectors who could push further)

Be cautious about identifying students by name — only include names that appear in the reflections. Don't fabricate.`;

function isSpanish(language: string): boolean {
  return language === "Spanish" || language.toLowerCase().startsWith("es");
}

function buildSystemPrompt(language: string): string {
  if (isSpanish(language)) {
    return `${SYSTEM_PROMPT}

LANGUAGE: Write "understandingParagraph", "teacherMovesParagraph", "recommendedTeacherMoves", "commonStrengths", and "commonStruggles" in natural, teacher-facing Spanish (español). Keep student names verbatim.`;
  }
  return SYSTEM_PROMPT;
}

function buildPrompt(input: z.infer<typeof Body>) {
  return [
    `Group: ${input.groupName}`,
    input.objective ? `Activity objective: ${input.objective}` : "",
    input.focus ? `Focus: ${input.focus}` : "",
    `\nReflections (${input.reflections.length}):`,
    ...input.reflections.map(
      (r, i) =>
        `${i + 1}. ${r.participantName} — level ${r.level ?? "?"}, mindset: ${r.mindset ?? "?"}, tone: ${r.tone ?? "?"}\nSummary: ${r.summary || "(no summary)"}\nTranscript excerpt: ${(r.transcript ?? "").slice(0, 320)}`,
    ),
  ]
    .filter(Boolean)
    .join("\n");
}
