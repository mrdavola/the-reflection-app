import { z } from "zod";
import { joinSession } from "@/lib/server/store";
import { badRequest, ok, serverError } from "@/lib/server/http";

const JoinSchema = z.object({
  joinCode: z.string().min(4),
  displayName: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = JoinSchema.safeParse(await request.json());
    if (!body.success) return badRequest("Join payload is invalid.");

    const joined = await joinSession(body.data.joinCode, body.data.displayName);
    return ok(joined, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
