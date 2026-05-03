import { z } from "zod";
import { generateStimulusPromptSuggestions } from "@/lib/ai/service";
import { requireTeacherSession } from "@/lib/server/auth";
import { badRequest, ok, serverError } from "@/lib/server/http";

const Schema = z.object({
  learningTarget: z.string().min(4),
  gradeBand: z.string().optional(),
  subject: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    await requireTeacherSession(request);
    const body = Schema.safeParse(await request.json());
    if (!body.success) return badRequest("Learning target is required.");

    const suggestions = await generateStimulusPromptSuggestions(body.data);
    return ok({ suggestions });
  } catch (error) {
    return serverError(error);
  }
}
