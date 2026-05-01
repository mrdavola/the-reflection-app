// Server-side safety-alert email helper.
//
// Uses Resend's HTTP API directly via native `fetch` — no SDK install
// required. When `RESEND_API_KEY` is unset, this logs to the console and
// returns `{ sent: false, reason: "no_api_key" }` so callers can no-op
// gracefully in dev / preview.

import "server-only";

export type SafetyAlertSeverity = "low" | "med" | "high";

export interface SafetyAlertInput {
  educatorEmail: string;
  reflectionId: string;
  severity: SafetyAlertSeverity;
  excerpt: string;
  studentName: string;
  activityTitle?: string;
}

export type SafetyAlertResult =
  | { sent: true; id?: string }
  | { sent: false; reason: "no_api_key" | "no_recipient" | "send_failed"; error?: string };

const DEFAULT_FROM = "alerts@thereflectionapp.com";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function severityLabel(s: SafetyAlertSeverity): string {
  switch (s) {
    case "high":
      return "HIGH SEVERITY";
    case "med":
      return "Moderate";
    case "low":
      return "Low";
  }
}

function buildSubject(input: SafetyAlertInput): string {
  const sev = input.severity === "high" ? "[HIGH] " : input.severity === "med" ? "[Moderate] " : "[Low] ";
  return `${sev}Safety alert from ${input.studentName}`;
}

function buildHtml(input: SafetyAlertInput): string {
  const activity = input.activityTitle
    ? `<p style="margin:0 0 12px;color:#475569"><strong>Activity:</strong> ${escapeHtml(input.activityTitle)}</p>`
    : "";
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a;max-width:560px">
      <h2 style="margin:0 0 8px">Safety alert</h2>
      <p style="margin:0 0 12px;color:#475569"><strong>Severity:</strong> ${escapeHtml(severityLabel(input.severity))}</p>
      <p style="margin:0 0 12px;color:#475569"><strong>Student:</strong> ${escapeHtml(input.studentName)}</p>
      ${activity}
      <p style="margin:0 0 6px;color:#475569"><strong>Excerpt</strong></p>
      <blockquote style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #f59e0b;background:#fffbeb;border-radius:4px">
        ${escapeHtml(input.excerpt)}
      </blockquote>
      <p style="margin:0;color:#64748b;font-size:13px">Reflection ID: ${escapeHtml(input.reflectionId)}</p>
    </div>
  `;
}

function buildText(input: SafetyAlertInput): string {
  return [
    `Safety alert (${severityLabel(input.severity)})`,
    `Student: ${input.studentName}`,
    input.activityTitle ? `Activity: ${input.activityTitle}` : null,
    "",
    `Excerpt: ${input.excerpt}`,
    "",
    `Reflection ID: ${input.reflectionId}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function sendSafetyAlert(input: SafetyAlertInput): Promise<SafetyAlertResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERTS_FROM_EMAIL || DEFAULT_FROM;

  if (!input.educatorEmail) {
    console.warn("[alerts/safety] missing recipient email; skipping send", {
      reflectionId: input.reflectionId,
      severity: input.severity,
    });
    return { sent: false, reason: "no_recipient" };
  }

  if (!apiKey) {
    console.warn("[alerts/safety] RESEND_API_KEY unset; logging instead of sending", {
      to: input.educatorEmail,
      from,
      reflectionId: input.reflectionId,
      severity: input.severity,
      studentName: input.studentName,
      activityTitle: input.activityTitle,
      excerpt: input.excerpt,
    });
    return { sent: false, reason: "no_api_key" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.educatorEmail,
        subject: buildSubject(input),
        html: buildHtml(input),
        text: buildText(input),
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[alerts/safety] Resend returned non-OK:", res.status, errText);
      return { sent: false, reason: "send_failed", error: `${res.status} ${errText}` };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { sent: true, id: data.id };
  } catch (err) {
    console.error("[alerts/safety] send failed:", err);
    return { sent: false, reason: "send_failed", error: String(err) };
  }
}
