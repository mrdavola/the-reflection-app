import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createTeacherSessionToken,
  getSessionMaxAge,
  getTeacherCookieName,
  isTeacherEmailAllowed,
} from "@/lib/server/auth";
import { verifyFirebaseIdToken } from "@/lib/server/firebase-admin";

const AuthSchema = z.object({
  idToken: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = AuthSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Auth payload is invalid." }, { status: 400 });
    }

    const decoded = await verifyFirebaseIdToken(body.data.idToken);
    if (!decoded?.email) {
      return NextResponse.json({ error: "Could not verify Google sign-in." }, { status: 401 });
    }

    if (!isTeacherEmailAllowed(decoded.email)) {
      return NextResponse.json(
        { error: "This account is not allowed for the pilot." },
        { status: 403 },
      );
    }

    const sessionToken = await createTeacherSessionToken({
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    });

    const response = NextResponse.json({
      ok: true,
      teacher: {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name ?? null,
      },
    });
    response.cookies.set(getTeacherCookieName(), sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getSessionMaxAge(),
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
