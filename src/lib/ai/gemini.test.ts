import { describe, expect, it } from "vitest";
import { buildGeminiStructuredBody, extractGeminiText } from "./gemini";

describe("Gemini API helpers", () => {
  it("builds a structured JSON generateContent request", () => {
    const body = buildGeminiStructuredBody({
      system: "Write like a teacher.",
      prompt: "Create one question.",
      schema: {
        type: "object",
        properties: {
          question: { type: "string" },
        },
        required: ["question"],
      },
    });

    expect(body.systemInstruction.parts[0].text).toBe("Write like a teacher.");
    expect(body.contents[0].parts[0].text).toBe("Create one question.");
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema.required).toContain("question");
  });

  it("extracts response text from Gemini candidates", () => {
    expect(
      extractGeminiText({
        candidates: [
          {
            content: {
              parts: [{ text: "{\"question\":\"What changed?\"}" }],
            },
          },
        ],
      }),
    ).toBe("{\"question\":\"What changed?\"}");
  });
});
