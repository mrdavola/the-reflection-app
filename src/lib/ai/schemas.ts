import { z } from "zod";

export const DepthLevelSchema = z.enum([
  "surface",
  "developing",
  "deep",
  "transfer",
]);

export const ToneSchema = z.enum([
  "engaged",
  "neutral",
  "disengaged",
  "concerned",
]);

export const StepAnalysisSchema = z.object({
  depthLevel: DepthLevelSchema,
  depthScore: z.number().int().min(1).max(4),
  cognitiveMoves: z.array(z.string()).default([]),
  specificEvidence: z.string().min(1),
  followUpQuestion: z.string().nullable().optional(),
  tone: ToneSchema,
  safetyNotes: z.string().nullable().optional(),
});

export const ReflectionAnalysisSchema = z.object({
  overallDepthScore: z.number().int().min(1).max(4),
  strongestStep: z.string().min(1),
  strongestMove: z.string().min(1),
  nudge: z.string().min(1),
  keyQuotes: z.array(z.string()).default([]),
  crossCurricularConnections: z.array(z.string()).default([]),
  mindset: z.enum(["growth", "neutral", "fixed"]),
  tone: ToneSchema,
});

export const ThinkingMapClusterSchema = z.object({
  label: z.string().min(1),
  summary: z.string().min(1),
  studentIds: z.array(z.string()).default([]),
  representativeQuotes: z.array(z.string()).default([]),
});

export const ClassThinkingMapSchema = z.object({
  see: z.array(ThinkingMapClusterSchema).default([]),
  think: z.array(ThinkingMapClusterSchema).default([]),
  wonder: z.array(ThinkingMapClusterSchema).default([]),
});

export const ExitTicketQuestionSchema = z.object({
  question: z.string().min(12),
  rationale: z.string().min(1),
});

export const ExitTicketTurnAnalysisSchema = z.object({
  directQuote: z.string().min(1),
  rating: z.number().int().min(1).max(4),
  ratingLabel: DepthLevelSchema,
  teacherSummary: z.string().min(1),
  followUpQuestion: z.string().min(1).nullable(),
});

export type StepAnalysis = z.infer<typeof StepAnalysisSchema>;
export type ReflectionAnalysis = z.infer<typeof ReflectionAnalysisSchema>;
export type ClassThinkingMapAnalysis = z.infer<typeof ClassThinkingMapSchema>;
export type ExitTicketQuestion = z.infer<typeof ExitTicketQuestionSchema>;
export type ExitTicketTurnAnalysis = z.infer<typeof ExitTicketTurnAnalysisSchema>;
