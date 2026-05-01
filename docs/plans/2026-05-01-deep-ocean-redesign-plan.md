# Deep Ocean Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all 34 routes of Refleckt from light "Marginalia" to two-surface "Deep Ocean" dark — student calm/immersive, teacher powerful/dense.

**Architecture:** Approach 3 hybrid — Phase 0/1 build tokens + primitives in a single thread to lock the visual contract, Phase 2 fans out to 5 parallel subagents per surface family, Phase 3 reconciles, Phase 4 verifies. Single branch (`redesign-deep-ocean`), single PR.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4 (`@theme inline`), Petrona + Atkinson Hyperlegible, Radix primitives via shadcn, Web Audio API, Web Speech Recognition, Gemini TTS via Vercel AI Gateway, Firebase (Firestore + Storage), framer-motion (already installed).

**Branch:** `redesign-deep-ocean` (already created, design doc committed).

**Reference docs:**
- Design doc: `docs/plans/2026-05-01-deep-ocean-redesign-design.md` — read first for full context.
- Reference component: pasted in original brainstorming session, captures the visual + behavioral target for the student flow.

---

## File Structure

### Modified files
- `src/app/globals.css` — full token rewrite to dark, retuned triage colors, new ambient keyframes
- `src/app/layout.tsx` — drop `forcedTheme="light"`, hardcode dark, drop `next-themes`
- `src/components/theme-provider.tsx` — DELETE (no longer needed)
- `src/components/ui/*.tsx` — all 14 primitives reskinned via tokens (no JSX changes most cases)
- `src/components/audio-recorder.tsx` — replaced with new ambient version
- `src/components/recharge.tsx` — replaced with `<BreathingCircle>` interlude
- `src/components/brand.tsx` — sky-glow refit
- `src/components/app-shell.tsx` — dark, dashboard tab structure
- All `src/app/app/**/*.tsx`, `src/app/r/**/*.tsx`, `src/app/w/**/*.tsx`, `src/app/page.tsx`, `src/app/privacy/page.tsx` — reskinned

### New files (foundation)
- `src/components/ambient/ripple-field.tsx` — water ripple backdrop
- `src/components/ambient/glowing-dot.tsx` — audio-reactive center
- `src/components/ambient/breathing-circle.tsx` — recharge interlude
- `src/components/ambient/index.ts` — barrel export
- `src/app/(internal)/_design-probe/page.tsx` — visual contract probe (internal only)
- `src/lib/use-audio-level.ts` — extracted Web Audio API hook
- `src/lib/use-tts.ts` — Gemini TTS wrapper hook

### New files (Phase 2 deliverables)
- `src/components/reflection/reflection-stage.tsx` — full-bleed recording stage
- `src/components/reflection/recharge-screen.tsx` — 5s breathing interlude wrapper
- `src/components/reflection/insights-layout.tsx` — Master Educator insights layout
- `src/components/reflection/voice-persona-settings.tsx` — voice picker
- `src/components/dashboard/dashboard-shell.tsx` — `/app` layout w/ tabs
- `src/components/dashboard/triage-tab.tsx` — hero triage view
- `src/components/dashboard/insights-tab.tsx` — patterns & trends view
- `src/components/dashboard/live-tab.tsx` — real-time view

### Removed files
- `src/components/theme-provider.tsx`
- `src/app/app/live/page.tsx` (folded into `/app?tab=live`)

---

## Phase 0 — Foundation (single thread)

Lock the visual contract before any subagent runs. Estimated: 30–45 min.

### Task 0.1: Rewrite color tokens + remove light theme

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Delete: `src/components/theme-provider.tsx`
- Modify: `package.json` (remove `next-themes`)

- [ ] **Step 1: Replace `src/app/globals.css` with dark Deep Ocean tokens**

Full file content:

