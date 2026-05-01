// POST /api/alerts/safety
//
// Integration point for the analyze flow to fire educator emails when a
// reflection contains content flagged as `severity: "high"`. Accepts the
// reflection ID plus the alert payload, calls `sendSafetyAlert`, and
// reports whether an email was actually sent. When `RESEND_API_KEY` is
// unset, this still returns 200 — the helper logs to console and reports
// `sent: false` with reason `no_api_key`.

import { NextResponse } from "next/server";
import { z } from "zod";
import { sendSafetyAlert } from "@/lib/email/alerts";

export const runtime = "nodejs";

const Body = z.object({
  reflectionId: z.string().min(1),
  educatorEmail: z.string().email(),
  severity: z.enum(["low", "med", "high"]),
  excerpt: z.string().min(1),
  studentName: z.string().min(1),
  activityTitle: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await sendSafetyAlert(parsed.data);
  return NextResponse.json({ ok: true, sent: result });
}
