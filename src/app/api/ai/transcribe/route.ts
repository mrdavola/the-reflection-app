import { NextResponse } from "next/server";
import { HAS_GATEWAY } from "@/lib/ai/models";

export const runtime = "nodejs";
export const maxDuration = 120;

// Posting `multipart/form-data` with field "audio". Returns { text }.
// When AI_GATEWAY_API_KEY is missing we return an empty string and the
// client falls back to its `text` answer (or browser SpeechRecognition).
export async function POST(req: Request) {
  if (!HAS_GATEWAY) {
    return NextResponse.json({ text: "", source: "mock" });
  }
  try {
    const form = await req.formData();
    const file = form.get("audio");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "missing_audio" }, { status: 400 });
    }

    // OpenAI Whisper via Vercel AI Gateway. We POST directly to the gateway
    // since the AI SDK helpers focus on text/structured output today.
    const upstream = new FormData();
    upstream.append("file", file, "audio.webm");
    upstream.append("model", "whisper-1");
    upstream.append("response_format", "json");

    const res = await fetch("https://gateway.ai.vercel.app/openai/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      },
      body: upstream,
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("[ai/transcribe] upstream error:", res.status, detail);
      return NextResponse.json({ text: "", source: "error" });
    }
    const data = (await res.json()) as { text?: string };
    return NextResponse.json({ text: data.text ?? "", source: "ai" });
  } catch (err) {
    console.error("[ai/transcribe] failed:", err);
    return NextResponse.json({ text: "", source: "error" });
  }
}
