import { assertParticipantTokenForReflection } from "@/lib/server/auth";
import { notFound, ok, serverError } from "@/lib/server/http";
import { getReflection } from "@/lib/server/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reflectionId: string }> },
) {
  try {
    const { reflectionId } = await params;
    const reflection = await getReflection(reflectionId);
    if (!reflection) return notFound("Reflection not found.");
    const token = new URL(request.url).searchParams.get("token") ?? "";
    await assertParticipantTokenForReflection({
      sessionId: reflection.sessionId,
      participantToken: token,
    });

    return ok({ reflection });
  } catch (error) {
    return serverError(error);
  }
}
