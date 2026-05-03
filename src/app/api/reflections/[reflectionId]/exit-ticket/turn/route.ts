import { z } from "zod";
import { analyzeExitTicketTurn, analyzeCompletedReflection, moderateTranscript } from "@/lib/ai/service";
import { badRequest, notFound, ok, serverError } from "@/lib/server/http";
import {
  completeReflection,
  getReflection,
  getSession,
  submitReflectionStep,
} from "@/lib/server/store";
import type { RoutineStepLabel } from "@/lib/types";

const ExitTicketTurnSchema = z.object({
  participantToken: z.string().min(1),
  prompt: z.string().min(1),
  response: z.string().min(1),
  turnIndex: z.number().int().min(0).max(4),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reflectionId: string }> },
) {
  try {
    const { reflectionId } = await params;
    const body = ExitTicketTurnSchema.safeParse(await request.json());
    if (!body.success) return badRequest("Exit ticket turn payload is invalid.");

    const reflection = await getReflection(reflectionId);
    if (!reflection) return notFound("Reflection not found.");

    const session = await getSession(reflection.sessionId);
    if (!session) return notFound("Session not found.");
    const supportsConversationTurns =
      session.routineId === "exit-ticket-conversation" ||
      session.routineId === "quick-spin";
    if (!supportsConversationTurns) {
      return badRequest("This reflection does not use conversation turns.");
    }

    const maxTurns = session.exitTicketMaxTurns ?? 4;
    const [analysis, alerts] = await Promise.all([
      analyzeExitTicketTurn({
        session,
        reflection,
        prompt: body.data.prompt,
        response: body.data.response,
        turnIndex: body.data.turnIndex,
        maxTurns,
      }),
      moderateTranscript(body.data.response),
    ]);

    const label = getExitTicketLabel(body.data.turnIndex);
    const updated = await submitReflectionStep({
      reflectionId,
      participantToken: body.data.participantToken,
      step: {
        label,
        prompt: body.data.prompt,
        transcription: body.data.response,
        depthLevel: analysis.ratingLabel,
        depthScore: analysis.rating,
        followUpQuestion: analysis.followUpQuestion,
        directQuote: analysis.directQuote,
        rating: analysis.rating,
        ratingLabel: analysis.ratingLabel,
        teacherSummary: analysis.teacherSummary,
      },
      alerts,
    });

    if (body.data.turnIndex >= maxTurns - 1) {
      const completedAnalysis = await analyzeCompletedReflection(updated);
      const completed = await completeReflection({
        reflectionId,
        participantToken: body.data.participantToken,
        analysis: {
          overallDepthScore: completedAnalysis.overallDepthScore,
          strongestStep: completedAnalysis.strongestStep,
          mindset: completedAnalysis.mindset,
          tone: completedAnalysis.tone,
          keyQuotes: completedAnalysis.keyQuotes,
          crossCurricularConnections: completedAnalysis.crossCurricularConnections,
          cognitiveMoves: updated.steps.map(
            (step) => `${step.label}: ${step.ratingLabel ?? step.depthLevel ?? "surface"}`,
          ),
        },
        feedback: {
          strongestMove: completedAnalysis.strongestMove,
          nudge: completedAnalysis.nudge,
          growthComparison: null,
        },
      });

      return ok({ reflection: completed, analysis, alerts, complete: true });
    }

    return ok({ reflection: updated, analysis, alerts, complete: false });
  } catch (error) {
    return serverError(error);
  }
}

function getExitTicketLabel(turnIndex: number): RoutineStepLabel {
  if (turnIndex === 0) return "Exit Ticket";
  if (turnIndex === 1) return "Follow-up 1";
  if (turnIndex === 2) return "Follow-up 2";
  return "Follow-up 3";
}
