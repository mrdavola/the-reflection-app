"use client";

/**
 * Personal-reflection setup screen — "what shall we sit with today?"
 *
 * Three focus cards (sky-glow on hover) + a free-text fallback. Faint ripples
 * tucked in the corner of the page so the surface still hints at the moment
 * about to arrive without dominating it.
 *
 * Begin → /app/personal/run, with `objective` + `focus` persisted in the
 * personal-flow store.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RippleField } from "@/components/ambient";
import { FOCUS_OPTIONS, getFocus } from "@/lib/focus-catalog";
import { personalFlow, usePersonalFlow } from "@/lib/personal-flow-store";
import { readTtsEnabled, writeTtsEnabled } from "@/lib/voice-persona-prefs";
import type { FocusId } from "@/lib/types";

const FEATURED_FOCI: FocusId[] = ["metacognition", "growth-mindset", "self-authorship"];

export default function PersonalEntryPage() {
  const router = useRouter();
  const flow = usePersonalFlow();

  const [focus, setFocus] = useState<FocusId | null>(null);
  const [objective, setObjective] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(false);
  // Editable preview of the first question. Auto-syncs with focus + objective
  // until the user edits it; after that, manual edits stick.
  const [seedPrompt, setSeedPrompt] = useState("");
  const [seedDirty, setSeedDirty] = useState(false);

  // Hydrate from store (returning mid-flow) and TTS pref from localStorage.
  useEffect(() => {
    if (flow.focus) setFocus(flow.focus);
    if (flow.objective) setObjective(flow.objective);
    setTtsEnabled(readTtsEnabled());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the preview in sync with focus + objective until the educator edits it.
  useEffect(() => {
    if (seedDirty) return;
    if (!focus || !objective.trim()) {
      setSeedPrompt("");
      return;
    }
    setSeedPrompt(buildSeedPrompt(focus, objective.trim()));
  }, [focus, objective, seedDirty]);

  const featured = useMemo(
    () => FOCUS_OPTIONS.filter((f) => FEATURED_FOCI.includes(f.id)),
    [],
  );

  const focusMeta = focus ? getFocus(focus) : null;
  const trimmedSeed = seedPrompt.trim();
  const canBegin = !!focus && objective.trim().length > 0 && trimmedSeed.length > 0;

  function toggleTts() {
    const next = !ttsEnabled;
    setTtsEnabled(next);
    writeTtsEnabled(next);
  }

  function begin() {
    if (!canBegin) return;
    const trimmedObjective = objective.trim();
    personalFlow.set({
      objective: trimmedObjective,
      focus,
      prompts: [trimmedSeed],
      responses: [],
      analysis: null,
      takeaway: "",
    });
    router.push("/app/personal/run");
  }

  function resetSeedToDefault() {
    if (!focus || !objective.trim()) return;
    setSeedPrompt(buildSeedPrompt(focus, objective.trim()));
    setSeedDirty(false);
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Faint corner ripples — set the room temperature without filling it */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[26rem] w-[26rem] opacity-70"
      >
        <RippleField intensity={0.03} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-[1] mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 py-12 md:py-20"
      >
        <header className="space-y-4">
          <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">Personal reflection</p>
          <h1 className="font-display text-[2.5rem] md:text-[3.5rem] leading-[1.05] tracking-[-0.02em]">
            What shall we sit with today?
          </h1>
          <p className="text-foreground/70 max-w-prose">
            Pick a focus, name what you&rsquo;re working on, and a quiet space will
            open. Speak when you&rsquo;re ready.
          </p>
        </header>

        <section className="space-y-5">
          <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
            Choose a focus
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {featured.map((f) => {
              const selected = focus === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFocus(f.id)}
                  className={`group relative flex flex-col items-start gap-3 rounded-lg border p-5 text-left transition-all duration-300 ${
                    selected
                      ? "border-primary/60 bg-card shadow-[0_0_28px_-8px_oklch(0.78_0.105_230/0.45)]"
                      : "border-border bg-surface hover:border-primary/40 hover:shadow-[0_0_24px_-12px_oklch(0.78_0.105_230/0.45)]"
                  }`}
                >
                  <p className="margin-note uppercase tracking-[0.3em] text-[0.65rem]">
                    {f.bestFor.split(",")[0]}
                  </p>
                  <h3 className="font-display text-[1.25rem] md:text-[1.4rem] leading-[1.2]">
                    {f.label}
                  </h3>
                  <p className="text-[0.875rem] leading-[1.55] text-muted-foreground">
                    {f.blurb}
                  </p>
                </button>
              );
            })}
          </div>

          <details className="group">
            <summary className="cursor-pointer list-none text-[0.7rem] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground/80 transition-colors">
              Or pick from all 16 focus areas →
            </summary>
            <div className="mt-4 grid gap-2 sm:grid-cols-3 md:grid-cols-4">
              {FOCUS_OPTIONS.filter((f) => !FEATURED_FOCI.includes(f.id)).map((f) => {
                const selected = focus === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFocus(f.id)}
                    className={`rounded-md border px-3 py-2 text-left text-[0.8125rem] transition-colors ${
                      selected
                        ? "border-primary/60 bg-card text-foreground"
                        : "border-border/60 bg-surface text-foreground/70 hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </details>
        </section>

        <section className="space-y-3">
          <Label
            htmlFor="objective"
            className="margin-note uppercase tracking-[0.3em] text-[0.7rem]"
          >
            What&rsquo;s on your mind?
          </Label>
          <Input
            id="objective"
            placeholder="A class I'm teaching, a project I'm shipping, a habit I'm building…"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="h-12 text-[1rem]"
          />
          <p className="text-[0.75rem] text-foreground/50">
            One line is enough. The rest comes when you start speaking.
          </p>
        </section>

        {focus && objective.trim().length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label
                htmlFor="seed-prompt"
                className="margin-note uppercase tracking-[0.3em] text-[0.7rem]"
              >
                Your first question — preview & edit
              </Label>
              {seedDirty && (
                <button
                  type="button"
                  onClick={resetSeedToDefault}
                  className="text-[0.7rem] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground/80 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            <Textarea
              id="seed-prompt"
              value={seedPrompt}
              onChange={(e) => {
                setSeedPrompt(e.target.value);
                setSeedDirty(true);
              }}
              rows={3}
              className="font-display text-[1.125rem] leading-[1.5] tracking-[-0.01em] min-h-[96px]"
            />
            <p className="text-[0.75rem] text-foreground/50">
              This is what gets asked first. The next questions are generated from
              what you actually say.
            </p>
          </section>
        )}

        <section className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6">
          <button
            type="button"
            onClick={toggleTts}
            className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-foreground/50 hover:text-foreground transition-colors"
            aria-pressed={ttsEnabled}
          >
            {ttsEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-primary/80" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
            Read prompts aloud {ttsEnabled ? "ON" : "OFF"}
          </button>

          <div className="flex items-center gap-3">
            {focusMeta && (
              <span className="text-[0.75rem] text-foreground/50">
                Focus: <span className="text-foreground/80">{focusMeta.label}</span>
              </span>
            )}
            <Button onClick={begin} disabled={!canBegin} size="lg">
              Begin
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </motion.div>
    </div>
  );
}

function buildSeedPrompt(focus: FocusId, objective: string): string {
  const f = getFocus(focus);
  const trimmed = objective.replace(/[.!?]+$/, "").trim();
  switch (focus) {
    case "metacognition":
      return `Walk me through how you've been thinking about ${trimmed}. Where did your mind keep returning?`;
    case "growth-mindset":
      return `Where in ${trimmed} did effort show up in a way that surprised you?`;
    case "self-authorship":
      return `When you imagine ${trimmed} a month from now, whose voice is the loudest in the room — and is that the voice you want?`;
    case "critical-thinking":
      return `What's one assumption underneath ${trimmed} that you haven't checked yet?`;
    case "problem-solving":
      return `What's the smallest version of ${trimmed} you could try this week, and what would it tell you?`;
    case "creative-booster":
      return `If ${trimmed} could borrow from somewhere unexpected, where would you raid for ideas?`;
    case "goal-setting":
      return `What does done look like for ${trimmed}, in language someone outside your head would understand?`;
    case "emotional-awareness":
      return `What does ${trimmed} actually feel like in your body, before you start describing it?`;
    case "communication":
      return `Whose understanding of ${trimmed} matters most right now, and what do they need to hear from you?`;
    case "collaboration":
      return `Who else is shaping ${trimmed}, and where are your edges meeting theirs?`;
    case "ethical-reasoning":
      return `Who carries the cost of ${trimmed} if it goes well — and who if it doesn't?`;
    case "design-thinking":
      return `What's the rough draft of ${trimmed} that you haven't let yourself make yet?`;
    case "research-thinking":
      return `What would you need to see to change your mind about ${trimmed}?`;
    case "writing-support":
      return `Read your last paragraph about ${trimmed} aloud in your head. What sentence is doing the most work?`;
    case "retrieval":
      return `Without looking, what do you remember most clearly about ${trimmed}?`;
    case "understanding":
    default:
      return `Tell me the part of ${trimmed} you understand most clearly. What's still murky? — ${f.label}`;
  }
}
