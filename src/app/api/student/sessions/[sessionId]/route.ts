import { assertParticipantTokenForReflection } from "@/lib/server/auth";
import { badRequest, notFound, ok, serverError } from "@/lib/server/http";
import { getReflection, getSession } from "@/lib/server/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const searchParams = new URL(request.url).searchParams;
    const reflectionId = searchParams.get("reflectionId") ?? "";
    const token = searchParams.get("token") ?? "";

    if (!reflectionId || !token) {
      return badRequest("Reflection and participant token are required.");
    }

    const reflection = await getReflection(reflectionId);
    if (!reflection || reflection.sessionId !== sessionId) {
      return notFound("Reflection not found.");
    }

    await assertParticipantTokenForReflection({
      sessionId,
      participantToken: token,
    });

    const session = await getSession(sessionId);
    if (!session || session.status !== "active") return notFound("Session not found.");

    return ok({
      session: {
        id: session.id,
        routineId: session.routineId,
        title: session.title,
        learningTarget: session.learningTarget,
        stimulus: session.stimulus,
        exitTicketQuestion: session.exitTicketQuestion,
        exitTicketMaxTurns: session.exitTicketMaxTurns,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