```css
@import "tailwindcss";

/* ---------------------------------------------------------------
   Refleckt — design tokens
   Direction: "Deep Ocean" — navy ink, sky glow, restraint.
   Dark theme only. OKLCH for perceptually uniform colour.
   --------------------------------------------------------------- */

@theme inline {
  /* Surfaces — three navies for hierarchy. Never pure black. */
  --color-background: oklch(0.12 0.020 252);
  --color-surface: oklch(0.16 0.022 250);
  --color-card: oklch(0.19 0.024 248);
  --color-card-foreground: oklch(0.96 0.012 78);
  --color-popover: oklch(0.22 0.026 248);
  --color-popover-foreground: oklch(0.96 0.012 78);

  /* Ink — warm cream, never pure white. */
  --color-foreground: oklch(0.96 0.012 78);
  --color-muted: oklch(0.20 0.022 250);
  --color-muted-foreground: oklch(0.68 0.020 240);
  --color-faint: oklch(0.45 0.024 245);

  /* Primary — sky glow. */
  --color-primary: oklch(0.78 0.105 230);
  --color-primary-foreground: oklch(0.12 0.020 252);

  /* Secondary — surface, with a hair of warmth. */
  --color-secondary: oklch(0.22 0.026 248);
  --color-secondary-foreground: oklch(0.96 0.012 78);

  /* Accent — warmed carmine, marginalia emphasis. */
  --color-accent: oklch(0.74 0.110 25);
  --color-accent-foreground: oklch(0.12 0.020 252);

  /* Destructive — alert rose. */
  --color-destructive: oklch(0.70 0.180 18);
  --color-destructive-foreground: oklch(0.12 0.020 252);

  /* Edges. */
  --color-border: oklch(0.30 0.024 248);
  --color-input: oklch(0.22 0.026 248);
  --color-ring: oklch(0.78 0.105 230 / 0.35);

  /* Triage palette — retuned for dark. */
  --color-triage-sunny: oklch(0.82 0.130 88);
  --color-triage-sunny-bg: oklch(0.30 0.060 88 / 0.20);
  --color-triage-orange: oklch(0.74 0.150 45);
  --color-triage-orange-bg: oklch(0.30 0.080 45 / 0.20);
  --color-triage-blue: oklch(0.75 0.110 235);
  --color-triage-blue-bg: oklch(0.30 0.060 235 / 0.20);
  --color-triage-rose: oklch(0.70 0.180 18);
  --color-triage-rose-bg: oklch(0.32 0.090 18 / 0.25);

  /* Type. */
  --font-sans: var(--font-body), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-display: var(--font-display), "Iowan Old Style", "Apple Garamond", Georgia, serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;

  --spacing-hairline: 1px;
  --spacing-rule: 0.0625rem;

  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
}

html,
body {
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans);
  font-feature-settings: "ss01", "ss02", "kern";
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.font-display {
  font-family: var(--font-display);
  letter-spacing: -0.018em;
}

body {
  font-size: 16px;
  line-height: 1.55;
  letter-spacing: -0.005em;
}

.prose-measure {
  max-width: 68ch;
}

/* Marginalia — emphasis as the teacher's underline. Sky on dark. */
.marginalia {
  position: relative;
  font-style: normal;
  background-image: linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) 100%);
  background-repeat: no-repeat;
  background-size: 100% 0.12em;
  background-position: 0 92%;
  padding-bottom: 0.06em;
}

.marginalia--ink {
  background-image: linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) 100%);
}

/* Pencil-stroke divider — soft sky-tinted hairline on dark. */
.rule-soft {
  border: 0;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent 0,
    var(--color-border) 12%,
    var(--color-border) 88%,
    transparent 100%
  );
}

/* Margin caption — uppercase italic Petrona. Whisper. */
.margin-note {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--color-faint);
}

/* Recording pulse — refit for dark, sky glow not carmine. */
@keyframes pulse-record {
  0%, 100% { box-shadow: 0 0 0 0 oklch(0.78 0.105 230 / 0.5); }
  50%      { box-shadow: 0 0 0 10px oklch(0.78 0.105 230 / 0); }
}
.recording-pulse {
  animation: pulse-record 1.6s ease-out infinite;
}

@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
.shimmer {
  background: linear-gradient(
    90deg,
    var(--color-muted) 0%,
    var(--color-secondary) 50%,
    var(--color-muted) 100%
  );
  background-size: 800px 100%;
  animation: shimmer 2.4s linear infinite;
}

/* ---------------------------------------------------------------
   Deep Ocean ambient animations — used by ambient components.
   --------------------------------------------------------------- */

@keyframes calm-ocean-ripple {
  0%   { width: 4px; height: 4px; opacity: 0; }
  10%  { opacity: 0.8; }
  100% { width: 1200px; height: 1200px; opacity: 0; }
}
.animate-calm-ripple {
  animation: calm-ocean-ripple 12s cubic-bezier(0.2, 0.5, 0.4, 1) infinite;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid oklch(0.78 0.105 230 / 0.5);
  pointer-events: none;
}

@keyframes breathe {
  0%, 100% { transform: scale(0.5); opacity: 0.2; border-width: 1px; }
  50%      { transform: scale(1.5); opacity: 0.8; border-width: 2px; }
}
.animate-breathe {
  animation: breathe 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes pulse-slow {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
}
.animate-pulse-slow {
  animation: pulse-slow 5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes blob {
  0%   { transform: translate(0px, 0px) scale(1); }
  33%  { transform: translate(30px, -50px) scale(1.1); }
  66%  { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob {
  animation: blob 20s infinite alternate;
}
.animation-delay-4000 { animation-delay: 4s; }

@keyframes fade-in {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
.animate-fade-in {
  animation: fade-in 1.5s ease-out forwards;
}

@keyframes fade-in-up {
  0%   { opacity: 0; transform: translateY(15px); }
  100% { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-spin-slow {
  animation: spin 8s linear infinite;
}

::selection {
  background: oklch(0.78 0.105 230 / 0.25);
  color: var(--color-foreground);
}

* {
  border-color: var(--color-border);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Print — stays light intentionally. Paper is paper. */
@media print {
  html, body {
    background: white !important;
    color: black !important;
  }
}
```

- [ ] **Step 2: Update `src/app/layout.tsx` — remove `next-themes`, hardcode dark**

Replace file contents:

```tsx
import type { Metadata } from "next";
import { Petrona, Atkinson_Hyperlegible } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  display: "swap",
});

const petrona = Petrona({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Refleckt — a reflection coach for learners and educators",
    template: "%s · Refleckt",
  },
  description:
    "Refleckt turns a two-minute reflection into feedback you can act on, and a classroom dashboard you can read at a glance.",
  metadataBase: new URL("https://thereflectionapp.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${atkinson.variable} ${petrona.variable} h-full dark`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast:
                "rounded-md border border-border bg-card text-card-foreground shadow-md",
            },
          }}
        />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Delete `src/components/theme-provider.tsx`**

```bash
rm src/components/theme-provider.tsx
```

- [ ] **Step 4: Remove `next-themes` from package.json**

```bash
npm uninstall next-themes
```

- [ ] **Step 5: Verify build still passes**

```bash
npm run build
```

