import { randomUUID } from "node:crypto";
import { z } from "zod";
import { generateStimulusImage } from "@/lib/ai/service";
import { requireTeacherSession } from "@/lib/server/auth";
import { storeGeneratedImage } from "@/lib/server/firebase-admin";
import { badRequest, ok, serverError } from "@/lib/server/http";

const GenerateStimulusSchema = z.object({
  prompt: z.string().min(8),
  learningTarget: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    await requireTeacherSession(request);
    const body = GenerateStimulusSchema.safeParse(await request.json());
    if (!body.success) return badRequest("Describe the image you want students to observe.");

    const image = await generateStimulusImage(body.data);
    const storedUrl = await storeGeneratedImage({
      path: `generated-images/stimulus/${randomUUID()}.png`,
      dataUrl: image.dataUrl,
    });

    return ok({
      image: {
        ...image,
        dataUrl: storedUrl ?? image.dataUrl,
        storage: storedUrl ? "firebase-storage" : "inline-data-url",
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
