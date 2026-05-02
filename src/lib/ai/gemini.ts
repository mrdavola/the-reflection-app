import { z } from "zod";

export type GeminiSchema = {
  type: string;
  properties?: Record<string, GeminiSchema>;
  items?: GeminiSchema;
  required?: string[];
  enum?: string[];
  nullable?: boolean;
  propertyOrdering?: string[];
};

type GeminiStructuredBodyInput = {
  system: string;
  prompt: string;
  schema: GeminiSchema;
};

export function buildGeminiStructuredBody(input: GeminiStructuredBodyInput) {
  return {
    systemInstruction: {
      parts: [{ text: input.system }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: input.prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: input.schema,
    },
  };
}

export function extractGeminiText(response: unknown) {
  const parsed = GeminiGenerateContentResponseSchema.parse(response);
  const text = parsed.candidates
    .flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini did not return text.");
  }

  return text;
}

export async function generateGeminiStructured<T>(input: {
  apiKey: string;
  model: string;
  system: string;
  prompt: string;
  schema: GeminiSchema;
  parse: (value: unknown) => T;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": input.apiKey,
      },
      body: JSON.stringify(
        buildGeminiStructuredBody({
          system: input.system,
          prompt: input.prompt,
          schema: input.schema,
        }),
      ),
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      `Gemini request failed: ${payload.error?.message ?? response.statusText}`,
    );
  }

  return input.parse(JSON.parse(extractGeminiText(payload)));
}

export const ExitTicketQuestionGeminiSchema = {
  type: "object",
  properties: {
    question: { type: "string" },
    rationale: { type: "string" },
  },
  required: ["question", "rationale"],
  propertyOrdering: ["question", "rationale"],
} satisfies GeminiSchema;

export const ExitTicketTurnGeminiSchema = {
  type: "object",
  properties: {
    directQuote: { type: "string" },
    rating: { type: "number" },
    ratingLabel: {
      type: "string",
      enum: ["surface", "developing", "deep", "transfer"],
    },
    teacherSummary: { type: "string" },
    followUpQuestion: { type: "string", nullable: true },
  },
  required: [
    "directQuote",
    "rating",
    "ratingLabel",
    "teacherSummary",
    "followUpQuestion",
  ],
  propertyOrdering: [
    "directQuote",
    "rating",
    "ratingLabel",
    "teacherSummary",
    "followUpQuestion",
  ],
} satisfies GeminiSchema;

export const StepAnalysisGeminiSchema = {
  type: "object",
  properties: {
    depthLevel: {
      type: "string",
      enum: ["surface", "developing", "deep", "transfer"],
    },
    depthScore: { type: "number" },
    cognitiveMoves: { type: "array", items: { type: "string" } },
    specificEvidence: { type: "string" },
    followUpQuestion: { type: "string", nullable: true },
    tone: {
      type: "string",
      enum: ["engaged", "neutral", "disengaged", "concerned"],
    },
    safetyNotes: { type: "string", nullable: true },
  },
  required: [
    "depthLevel",
    "depthScore",
    "cognitiveMoves",
    "specificEvidence",
    "followUpQuestion",
    "tone",
    "safetyNotes",
  ],
  propertyOrdering: [
    "depthLevel",
    "depthScore",
    "cognitiveMoves",
    "specificEvidence",
    "followUpQuestion",
    "tone",
    "safetyNotes",
  ],
} satisfies GeminiSchema;

export const ReflectionAnalysisGeminiSchema = {
  type: "object",
  properties: {
    overallDepthScore: { type: "number" },
    strongestStep: { type: "string" },
    strongestMove: { type: "string" },
    nudge: { type: "string" },
    keyQuotes: { type: "array", items: { type: "string" } },
    crossCurricularConnections: { type: "array", items: { type: "string" } },
    mindset: { type: "string", enum: ["growth", "neutral", "fixed"] },
    tone: {
      type: "string",
      enum: ["engaged", "neutral", "disengaged", "concerned"],
    },
  },
  required: [
    "overallDepthScore",
    "strongestStep",
    "strongestMove",
    "nudge",
    "keyQuotes",
    "crossCurricularConnections",
    "mindset",
    "tone",
  ],
  propertyOrdering: [
    "overallDepthScore",
    "strongestStep",
    "strongestMove",
    "nudge",
    "keyQuotes",
    "crossCurricularConnections",
    "mindset",
    "tone",
  ],
} satisfies GeminiSchema;

const GeminiGenerateContentResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z
          .object({
            parts: z.array(z.object({ text: z.string().optional() })),
          })
          .optional(),
      }),
    )
    .default([]),
});
