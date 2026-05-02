import { requireTeacherSession } from "@/lib/server/auth";
import { getDashboard } from "@/lib/server/store";
import { notFound, ok, serverError } from "@/lib/server/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    await requireTeacherSession(request);
    const { sessionId } = await params;
    const dashboard = await getDashboard(sessionId);
    if (!dashboard) return notFound("Session not found.");

    return ok(dashboard);
  } catch (error) {
    return serverError(error);
  }
}