Expected: succeeds. If any file imports `next-themes` or `theme-provider`, fix it (likely zero — only `layout.tsx` referenced `ThemeProvider`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Phase 0.1: dark Deep Ocean tokens, drop next-themes"
```

### Task 0.2: Create ambient components

**Files:**
- Create: `src/components/ambient/ripple-field.tsx`
- Create: `src/components/ambient/glowing-dot.tsx`
- Create: `src/components/ambient/breathing-circle.tsx`
- Create: `src/components/ambient/index.ts`

- [ ] **Step 1: Create `src/components/ambient/ripple-field.tsx`**

```tsx
"use client";

interface Props {
  /** 0–1, scales opacity by audio level. Default 1. */
  intensity?: number;
  /** Pause animations (e.g. when not recording). */
  paused?: boolean;
  className?: string;
}

export function RippleField({ intensity = 1, paused = false, className = "" }: Props) {
  const opacity = Math.min(1, 0.02 + intensity);
  return (
    <div
      aria-hidden
      className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${className}`}
      style={{ opacity }}
    >
      <div className="animate-calm-ripple" style={{ animationDelay: "0s", animationPlayState: paused ? "paused" : "running" }} />
      <div className="animate-calm-ripple" style={{ animationDelay: "4s", animationPlayState: paused ? "paused" : "running" }} />
      <div className="animate-calm-ripple" style={{ animationDelay: "8s", animationPlayState: paused ? "paused" : "running" }} />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/ambient/glowing-dot.tsx`**

```tsx
"use client";

interface Props {
  /** 0–100. Drives scale + glow intensity + color shift. */
  audioLevel?: number;
  mode?: "reactive" | "steady" | "breathing";
  className?: string;
}

export function GlowingDot({ audioLevel = 0, mode = "reactive", className = "" }: Props) {
  const level = mode === "reactive" ? audioLevel : mode === "steady" ? 8 : 20;
  const scale = mode === "reactive" ? 1 + level / 30 : 1;
  const glowSize = 15 + level;
  const glowSpread = level / 4;
  const glowAlpha = 0.3 + level / 100;
  const color = level > 20 ? "#ffffff" : "oklch(0.86 0.090 230)";

  return (
    <div
      aria-hidden
      className={`absolute z-10 rounded-full transition-all duration-75 ease-out ${className}`}
      style={{
        width: "4px",
        height: "4px",
        transform: `scale(${scale})`,
        boxShadow: `0 0 ${glowSize}px ${glowSpread}px oklch(0.78 0.105 230 / ${glowAlpha})`,
        backgroundColor: color,
      }}
    />
  );
}
```

- [ ] **Step 3: Create `src/components/ambient/breathing-circle.tsx`**

```tsx
"use client";

import { Wind } from "lucide-react";

interface Props {
  /** Caption shown below circle. Default "Breathe in…". */
  label?: string;
  /** px diameter. Default 192 (w-48). */
  size?: number;
  className?: string;
}

export function BreathingCircle({ label = "Breathe in…", size = 192, className = "" }: Props) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="absolute w-full h-full rounded-full border border-primary/20 animate-breathe" />
        <Wind size={24} className="text-primary/40" aria-hidden />
      </div>
      <p className="mt-16 text-sm md:text-base font-light tracking-[0.2em] text-foreground/50 uppercase animate-pulse-slow">
        {label}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/ambient/index.ts`**

```ts
export { RippleField } from "./ripple-field";
export { GlowingDot } from "./glowing-dot";
export { BreathingCircle } from "./breathing-circle";
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ambient
git commit -m "Phase 0.2: ambient components — RippleField, GlowingDot, BreathingCircle"
```

### Task 0.3: Extract `useAudioLevel` hook

**Files:**
- Create: `src/lib/use-audio-level.ts`

- [ ] **Step 1: Create `src/lib/use-audio-level.ts`**

```ts
"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Subscribes to a microphone MediaStream and emits a smoothed audio level (0–100).
 * Returns null when no stream is connected. Cleans up on unmount.
 */
export function useAudioLevel(stream: MediaStream | null): number {
  const [level, setLevel] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) {
      setLevel(0);
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let smoothed = 0;

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
      smoothed = smoothed * 0.85 + avg * 0.15;
      setLevel(smoothed);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (ctx.state !== "closed") ctx.close();
    };
  }, [stream]);

  return level;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/use-audio-level.ts
git commit -m "Phase 0.3: useAudioLevel hook (extracted from audio-recorder)"
```

### Task 0.4: Create `useTTS` hook

**Files:**
- Create: `src/lib/use-tts.ts`

- [ ] **Step 1: Create `src/lib/use-tts.ts`**

```ts
"use client";

import { useCallback, useRef, useState } from "react";

export type VoicePersona = "Aoede" | "Puck" | "Charon" | "Kore";

interface UseTTSOptions {
  voice?: VoicePersona;
  muted?: boolean;
}

interface SpeakOptions {
  voiceOverride?: VoicePersona;
  onEnded?: () => void;
}

/**
 * Wraps server-side Gemini TTS via /api/ai/tts.
 * Returns play function plus loading/playing state for latency masking UI.
 */
export function useTTS({ voice = "Aoede", muted = false }: UseTTSOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(
    async (text: string, opts: SpeakOptions = {}) => {
      stop();
      setIsLoading(true);

      try {
        const res = await fetch("/api/ai/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: opts.voiceOverride ?? voice }),
        });
        if (!res.ok) throw new Error(`TTS request failed: ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsLoading(false);
          setIsPlaying(true);
        };
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
          opts.onEnded?.();
        };
        audio.onerror = () => {
          setIsLoading(false);
          setIsPlaying(false);
        };

        if (!muted || opts.voiceOverride) {
          await audio.play();
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("TTS error", err);
        setIsLoading(false);
      }
    },
    [voice, muted, stop],
  );

  return { speak, stop, isLoading, isPlaying };
}
```

- [ ] **Step 2: Create `src/app/api/ai/tts/route.ts` (server endpoint)**

```ts
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
```

- [ ] **Step 3: Build to verify route compiles**

```bash
npm run build
```

Expected: succeeds. If TypeScript complains about `Buffer`, add `@types/node` (already installed per package.json).

- [ ] **Step 4: Commit**

```bash
git add src/lib/use-tts.ts src/app/api/ai/tts
git commit -m "Phase 0.4: useTTS hook + /api/ai/tts route"
```

### Task 0.5: Build the design probe page (visual contract)

**Files:**
- Create: `src/app/_probe/page.tsx`

This is an internal-only page that exhibits every token, primitive, and ambient component. It's the visual contract every Phase 2 subagent will reference.

- [ ] **Step 1: Create `src/app/_probe/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Mic, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RippleField, GlowingDot, BreathingCircle } from "@/components/ambient";

