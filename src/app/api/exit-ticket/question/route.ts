import { z } from "zod";
import { generateExitTicketQuestion } from "@/lib/ai/service";
import { badRequest, ok, serverError } from "@/lib/server/http";

const GenerateExitTicketQuestionSchema = z.object({
  subject: z.string().min(1),
  gradeBand: z.string().min(1),
  lessonContext: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = GenerateExitTicketQuestionSchema.safeParse(await request.json());
    if (!body.success) return badRequest("Exit ticket context is required.");

    const draft = await generateExitTicketQuestion(body.data);
    return ok({ draft });
  } catch (error) {
    return serverError(error);
  }
}
