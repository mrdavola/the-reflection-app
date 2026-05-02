import { z } from "zod";
import { generateStimulusImage } from "@/lib/ai/service";
import { requireTeacherSession } from "@/lib/server/auth";
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
    return ok({ image });
  } catch (error) {
    return serverError(error);
  }
}