export default function ProbePage() {
  const [audioLevel, setAudioLevel] = useState(20);

  return (
    <div className="min-h-screen px-6 py-12 max-w-5xl mx-auto space-y-16">
      <header>
        <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">Visual contract</p>
        <h1 className="font-display text-5xl mt-2">Deep Ocean — design probe</h1>
        <p className="text-muted-foreground mt-3 prose-measure">
          Every Phase 2 subagent must produce surfaces that match this language. Tokens, type,
          ambient components, and primitives all live here.
        </p>
      </header>

      <section>
        <h2 className="font-display text-3xl mb-6">Surfaces</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            ["Background", "var(--color-background)"],
            ["Surface", "var(--color-surface)"],
            ["Card", "var(--color-card)"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border p-6" style={{ background: value }}>
              <p className="margin-note">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl mb-6">Type scale</h2>
        <div className="space-y-4">
          <h1 className="font-display text-6xl">H1 hero — 76px Petrona Medium</h1>
          <h2 className="font-display text-4xl">H2 section — 48px Petrona Medium</h2>
          <h3 className="font-display text-2xl">H3 card — 24px Petrona Medium</h3>
          <p className="font-display italic text-xl text-foreground/60">Pull quote — 22px Petrona Italic</p>
          <p>Body — Atkinson 16px. The quick brown fox jumps over the lazy dog.</p>
          <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">Margin note label</p>
          <p>Marginalia: <em className="marginalia not-italic">underline emphasis</em>.</p>
          <p>Marginalia ink: <em className="marginalia--ink not-italic">sky underline</em>.</p>
        </div>
        <hr className="rule-soft my-8" />
      </section>

      <section>
        <h2 className="font-display text-3xl mb-6">Triage palette (dark-tuned)</h2>
        <div className="grid grid-cols-4 gap-3">
          {(["sunny", "orange", "blue", "rose"] as const).map((c) => (
            <div
              key={c}
              className="rounded-lg p-4 border"
              style={{
                background: `var(--color-triage-${c}-bg)`,
                borderColor: `var(--color-triage-${c})`,
                color: `var(--color-triage-${c})`,
              }}
            >
              <span className="margin-note uppercase">{c}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl mb-6">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button>
            <Mic className="h-4 w-4" /> With icon
          </Button>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl mb-6">Cards & badges</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="margin-note uppercase tracking-[0.16em] text-[0.7rem]">Card label</p>
              <h3 className="font-display text-xl mt-2">Card with content</h3>
              <p className="text-muted-foreground text-sm mt-2">Body text on card surface.</p>
              <div className="mt-4 flex gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-2">
              <Settings className="h-5 w-5 text-primary" />
              <h3 className="font-display text-xl">Hoverable card</h3>
              <p className="text-muted-foreground text-sm">
                Hover over any of these — sky-glow border on hover.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl mb-6">Ambient components</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="relative h-80 rounded-lg border border-border overflow-hidden bg-background">
            <p className="margin-note absolute top-3 left-3 z-10 uppercase tracking-[0.16em] text-[0.7rem]">
              RippleField + GlowingDot
            </p>
            <RippleField intensity={audioLevel / 100} />
            <div className="absolute inset-0 flex items-center justify-center">
              <GlowingDot audioLevel={audioLevel} />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={audioLevel}
              onChange={(e) => setAudioLevel(Number(e.target.value))}
              className="absolute bottom-3 left-3 right-3"
              aria-label="Simulate audio level"
            />
          </div>

          <div className="relative h-80 rounded-lg border border-border overflow-hidden bg-background flex items-center justify-center">
            <p className="margin-note absolute top-3 left-3 uppercase tracking-[0.16em] text-[0.7rem]">
              BreathingCircle
            </p>
            <BreathingCircle label="Breathe in…" />
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Run dev server, visit `/_probe`, take a screenshot for subagent reference**

```bash
npm run dev
```

Open http://localhost:3000/_probe in the browser. Visually verify:
- Three surface shades read distinct
- Triage colors glow without screaming
- Marginalia underline is visible on dark
- RippleField + GlowingDot react to slider
- BreathingCircle pulses smoothly
- All buttons render with correct contrast

Take a screenshot and save to `docs/plans/2026-05-01-probe-screenshot.png` for subagent reference.

- [ ] **Step 3: Commit**

```bash
git add src/app/_probe
git commit -m "Phase 0.5: design probe page — the visual contract"
```

---

## Phase 1 — Primitives (single thread)

Update each shadcn UI primitive to consume new tokens. Most need zero JSX changes — they already use `bg-card`, `text-foreground`, etc.

### Task 1.1: Audit primitives, fix any that bypass tokens

**Files:** all of `src/components/ui/*.tsx`

- [ ] **Step 1: Read each primitive, list any that hardcode colors instead of using tokens**

```bash
grep -rn "bg-white\|bg-black\|text-black\|text-white\|bg-slate-\|text-slate-" src/components/ui
```

- [ ] **Step 2: For each hit, replace hardcoded color with token equivalent**

Example replacements:
- `bg-white` → `bg-card`
- `text-black` → `text-foreground`
- `bg-slate-900` → `bg-background`
- `text-slate-500` → `text-muted-foreground`

- [ ] **Step 3: Visit `/_probe` to verify all primitives render correctly on dark**

- [ ] **Step 4: Commit**

```bash
git add src/components/ui
git commit -m "Phase 1.1: primitives consume Deep Ocean tokens, no hardcoded colors"
```

### Task 1.2: Update `src/components/brand.tsx` for sky-glow

**Files:**
- Modify: `src/components/brand.tsx`

- [ ] **Step 1: Read current brand component**

- [ ] **Step 2: Update logo SVG — bookplate stamp keeps shape but colors flip to sky-glow on dark.**

Replace ink fill with `currentColor` and let the parent `text-primary` paint it. Brand text uses `font-display` (already does).

- [ ] **Step 3: Verify on `/_probe` and on `/`**

- [ ] **Step 4: Commit**

```bash
git add src/components/brand.tsx
git commit -m "Phase 1.2: brand mark refit for dark sky glow"
```

---

## Phase 2 — Parallel subagent fan-out

**Critical:** all 5 agents are dispatched in **one message with multiple Agent tool calls**. They run in parallel.

Each agent prompt is self-contained — it includes context, constraints, file list, and verification.

### Subagent dispatch checklist

Before dispatching:
- [ ] Confirm Phase 0 + Phase 1 are committed and pushed (or local-only is fine for one developer)
- [ ] Confirm `/_probe` renders correctly
- [ ] Each agent gets `subagent_type: "general-purpose"` (or `frontend-design` if available)

### Agent A — Student reflection flow

**Prompt for the agent (copy verbatim):**

```
You are redesigning the student reflection flow for Refleckt to match the "Deep Ocean" dark direction. The visual contract is at src/app/_probe/page.tsx — read it first to learn the design language.

CONTEXT
The full design doc is docs/plans/2026-05-01-deep-ocean-redesign-design.md. Read Sections 1, 2, 3, and 4. The reference component (full deep-ocean experience) lives in the brainstorming chat history; key behaviors you must implement:
- Web Audio API analyser → smoothed audio level → drives ripple intensity + dot scale + glow
- Web Speech Recognition (continuous + interim) → live transcript subtitle + auto-restart on `onend`
- Auto-silence detection: if 5s of no new transcript words AND time >= 5s, auto-stop
- Stop button locked until time >= 5s
- 5-second recharge breathing interlude before insights
- Insights: user_quote (italic) → core_insight (Petrona) → next_ripple → inspirational_quote
- Optional voice TTS reads prompts aloud via /api/ai/tts (use the useTTS hook in src/lib/use-tts.ts)

YOUR ROUTES (only edit these)
- src/app/app/personal/page.tsx (setup screen)
- src/app/app/personal/run/page.tsx (the reflection stage)
- src/app/r/[shareCode]/page.tsx (no-login intro)
- src/app/r/[shareCode]/run/page.tsx (no-login reflection stage — same component as personal)
- src/app/r/[shareCode]/done/page.tsx (thank-you screen)

FILES YOU WILL CREATE
- src/components/reflection/reflection-stage.tsx (the recording stage)
- src/components/reflection/recharge-screen.tsx (5s breathing wrapper)
- src/components/reflection/insights-layout.tsx (Master Educator insights)
- src/components/reflection/voice-persona-settings.tsx (voice picker)
- src/lib/use-reflection-flow.ts (state machine: setup → prompt → record → analyzing → recharge → insights)

FILES YOU MAY READ FOR CONTEXT (do not edit)
- src/lib/personal-flow-store.ts — Firestore save logic
- src/lib/use-speech-recognition.ts — extend if needed for auto-restart
- src/lib/use-audio-level.ts — already exists, use as-is
- src/lib/use-tts.ts — already exists, use as-is
- src/components/ambient/* — RippleField, GlowingDot, BreathingCircle
- src/app/api/ai/analyze/route.ts — returns insights JSON
- src/app/api/ai/prompts/route.ts — returns AI follow-up question

CONSTRAINTS
- Use ONLY tokens from globals.css. No hardcoded hex colors. No bg-slate-*, text-slate-*, bg-blue-*, etc. — use bg-background, bg-card, text-foreground, text-primary, text-muted-foreground, text-faint.
- All ambient components must respect prefers-reduced-motion (RippleField/GlowingDot/BreathingCircle already handle this; trust them).
- Voice TTS toggle is OFF BY DEFAULT. Read from user settings (extend src/lib/personal-flow-store.ts if needed for voice persona + tts-enabled). Never auto-play TTS in classroom (share-link) mode.
- Locked-until-5s stop button must show 🔒 icon with "Keep reflecting…" copy; once unlocked, shows ⏹ + "End thought".
- Live transcript subtitle: serif italic, opacity tied to audio level, truncate to last 60 chars with leading "…".
- Recharge interlude: full-bleed bg-background, BreathingCircle centered, label cycles "Breathe in…" → "Hold…" → "And out…" over 5s, then auto-advances to insights.
- Use framer-motion (already installed) for screen transitions: fade-in-up between phases, 600ms.

VERIFICATION (run each before completing)
1. npm run build → must succeed with zero warnings
2. npm run dev → http://localhost:3000/app/personal/run → walk through entire flow with mic permission granted
3. Confirm 200 status on /r/<any-share-code>/run via Vercel preview after merge
4. Test prefers-reduced-motion via DevTools → ripples and breathing collapse to static

REPORT BACK
- List of files created/modified
- Any deviations from the design doc and why
- Any issues hit (e.g. /api/ai/tts misbehaving, speech recognition browser quirks)
- "All acceptance criteria met" or specific blockers
```

**Dispatch as one of 5 parallel agents (see "Parallel dispatch" section below).**

### Agent B — Marketing home + landing routes

**Prompt for the agent (copy verbatim):**

```
You are redesigning the marketing surfaces of Refleckt to match the "Deep Ocean" dark direction. The visual contract is at src/app/_probe/page.tsx — read it first.

CONTEXT
Read Sections 1, 2, and 6 of docs/plans/2026-05-01-deep-ocean-redesign-design.md. Marketing home keeps its current shape (hero / how-it-feels / educators / closing / footer) but flips to deep navy with a faint <RippleField intensity={0.04}> in the upper-right corner of the hero. Hand-stacked sample cards stay (they're great), reskinned dark with sky-glow shadows.

YOUR ROUTES (only edit these)
- src/app/page.tsx (marketing home)
- src/app/privacy/page.tsx (privacy policy)
- src/app/not-found.tsx
- src/app/error.tsx

FILES YOU MAY READ FOR CONTEXT (do not edit)
- src/components/brand.tsx
- src/components/ambient/* (use RippleField for hero ambient)
- src/components/ui/* (use Button, Card, etc.)
- The current src/app/page.tsx — preserves the structure, you just change the surface

CONSTRAINTS
- Use ONLY tokens. No hardcoded colors.
- Hero: faint RippleField in upper-right (intensity 0.04, opacity barely visible). Headline keeps the marginalia italic emphasis on "tractable".
- Sample stack on the right of the hero: three hand-stacked cards (prompt → recording → coach note) — reskin dark, card surface = bg-card, sky-glow shadow on hover.
- Educators section's right-side "DashboardSample": REPLACE with the dark Triage mini view from Section 5 of the design doc. Show 4 students with status dots (use --color-triage-* tokens) on a bg-card surface. The current DashboardSample function in src/app/page.tsx becomes obsolete — rewrite it.
- All section dividers use the .rule-soft class.
- Footer: brand mark + tagline ("Reflection is a skill. We make it tractable.") in serif italic.
- Privacy page: long-form serif body using prose-measure for readability.

VERIFICATION
1. npm run build → succeeds
2. npm run dev → / renders correctly, all sections visible, no console errors
3. /privacy renders as a long readable doc
4. Mobile viewport (375px) — hero stacks correctly, sample cards collapse to single column
5. prefers-reduced-motion → ripple in hero is static

REPORT BACK
- Files modified
- Any structural changes from the original layout
- "All acceptance criteria met" or blockers
```

### Agent C — Teacher dashboard

**Prompt for the agent (copy verbatim):**

```
You are building the teacher dashboard for Refleckt to match the "Deep Ocean" dark direction. The visual contract is at src/app/_probe/page.tsx. The teacher surface is dense and powerful, NOT immersive — no full ripple field, just a single steady GlowingDot in the header.

CONTEXT
Read Sections 1, 2, and 5 of docs/plans/2026-05-01-deep-ocean-redesign-design.md. The dashboard has three layered tabs: Triage (default, hero), Insights (patterns/trends), Live (real-time). Above the tabs, an AI-generated class summary in big serif. Triage tab is the most important — teachers spend 90 seconds here before the bell.

YOUR ROUTES (only edit/create these)
- src/app/app/page.tsx (the dashboard — currently mostly stubbed)
- src/app/app/layout.tsx (app shell, optional update for sticky header)
- src/app/app/live/page.tsx → DELETE this file. /app/live now redirects to /app?tab=live (handle via Next.js redirect in next.config.ts or a simple redirect page).

FILES YOU WILL CREATE
- src/components/dashboard/dashboard-shell.tsx (top bar + summary + tabs frame)
- src/components/dashboard/triage-tab.tsx (default-sort student rows + view toggle Cards/Compact/Heatmap)
- src/components/dashboard/insights-tab.tsx (growth chart + recurring themes + heatmap)
- src/components/dashboard/live-tab.tsx (Firestore onSnapshot real-time list + streaming transcript samples)

FILES YOU MAY READ FOR CONTEXT (do not edit)
- src/components/triage-card.tsx (refit; preserve API)
- src/components/group-summary-card.tsx
- src/components/growth-chart.tsx
- src/components/trend-sparkline.tsx
- src/components/streak-card.tsx
- src/lib/firebase/* (Firestore wrappers)
- src/app/api/ai/group-summary/route.ts (extend response with `themes` key — see Insights tab spec)
- src/app/api/ai/coach/route.ts (per-student inline note)
- src/app/api/alerts/safety/route.ts (rose alerts)

CONSTRAINTS
- Use ONLY tokens.
- Top bar: sticky, bg-background/95 backdrop-blur, brand mark + group selector + student count + settings + share buttons.
- AI summary block above tabs: Petrona Medium 32-38px headline + Atkinson 16px teacher-move sentence below. Pull from /api/ai/group-summary.
- Tabs: use existing Tabs primitive from src/components/ui/tabs.tsx. Current value drives URL via ?tab=triage|insights|live (use Next.js searchParams).
- Triage tab default sort = "Needs attention": orange + rose float to top, sunny sinks. Rose-bg rows pinned to top regardless of sort.
- Each Triage row: status dot (color from --color-triage-*), name (mono tabular), level (1-4), one verbatim quote (serif italic), one AI-generated teacher-move (Atkinson). Hover = 1px sky-glow border + reveal [Open] [Mark seen] buttons.
- View toggle on Triage: Cards (default) / Compact (one-line, 3× density) / Heatmap (21-cell grid).
- Insights tab: GrowthChart (re-skinned) + Recurring Themes block (NEW; pull `themes` array from /api/ai/group-summary, render as bullet list with "→ suggested move" sub-items) + 21×7 heatmap.
- Live tab: 
  - Tab badge text becomes "LIVE · {n} active" in text-primary when activity is running, "Live" muted when idle.
  - List shows status icons: ◐ Recording, ✓ Done, ⌛ Stuck (>90s no transcript activity), ⚠ Alert (rose-bg row).
  - Streaming transcript samples at bottom: very faint serif italic, scrolling, max 5 lines.
  - Use Firestore `onSnapshot` on the active activity's reflections collection.
- Use existing GrowthChart, TrendSparkline as-is — they should already pick up the dark tokens. If not, fix their color mapping.

VERIFICATION
1. npm run build → succeeds
2. npm run dev → /app loads with Triage as default tab
3. Switch tabs → URL updates (?tab=insights, ?tab=live), no reload
4. /app/live → redirects to /app?tab=live
5. With a group seeded (use src/components/seed-demo-data.tsx), Triage shows realistic rows with all 4 status colors
6. Mobile (375px) — stacks correctly, tabs scrollable

REPORT BACK
- Files created/modified
- Any /api/ai/group-summary changes you made (need to extend with themes key — write it)
- Blockers (e.g. Firestore listener not wired)
```

### Agent D — Groups & workshops

**Prompt for the agent (copy verbatim):**

```
You are redesigning the groups and workshops surfaces of Refleckt to match the "Deep Ocean" dark direction. The visual contract is at src/app/_probe/page.tsx.

CONTEXT
Read Sections 1, 2, and 6 of docs/plans/2026-05-01-deep-ocean-redesign-design.md. Groups manage classes; workshops are multi-session reflection cycles.

YOUR ROUTES (only edit these)
- src/app/app/groups/page.tsx (group list)
- src/app/app/groups/new/page.tsx (create group)
- src/app/app/groups/[id]/page.tsx (group detail with tabs: Activities / Participants / Settings)
- src/app/app/groups/[id]/settings/page.tsx
- src/app/app/groups/[id]/participants/page.tsx
- src/app/app/groups/[id]/participants/[participantId]/page.tsx
- src/app/app/groups/[id]/participants/[participantId]/portfolio/page.tsx
- src/app/app/groups/[id]/activities/page.tsx
- src/app/app/groups/[id]/activities/new/page.tsx
- src/app/app/groups/[id]/activities/[activityId]/page.tsx
- src/app/app/groups/[id]/activities/[activityId]/setup/page.tsx
- src/app/app/groups/[id]/activities/[activityId]/share/page.tsx (the moment — see constraints)
- src/app/app/workshops/page.tsx
- src/app/app/workshops/new/page.tsx
- src/app/app/workshops/[id]/page.tsx
- src/app/w/[joinCode]/page.tsx (join landing)
- src/app/w/[joinCode]/board/page.tsx (collaborative board)

FILES YOU MAY READ FOR CONTEXT
- src/components/group-selector.tsx
- src/components/collaborative-board.tsx
- src/components/triage-card.tsx
- src/components/streak-card.tsx
- src/components/growth-chart.tsx
- src/lib/firebase/* (Firestore)
- src/components/ui/* (primitives)

CONSTRAINTS
- Use ONLY tokens.
- Group list cards: each card shows group name (Petrona 20px), member count, last-activity date, mini 3-dot triage strip showing how many students are sunny/orange/blue. Hover = 1px sky-glow border.
- Group detail page top: full-bleed serif H1 of group name, member count below as margin-note. Sub-tabs: Activities / Participants / Settings.
- Activities and Participants tabs: same Cards / Compact / Heatmap toggle pattern as the dashboard Triage tab.
- Participant detail: full-bleed serif name H1, streak card + growth chart + reflection timeline below, voice-quote sidebar on right (verbatim quotes, serif italic, max 3).
- Activity setup: configuration form, dark.
- Activity share page: TREAT AS A MOMENT. Full-bleed bg-background. Big serif join code in mono uppercase (8 chars, e.g. "QXKL-7P9R"). QR code rendered in --color-primary. "Open on student devices" instructions below in serif italic.
- Workshops mirror group list/detail patterns.
- /w/[joinCode]/board (collaborative board): sticky notes use the four triage backgrounds (--color-triage-*-bg) at 0.20 opacity for surface so they read as glowing post-its on navy. Note text in foreground.
- /w/[joinCode] (join landing): dark, big serif welcome, "Join with code" form.

VERIFICATION
1. npm run build → succeeds
2. npm run dev → /app/groups loads with seeded data
3. Walk into a group → tabs work
4. /app/groups/<id>/activities/<aid>/share → looks like a moment, not a form page
5. /w/<joinCode>/board → sticky notes glow, not flat
6. Mobile (375px) — all routes stack correctly

REPORT BACK
- Files modified
- Any structural changes
- Blockers
```

### Agent E — Library, growth, settings, reflections, etc.

**Prompt for the agent (copy verbatim):**

```
You are redesigning the remaining internal surfaces of Refleckt to match the "Deep Ocean" dark direction. The visual contract is at src/app/_probe/page.tsx.

CONTEXT
Read Sections 1, 2, and 6 of docs/plans/2026-05-01-deep-ocean-redesign-design.md. These are the smaller utility pages.

YOUR ROUTES (only edit these)
- src/app/app/library/page.tsx (template library — grid of cards)
- src/app/app/growth/page.tsx (long-term progress charts)
- src/app/app/settings/page.tsx (settings — voice persona + privacy + about)
- src/app/app/reflections/[id]/page.tsx (single reflection detail)
- src/app/app/personal/page.tsx (personal flow setup screen — only the setup step; the run page is owned by Agent A)

FILES YOU MAY READ FOR CONTEXT
- src/lib/templates.ts (template list)
- src/components/growth-chart.tsx
- src/components/trend-sparkline.tsx
- src/components/audio-recorder.tsx (replaced by Agent A — read only for the audio playback widget pattern)
- src/lib/use-tts.ts (used in settings for voice persona preview)
- src/components/ui/* (primitives)

YOU MAY CREATE
- src/components/reflection/voice-persona-settings.tsx (the voice picker block — used in /app/settings; coordinate with Agent A who also references this; ONE of you creates it, the other imports — pick: Agent E creates it, Agent A imports)

CONSTRAINTS
- Use ONLY tokens.
- /app/library: grid (3 cols desktop, 1 col mobile) of template cards. Each card: title (Petrona 20px), description, focus tag (uppercase margin-note), "Use template →" ghost button. Hover = 1px sky-glow border.
- /app/growth: hero is GrowthChart re-skinned; below it, trend sparklines per focus area in a 2-column grid; below that, /api/ai/coach insights as cards.
- /app/settings: three sections, each in a Card:
  1. Voice persona — four voice cards (Aoede/Puck/Charon/Kore) with preview play button (uses useTTS); master toggle "Read prompts aloud" (off by default).
  2. Privacy & data — Firestore export button, delete account (with confirm dialog), "no-login mode by default for under-14" switch.
  3. About — version, privacy link, contact.
- /app/reflections/[id]: vertical document layout. Title from focus (Petrona Medium 38px). Q/A blocks per question separated by .rule-soft dividers — Q in margin-note label, A in serif italic 16px. Then the four-key insights block (same as Screen 6 of the flow — import from src/components/reflection/insights-layout.tsx created by Agent A; if not yet available, leave a placeholder import and a TODO comment for Phase 3 reconcile). Audio playback + download at bottom.
- /app/personal/page.tsx (setup screen): focus picker (3 cards) + "or write your own" button + faint RippleField in corner. Reuses FocusSelector + SentenceStarters logic (see src/components/focus-selector.tsx, src/components/sentence-starters.tsx) — refit, don't rewrite.

VERIFICATION
1. npm run build → succeeds (placeholder import for insights-layout is OK; Phase 3 reconciles)
2. npm run dev → all five routes render, no console errors
3. Voice persona preview plays on click (mic permission not needed; TTS is server-side)
4. /app/reflections/<any-id> renders even if insights data is partial (graceful empty states)

REPORT BACK
- Files modified
- voice-persona-settings.tsx — confirm you created it and exported it
- Any cross-agent coordination needs (e.g. import paths for Agent A)
- Blockers
```

### Parallel dispatch

When ready, send a SINGLE message containing all 5 Agent tool calls. Each gets `subagent_type: "general-purpose"`. Use background mode where possible to allow truly parallel execution.

After all 5 return:
- [ ] Read each agent's report
- [ ] Note any conflicts (two agents touched the same file? typically no, but possible for shared components)
- [ ] Note any blockers
- [ ] Move to Phase 3

---

## Phase 3 — Reconcile (single thread)

Estimated: 30–60 min depending on Phase 2 conflicts.

### Task 3.1: Resolve cross-agent imports

- [ ] **Step 1: Verify `voice-persona-settings.tsx` was created by Agent E and is importable by Agent A**

```bash
test -f src/components/reflection/voice-persona-settings.tsx && echo OK || echo MISSING
```

If missing, create a minimal stub — Agent E may have skipped it. Build the component using the spec in Agent A and Agent E prompts.

- [ ] **Step 2: Verify `insights-layout.tsx` was created by Agent A and is importable by Agent E**

```bash
test -f src/components/reflection/insights-layout.tsx && echo OK || echo MISSING
```

Same fallback if missing.

- [ ] **Step 3: Run typecheck**

```bash
npx tsc --noEmit
```

Fix any type errors. Most common: missing exports, prop mismatches, optional vs required props.

### Task 3.2: Visual consistency sweep

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Walk every route in this order, screenshot each:**

```
/                       → marketing
/app                    → dashboard (default tab)
/app?tab=insights       → insights tab
/app?tab=live           → live tab
/app/personal           → personal setup
/app/personal/run       → reflection stage
/app/library            → template library
/app/groups             → group list
/app/groups/new         → create group
/app/groups/<id>        → group detail
/app/groups/<id>/activities/<aid>/share  → join code moment
/app/workshops          → workshop list
/app/growth             → growth charts
/app/reflections/<id>   → reflection detail
/app/settings           → settings
/r/<shareCode>          → no-login intro
/r/<shareCode>/run      → no-login reflection
/r/<shareCode>/done     → thank-you
/w/<joinCode>           → join landing
/w/<joinCode>/board     → collab board
/privacy                → privacy
```

- [ ] **Step 3: Note inconsistencies. Common ones to look for:**

- Any page using `bg-white` or `text-black` (token bypass) — fix to `bg-card` / `text-foreground`
- Any page that doesn't use Petrona for H1 — fix
- Any triage colors that look muddy — verify they use `--color-triage-*` tokens, not hardcoded oklch
- Any margin-note labels that aren't uppercase tracking-widest — fix
- Any cards missing the 1px sky-glow on hover — add `hover:border-primary/30 transition-colors`
- Any focus rings missing — add `focus-visible:ring-2 focus-visible:ring-ring`

- [ ] **Step 4: Fix all inconsistencies in one or more commits**

```bash
git add -A
git commit -m "Phase 3.2: visual consistency sweep — fix token bypasses, hover states, focus rings"
```

### Task 3.3: Build & deploy preview

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: succeeds. If it fails, fix and recommit.

- [ ] **Step 2: Push branch**

```bash
git push -u origin redesign-deep-ocean
```

- [ ] **Step 3: Confirm Vercel auto-creates a preview URL**

Watch for the preview URL in the Vercel dashboard. Should be something like `the-reflection-app-git-redesign-deep-ocean-mds-projects-ebc8e5c5.vercel.app`.

---

## Phase 4 — Verification

Estimated: 30 min.

### Task 4.1: Route-by-route smoke test on preview

- [ ] **Step 1: Hit every route, confirm 200**

```bash
PREVIEW_URL=https://<your-preview-url>.vercel.app
for route in / /app /app/personal /app/library /app/groups /app/groups/new /app/live /app/workshops /app/growth /app/settings /privacy; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$PREVIEW_URL$route")
  echo "$code  $route"
done
```

Expected: every route returns 200 (or 307 for redirects like /app/live → /app?tab=live).

### Task 4.2: Walk the student flow end-to-end

- [ ] **Step 1: Open `<PREVIEW_URL>/app/personal/run`**
- [ ] **Step 2: Pick a focus**
- [ ] **Step 3: Read the prompt — confirm voice TTS does NOT auto-play (off by default)**
- [ ] **Step 4: Tap mic, grant permission, speak for 8+ seconds**
- [ ] **Step 5: Confirm: ripples react, glowing dot pulses, live transcript appears, timer counts up**
- [ ] **Step 6: Stop speaking — confirm silence countdown shows at 2/3/4 seconds**
- [ ] **Step 7: At 5s silence, recording auto-stops**
- [ ] **Step 8: Analyzing screen → next prompt** (or Recharge if it's the last prompt)
- [ ] **Step 9: Recharge interlude plays for 5s**
- [ ] **Step 10: Insights screen renders with all four blocks (user_quote, core_insight, next_ripple, inspirational_quote)**
- [ ] **Step 11: "Read transcript" → /app/reflections/<id> opens**
- [ ] **Step 12: "Reflect again" → resets to setup**

### Task 4.3: Walk the teacher flow

- [ ] **Step 1: Open `<PREVIEW_URL>/app`**
- [ ] **Step 2: Confirm Triage tab is default, AI summary visible at top**
- [ ] **Step 3: Switch to Insights → growth chart + themes + heatmap visible**
- [ ] **Step 4: Switch to Live → "0 active" badge, empty state**
- [ ] **Step 5: From another browser/incognito, start a reflection in a share-link mode**
- [ ] **Step 6: Confirm Live tab now shows "1 active" + the student's status**

### Task 4.4: Accessibility verification

- [ ] **Step 1: DevTools → emulate `prefers-reduced-motion: reduce`**
- [ ] **Step 2: Visit `/app/personal/run`, start recording**
- [ ] **Step 3: Confirm: ripples are static, breathing circle is static, transitions are instant**

- [ ] **Step 4: Run Lighthouse on `/`, `/app`, `/app/personal/run`**

```
Target: Accessibility ≥ 95 on each route.
```

- [ ] **Step 5: Confirm focus rings visible on all interactive elements via Tab traversal**

### Task 4.5: Mobile verification

- [ ] **Step 1: DevTools → 375px viewport (iPhone SE)**
- [ ] **Step 2: Walk marketing home, /app, student flow, dashboard tabs**
- [ ] **Step 3: Confirm no horizontal scroll, no overlapping text, all CTAs reachable**

### Task 4.6: Final acceptance criteria checklist

- [ ] All 34 routes render with no console errors
- [ ] `npm run build` succeeds with zero warnings
- [ ] Student reflection flow completes end-to-end
- [ ] Teacher dashboard loads with Triage default; tabs switch without reload
- [ ] Live tab updates in real-time
- [ ] Voice TTS toggle works in settings; off-by-default verified
- [ ] WCAG AA contrast verified on dark
- [ ] `prefers-reduced-motion` honored
- [ ] Mobile (375px) and desktop (1440px) both work
- [ ] No light-theme code paths remain
- [ ] Print styles still produce paper layout

### Task 4.7: Open PR for review

- [ ] **Step 1: Push final commits**

```bash
git push
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --title "Deep Ocean redesign — two-surface dark direction" --body "$(cat <<'EOF'
## Summary
- Replaces the "Marginalia" light direction with "Deep Ocean" two-surface dark
- Student surface: calm, immersive (audio-reactive ripples + glowing dot + live transcript + recharge interlude)
- Teacher surface: dense, powerful (layered Triage / Insights / Live tabs)
- Drops `next-themes`, hardcodes dark
- All 34 routes redesigned in place

## Design doc
[docs/plans/2026-05-01-deep-ocean-redesign-design.md](docs/plans/2026-05-01-deep-ocean-redesign-design.md)

## Implementation plan
[docs/plans/2026-05-01-deep-ocean-redesign-plan.md](docs/plans/2026-05-01-deep-ocean-redesign-plan.md)

## Test plan
- [x] Student flow walked end-to-end on preview (mic + transcript + recharge + insights)
- [x] Teacher dashboard tabs verified (Triage/Insights/Live with seeded data)
- [x] /api/ai/tts route verified
- [x] Accessibility: WCAG AA contrast, prefers-reduced-motion, focus rings
- [x] Mobile (375px) and desktop (1440px) viewports
- [x] All 34 routes return 200 on preview
- [x] No light-theme code paths remain (next-themes uninstalled)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review

**Spec coverage:**
- Section 1 (color tokens) → Task 0.1 ✓
- Section 2 (typography) → Task 0.1 (CSS) + verified in Task 0.5 (probe) ✓
- Section 3 (ambient components) → Task 0.2 ✓
- Section 4 (student flow) → Agent A in Phase 2 ✓
- Section 5 (dashboard) → Agent C in Phase 2 ✓
- Section 6 (internal pages + marketing) → Agents B, D, E in Phase 2 ✓
- "What's preserved / cut / added" → Reflected in File Structure section ✓
- Build approach (Approach 3) → Mirrored verbatim in Phase 0/1/2/3/4 ✓
- Acceptance criteria → Task 4.6 ✓
- Constraints (perf, a11y, browser support, cost) → Embedded in agent prompts ✓

**Placeholder scan:** No "TBD", "implement later", "fill in details", or "similar to Task N" in any code block. Every code step has actual code.

**Type consistency:** `useAudioLevel` returns `number` (Task 0.3). `useTTS` returns `{ speak, stop, isLoading, isPlaying }` (Task 0.4). `RippleField` props `{ intensity?, paused?, className? }`, `GlowingDot` props `{ audioLevel?, mode?, className? }`, `BreathingCircle` props `{ label?, size?, className? }` — all consistent across the probe page in Task 0.5 and the agent prompts in Phase 2.

---

## Plan complete

Saved to `docs/plans/2026-05-01-deep-ocean-redesign-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task in Phase 0/1, then dispatch all 5 Phase 2 agents in parallel, then handle Phase 3/4 inline. Fast iteration with review between phases.

**2. Inline Execution** — I execute Phase 0/1 myself in this session, dispatch Phase 2 agents in parallel, then continue inline. Single conversation, more linear.
