import { analyzeStep, moderateTranscript, transcribeAudio } from "@/lib/ai/service";
import { getRoutineStep } from "@/lib/routines";
import { storeReflectionAudio } from "@/lib/server/firebase-admin";
import { badRequest, notFound, ok, serverError } from "@/lib/server/http";
import { getReflection, getSession, submitReflectionStep } from "@/lib/server/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reflectionId: string; step: string }> },
) {
  try {
    const { reflectionId, step } = await params;
    const stepNumber = Number(step);
    if (![1, 2, 3].includes(stepNumber)) return badRequest("Invalid routine step.");

    const formData = await request.formData();
    const participantToken = String(formData.get("participantToken") ?? "");
    const audio = formData.get("audio");
    if (!participantToken || !(audio instanceof File)) {
      return badRequest("Audio and participant token are required.");
    }

    const reflection = await getReflection(reflectionId);
    if (!reflection) return notFound("Reflection not found.");

    const session = await getSession(reflection.sessionId);
    if (!session) return notFound("Session not found.");

    const routineStep = getRoutineStep(stepNumber);
    const transcript = await transcribeAudio(audio);
    const audioExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const recordingUrl = await storeReflectionAudio({
      sessionId: session.id,
      reflectionId,
      stepNumber,
      file: audio,
      audioExpiresAt,
    });
    const [analysis, alerts] = await Promise.all([
      analyzeStep({ session, label: routineStep.label, transcript }),
      moderateTranscript(transcript),
    ]);

    const updated = await submitReflectionStep({
      reflectionId,
      participantToken,
      step: {
        label: routineStep.label,
        transcription: transcript,
        depthLevel: analysis.depthLevel,
        depthScore: analysis.depthScore,
        followUpQuestion: analysis.followUpQuestion ?? null,
      },
      alerts,
      audioExpiresAt,
    });

    return ok({
      reflection: updated,
      analysis,
      alerts,
      transcript,
      audioExpiresAt,
      recordingUrl,
    });
  } catch (error) {
    return serverError(error);
  }
}
