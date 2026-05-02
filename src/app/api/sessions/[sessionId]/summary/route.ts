import { generateSessionSummary } from "@/lib/ai/service";
import { badRequest, notFound, ok, serverError } from "@/lib/server/http";
import { getDashboard, saveClassSummary } from "@/lib/server/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const dashboard = await getDashboard(sessionId);
    if (!dashboard) return notFound("Session not found.");

    const completedCount = dashboard.reflections.filter(
      (reflection) => reflection.completedAt,
    ).length;
    if (completedCount === 0) return badRequest("No completed reflections yet.");

    const summary = await generateSessionSummary({
      session: dashboard.session,
      reflections: dashboard.reflections,
    });
    const session = await saveClassSummary(sessionId, summary);

    return ok({ session, summary });
  } catch (error) {
    return serverError(error);
  }
}
