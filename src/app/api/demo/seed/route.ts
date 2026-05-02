import { requireTeacherSession } from "@/lib/server/auth";
import { ok, serverError } from "@/lib/server/http";
import { seedDemoSession } from "@/lib/server/store";

export async function POST(request: Request) {
  try {
    await requireTeacherSession(request);
    const session = await seedDemoSession();
    return ok({ session });
  } catch (error) {
    return serverError(error);
  }
}
