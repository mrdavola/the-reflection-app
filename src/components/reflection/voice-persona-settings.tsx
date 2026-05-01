"use client";

/**
 * Voice persona settings — the master TTS toggle plus four voice-card preview
 * grid. Source of truth for `localStorage[refleckt:personal:tts-enabled]` and
 * `localStorage[refleckt:personal:voice]`. Cross-agent contract: the personal
 * reflection setup page reads the same keys to honor the toggle in-flow. Do
 * not rename the keys without updating both consumers in lockstep.
 */

import { useEffect, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTTS, type VoicePersona } from "@/lib/use-tts";

const VOICES: Array<{ id: VoicePersona; name: string; desc: string }> = [
  { id: "Aoede", name: "Aoede", desc: "Warm & calming" },
  { id: "Puck", name: "Puck", desc: "Bright & clear" },
  { id: "Charon", name: "Charon", desc: "Deep & grounded" },
  { id: "Kore", name: "Kore", desc: "Balanced & gentle" },
];

const STORAGE_TTS = "refleckt:personal:tts-enabled";
const STORAGE_VOICE = "refleckt:personal:voice";

const VOICE_IDS: VoicePersona[] = ["Aoede", "Puck", "Charon", "Kore"];

export function VoicePersonaSettings() {
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [voice, setVoice] = useState<VoicePersona>("Aoede");
  const [previewing, setPreviewing] = useState<VoicePersona | null>(null);
  const tts = useTTS({ voice, muted: false });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const t = window.localStorage.getItem(STORAGE_TTS);
      const v = window.localStorage.getItem(STORAGE_VOICE) as VoicePersona | null;
      if (t === "1") setTtsEnabled(true);
      if (v && (VOICE_IDS as string[]).includes(v)) setVoice(v);
    } catch {
      // ignore
    }
  }, []);

  function handleToggle(next: boolean) {
    setTtsEnabled(next);
    try {
      window.localStorage.setItem(STORAGE_TTS, next ? "1" : "0");
    } catch {
      // ignore
    }
  }

  function handleVoice(id: VoicePersona) {
    setVoice(id);
    try {
      window.localStorage.setItem(STORAGE_VOICE, id);
    } catch {
      // ignore
    }
  }

  async function handlePreview(id: VoicePersona) {
    setPreviewing(id);
    try {
      await tts.speak(`Hi, I'm ${id}. I will be your reflection guide.`, {
        voiceOverride: id,
      });
    } finally {
      setPreviewing(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="tts-toggle" className="font-display text-base">
            Read prompts aloud
          </Label>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Off by default. When on, the coach reads each prompt with the voice
            you choose. The setting is shared with the personal reflection
            screen.
          </p>
        </div>
        <Switch
          id="tts-toggle"
          checked={ttsEnabled}
          onCheckedChange={handleToggle}
          aria-label="Read prompts aloud"
        />
      </div>

      <div
        className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
          ttsEnabled ? "" : "pointer-events-none opacity-50"
        }`}
        aria-hidden={!ttsEnabled}
      >
        {VOICES.map((v) => {
          const selected = voice === v.id;
          const isPreviewing = previewing === v.id;
          return (
            <div
              key={v.id}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                selected
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <button
                type="button"
                onClick={() => handleVoice(v.id)}
                className="flex flex-1 flex-col items-start text-left focus-visible:outline-none"
                aria-pressed={selected}
              >
                <span className="font-display text-base text-foreground">
                  {v.name}
                </span>
                <span className="margin-note text-[0.65rem] uppercase tracking-[0.18em]">
                  {v.desc}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handlePreview(v.id)}
                disabled={isPreviewing}
                className="ml-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                aria-label={`Preview ${v.name}`}
              >
                {isPreviewing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
