import { notFound, ok } from "@/lib/server/http";
import { getReflection } from "@/lib/server/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reflectionId: string }> },
) {
  const { reflectionId } = await params;
  const reflection = await getReflection(reflectionId);
  if (!reflection) return notFound("Reflection not found.");

  return ok({ reflection });
}
