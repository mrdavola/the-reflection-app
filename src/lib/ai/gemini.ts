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
type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

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

export function extractGeminiImage(response: unknown) {
  const parsed = GeminiGenerateContentResponseSchema.parse(response);
  const image = parsed.candidates
    .flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.inlineData ?? part.inline_data)
    .find((inlineData) => inlineData?.data);

  if (!image?.data) {
    throw new Error("Gemini did not return image data.");
  }

  const imagePayload = image as {
    mimeType?: string;
    mime_type?: string;
    data: string;
  };

  return {
    data: image.data,
    mimeType: imagePayload.mimeType ?? imagePayload.mime_type ?? "image/png",
  };
}

export async function generateGeminiText(input: {
  apiKey: string;
  model: string;
  parts: GeminiPart[];
  system?: string;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": input.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: input.system
          ? { parts: [{ text: input.system }] }
          : undefined,
        contents: [{ role: "user", parts: input.parts }],
      }),
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      `Gemini request failed: ${payload.error?.message ?? response.statusText}`,
    );
  }

  return extractGeminiText(payload);
}

export async function generateGeminiImage(input: {
  apiKey: string;
  model: string;
  prompt: string;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": input.apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: input.prompt }] }],
      }),
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      `Gemini image request failed: ${payload.error?.message ?? response.statusText}`,
    );
  }

  return extractGeminiImage(payload);
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

export const SafetyAlertsGeminiSchema = {
  type: "object",
  properties: {
    alerts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["amber", "red"] },
          category: {
            type: "string",
            enum: [
              "personal_safety",
              "self_harm",
              "violence",
              "abuse",
              "threat",
              "profanity",
              "low_depth",
              "negative_tone",
            ],
          },
          title: { type: "string" },
          message: { type: "string" },
          matchedText: { type: "string", nullable: true },
        },
        required: ["severity", "category", "title", "message", "matchedText"],
        propertyOrdering: [
          "severity",
          "category",
          "title",
          "message",
          "matchedText",
        ],
      },
    },
  },
  required: ["alerts"],
  propertyOrdering: ["alerts"],
} satisfies GeminiSchema;

const GeminiGenerateContentResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z
          .object({
            parts: z.array(
              z.object({
                text: z.string().optional(),
                inlineData: z
                  .object({
                    mimeType: z.string().optional(),
                    data: z.string().optional(),
                  })
                  .optional(),
                inline_data: z
                  .object({
                    mime_type: z.string().optional(),
                    data: z.string().optional(),
                  })
                  .optional(),
              }),
            ),
          })
          .optional(),
      }),
    )
    .default([]),
});
