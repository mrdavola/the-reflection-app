import { z } from "zod";
import { analyzeCompletedReflection } from "@/lib/ai/service";
import { badRequest, notFound, ok, serverError } from "@/lib/server/http";
import { completeReflection, getReflection } from "@/lib/server/store";

const CompleteSchema = z.object({
  participantToken: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reflectionId: string }> },
) {
  try {
    const { reflectionId } = await params;
    const body = CompleteSchema.safeParse(await request.json());
    if (!body.success) return badRequest("Complete payload is invalid.");

    const reflection = await getReflection(reflectionId);
    if (!reflection) return notFound("Reflection not found.");
    if (reflection.steps.length < 3) return badRequest("All three steps are required.");

    const analysis = await analyzeCompletedReflection(reflection);
    const completed = await completeReflection({
      reflectionId,
      participantToken: body.data.participantToken,
      analysis: {
        overallDepthScore: analysis.overallDepthScore,
        strongestStep: analysis.strongestStep,
        mindset: analysis.mindset,
        tone: analysis.tone,
        keyQuotes: analysis.keyQuotes,
        crossCurricularConnections: analysis.crossCurricularConnections,
        cognitiveMoves: reflection.steps.flatMap((step) =>
          step.depthLevel ? [`${step.label}: ${step.depthLevel}`] : [],
        ),
      },
      feedback: {
        strongestMove: analysis.strongestMove,
        nudge: analysis.nudge,
        growthComparison: null,
      },
    });

    return ok({ reflection: completed });
  } catch (error) {
    return serverError(error);
  }
}
