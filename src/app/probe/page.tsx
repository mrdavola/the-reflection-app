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
