import { randomUUID } from "node:crypto";
import { z } from "zod";
import { generateStimulusImage } from "@/lib/ai/service";
import { requireTeacherSession } from "@/lib/server/auth";
import { storeGeneratedImage } from "@/lib/server/firebase-admin";
import { badRequest, ok, serverError } from "@/lib/server/http";

const GenerateWyrImagesSchema = z.object({
  optionA: z.string().min(8),
  optionB: z.string().min(8),
  gradeLevel: z.string().optional(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  vibe: z.string().optional(),
});

function buildOptionPrompt(input: {
  label: "Option A" | "Option B";
  option: string;
  otherOption: string;
  gradeLevel?: string;
  subject?: string;
  topic?: string;
  vibe?: string;
}) {
  return [
    `Create a vivid classroom-safe illustration for ${input.label} in a Would You Rather reflection.`,
    "No readable text, no labels, no logos, no copyrighted characters, no frightening content.",
    "Make the image concrete, visual, and useful for students to compare ideas before explaining their reasoning.",
    input.gradeLevel ? `Grade level: ${input.gradeLevel}` : null,
    input.subject ? `Subject: ${input.subject}` : null,
    input.topic ? `Topic: ${input.topic}` : null,
    input.vibe ? `Scenario tone: ${input.vibe}` : null,
    `${input.label}: ${input.option}`,
    `Contrasting option for context: ${input.otherOption}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function persistImage(dataUrl: string, suffix: "a" | "b") {
  const storedUrl = await storeGeneratedImage({
    path: `generated-images/wyr/${randomUUID()}-${suffix}.png`,
    dataUrl,
  });

  return storedUrl ?? dataUrl;
}

export async function POST(request: Request) {
  try {
    await requireTeacherSession(request);
    const body = GenerateWyrImagesSchema.safeParse(await request.json());
    if (!body.success) return badRequest("Would You Rather options are required.");

    const [optionAImage, optionBImage] = await Promise.all([
      generateStimulusImage({
        prompt: buildOptionPrompt({
          label: "Option A",
          option: body.data.optionA,
          otherOption: body.data.optionB,
          gradeLevel: body.data.gradeLevel,
          subject: body.data.subject,
          topic: body.data.topic,
          vibe: body.data.vibe,
        }),
        learningTarget: body.data.topic,
      }),
      generateStimulusImage({
        prompt: buildOptionPrompt({
          label: "Option B",
          option: body.data.optionB,
          otherOption: body.data.optionA,
          gradeLevel: body.data.gradeLevel,
          subject: body.data.subject,
          topic: body.data.topic,
          vibe: body.data.vibe,
        }),
        learningTarget: body.data.topic,
      }),
    ]);

    const [optionAImageUrl, optionBImageUrl] = await Promise.all([
      persistImage(optionAImage.dataUrl, "a"),
      persistImage(optionBImage.dataUrl, "b"),
    ]);

    return ok({
      images: {
        optionAImageUrl,
        optionBImageUrl,
        optionAImageModel: optionAImage.model,
        optionBImageModel: optionBImage.model,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
