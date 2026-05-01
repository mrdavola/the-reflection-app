import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";
const GOOGLE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

export async function POST(req: Request) {
  const { text, voice = "Aoede" } = (await req.json()) as { text: string; voice?: string };
  if (!text) return new NextResponse("missing text", { status: 400 });

  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!gatewayKey && !googleKey) return new NextResponse("no AI key configured", { status: 503 });

  const url = gatewayKey ? GATEWAY_URL : `${GOOGLE_URL}?key=${googleKey}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (gatewayKey) headers.Authorization = `Bearer ${gatewayKey}`;

  const payload = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  };

  const upstream = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!upstream.ok) {
    const err = await upstream.text();
    return new NextResponse(err, { status: upstream.status });
  }

  const data = (await upstream.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string } }> } }>;
  };
  const base64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64) return new NextResponse("no audio in response", { status: 502 });

  const wav = pcmToWav(base64, 24000);
  return new NextResponse(wav, {
    headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" },
  });
}

function pcmToWav(base64: string, sampleRate: number): ArrayBuffer {
  const binary = Buffer.from(base64, "base64");
  const buffer = new ArrayBuffer(44 + binary.length);
  const view = new DataView(buffer);

  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + binary.length, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, binary.length, true);

  new Uint8Array(buffer, 44).set(binary);
  return buffer;
}
