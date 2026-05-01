import { z } from "zod";

export const PromptListSchema = z.object({
  prompts: z
    .array(z.string().min(8).max(280))
    .min(1)
    .max(5),
});

export const FeedbackSchema = z.object({
  feedback: z.string().min(60).max(1200),
});

export const AnalysisSchema = z.object({
  summary: z.string(),
  feedback: z.string(),
  strengthsNoticed: z.array(z.string()).min(1).max(5),
  suggestedNextStep: z.string(),
  understandingScore: z.number().int().min(0).max(100),
  understandingLabel: z.enum(["Emerging", "Developing", "Proficient", "Advanced"]),
  reflectionLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  scoreColor: z.enum(["sunny", "orange", "blue", "rose"]),
  zone: z.enum(["below", "ideal", "above", "high", "unclear"]),
  mindset: z.enum([
    "growth",
    "neutral",
    "fixed",
    "curious",
    "confident",
    "uncertain",
    "frustrated",
    "overwhelmed",
    "reflective",
  ]),
  mindsetSummary: z.string(),
  tone: z.enum([
    "constructive",
    "neutral",
    "motivated",
    "excited",
    "hesitant",
    "frustrated",
    "low-energy",
    "confident",
    "unclear",
  ]),
  toneSummary: z.string(),
  keyCognitiveSkills: z.array(z.string()).min(1).max(8),
  hiddenLesson: z.string(),
  possibleCognitiveBias: z.object({
    label: z.string(),
    explanation: z.string(),
  }),
  crossCurricularConnections: z.array(z.string()).max(5),
  studentQuotes: z.array(z.string()).min(0).max(5).default([]),
  teacherFollowUp: z.string(),
  motivationSignal: z.enum(["high", "moderate", "low", "unclear"]),
  contentAlerts: z
    .array(
      z.object({
        type: z.string(),
        severity: z.enum(["low", "med", "high"]),
        excerpt: z.string(),
      }),
    )
    .default([]),
  rubricResults: z
    .array(
      z.object({
        criterionId: z.string(),
        level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
        evidence: z.string().max(200),
      }),
    )
    .optional(),
});

export const GroupSummarySchema = z.object({
  understandingParagraph: z.string(),
  teacherMovesParagraph: z.string(),
  recommendedTeacherMoves: z.array(z.string()).min(1).max(8),
  commonStrengths: z.array(z.string()).min(0).max(8),
  commonStruggles: z.array(z.string()).min(0).max(8),
  studentsNeedingFollowUp: z.array(z.string()).max(20),
  studentsReadyForExtension: z.array(z.string()).max(20),
});
