import { ok, serverError } from "@/lib/server/http";
import { seedDemoSession } from "@/lib/server/store";

export async function POST() {
  try {
    const session = await seedDemoSession();
    return ok({ session });
  } catch (error) {
    return serverError(error);
  }
}
