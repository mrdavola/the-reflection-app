import { z } from "zod";
import { analyzeCompletedReflection } from "@/lib/ai/service";
import { SEE_THINK_WONDER_ROUTINE, WOULD_YOU_RATHER_ROUTINE } from "@/lib/routines";
import { badRequest, notFound, ok, serverError } from "@/lib/server/http";
import { completeReflection, getReflection, getSession } from "@/lib/server/store";

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

    const session = await getSession(reflection.sessionId);
    if (!session) return notFound("Session not found.");

    const requiredSteps =
      session.routineId === "would-you-rather"
        ? WOULD_YOU_RATHER_ROUTINE.steps.length
        : SEE_THINK_WONDER_ROUTINE.steps.length;
    if (reflection.steps.length < requiredSteps) {
      return badRequest(`All ${requiredSteps} steps are required.`);
    }

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
