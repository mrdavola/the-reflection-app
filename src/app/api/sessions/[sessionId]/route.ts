import { getDashboard } from "@/lib/server/store";
import { notFound, ok } from "@/lib/server/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const dashboard = await getDashboard(sessionId);
  if (!dashboard) return notFound("Session not found.");

  return ok(dashboard);
}
