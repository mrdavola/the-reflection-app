import { z } from "zod";
import { generateGeminiStructured } from "@/lib/ai/gemini";
import { getEnv } from "@/lib/server/env";
import { badRequest, ok, serverError } from "@/lib/server/http";
import type { GeminiSchema } from "@/lib/ai/gemini";

const GenerateWyrRequestSchema = z.object({
  gradeLevel: z.string(),
  subject: z.string(),
  topic: z.string(),
});

const WyrGeminiSchema: GeminiSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          vibe: { type: "string" },
          optionA: { type: "string" },
          optionB: { type: "string" },
        },
        required: ["vibe", "optionA", "optionB"],
        propertyOrdering: ["vibe", "optionA", "optionB"],
      },
    },
  },
  required: ["questions"],
  propertyOrdering: ["questions"],
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = GenerateWyrRequestSchema.safeParse(body);
    if (!result.success) {
      return badRequest("Invalid request body.", result.error);
    }
    const { gradeLevel, subject, topic } = result.data;
    
    const env = getEnv();
    if (!env.GEMINI_API_KEY) {
      return serverError("Missing Gemini API key.");
    }

    const systemPrompt = `You are an expert curriculum designer and engaging educator. Your task is to generate three 'Would You Rather' questions for a classroom activity.

The questions must be tailored to:
Grade Level: ${gradeLevel}
Subject: ${subject}
Topic: ${topic}

Guidelines for the 3 questions:
1. 'Silly': Make it highly imaginative, absurd, or funny, while still tangentially related to the topic.
2. 'Balanced': A highly relatable, realistic scenario applying the topic to everyday life.
3. 'Analytical': A deeper, more complex question that requires strong critical thinking and understanding of the topic's mechanics.

Keep the wording simple enough for the specified grade level. Format your response strictly as a JSON object matching the provided schema.`;

    const data = await generateGeminiStructured({
      apiKey: env.GEMINI_API_KEY,
      model: "gemini-2.5-flash",
      system: systemPrompt,
      prompt: "Generate the questions.",
      schema: WyrGeminiSchema,
      parse: (val) => val as { questions: { vibe: string; optionA: string; optionB: string; }[] },
    });

    return ok(data);
  } catch (error) {
    return serverError(error);
  }
}
