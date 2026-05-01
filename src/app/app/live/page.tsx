"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Mic, MicOff, Radio, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";

interface CoachSuggestion {
  id: string;
  text: string;
  at: number; // ms epoch
}

interface LessonToolResult {
  kind: "summarize" | "exit-ticket" | "translate";
  text: string;
  at: number;
}

const POLL_INTERVAL_MS = 30_000;
const MAX_SUGGESTIONS = 8;

function formatHMS(at: number) {
  const d = new Date(at);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function LiveCoTeacherPage() {
  const speech = useSpeechRecognition();
  const [suggestions, setSuggestions] = useState<CoachSuggestion[]>([]);
  const [coachLoading, setCoachLoading] = useState(false);
  const [toolLoading, setToolLoading] = useState<null | LessonToolResult["kind"]>(null);
  const [toolResult, setToolResult] = useState<LessonToolResult | null>(null);

  const transcriptRef = useRef(speech.transcript);
  transcriptRef.current = speech.transcript;
  const suggestionsRef = useRef(suggestions);
  suggestionsRef.current = suggestions;

  const fetchSuggestions = useCallback(async () => {
    const transcript = transcriptRef.current;
    if (!transcript || transcript.trim().length < 40) return;
    setCoachLoading(true);
    try {
      const recent = suggestionsRef.current.slice(0, 5).map((s) => s.text);
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, recentSuggestions: recent }),
      });
      if (!res.ok) throw new Error(`coach ${res.status}`);
      const data = (await res.json()) as { suggestions: string[] };
      const fresh: CoachSuggestion[] = (data.suggestions ?? [])
        .filter((t) => t && !suggestionsRef.current.some((s) => s.text === t))
        .map((t) => ({ id: uid(), text: t, at: Date.now() }));
      if (fresh.length > 0) {
        setSuggestions((prev) => [...fresh, ...prev].slice(0, MAX_SUGGESTIONS));
      }
    } catch (err) {
      console.error("[live] coach fetch failed:", err);
    } finally {
      setCoachLoading(false);
    }
  }, []);

  // Poll while listening.
  useEffect(() => {
    if (!speech.listening) return;
    // Kick one off shortly after start so the user sees motion.
    const initial = setTimeout(() => {
      fetchSuggestions();
    }, 5_000);
    const interval = setInterval(fetchSuggestions, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [speech.listening, fetchSuggestions]);

  // Surface speech errors via toast.
  useEffect(() => {
    if (speech.error) {
      toast.error(`Speech error: ${speech.error}`);
    }
  }, [speech.error]);

  const callTool = useCallback(
    async (kind: LessonToolResult["kind"]) => {
      const transcript = transcriptRef.current;
      if (!transcript || transcript.trim().length < 20) {
        toast.message("Capture a bit of the lesson first.");
        return;
      }
      setToolLoading(kind);
      try {
        const body: Record<string, unknown> = { kind, transcript };
        if (kind === "translate") body.targetLanguage = "Spanish";
        const res = await fetch("/api/ai/lesson-tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`tool ${res.status}`);
        const data = (await res.json()) as { text: string };
        setToolResult({ kind, text: data.text, at: Date.now() });
      } catch (err) {
        console.error("[live] tool fetch failed:", err);
        toast.error("That didn't work. Try again in a moment.");
      } finally {
        setToolLoading(null);
      }
    },
    [],
  );

  const toggleListening = () => {
    if (!speech.supported) {
      toast.error("Speech recognition isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (speech.listening) {
      speech.stop();
    } else {
      speech.start();
    }
  };

  const wordCount = useMemo(() => {
    if (!speech.transcript) return 0;
    return speech.transcript.trim().split(/\s+/).filter(Boolean).length;
  }, [speech.transcript]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl tracking-tight">Live co-teacher</h1>
            {speech.listening ? (
              <Badge variant="primary" className="gap-1.5">
                <span className="relative inline-flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Listening
              </Badge>
            ) : (
              <Badge variant="muted">Paused</Badge>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-foreground/75">
            Press record. Your lesson is transcribed in your browser, and a coach quietly
            offers nudges every 30 seconds.
          </p>
        </div>
        {!speech.supported && (
          <Badge variant="rose">Speech recognition unsupported</Badge>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main column */}
        <section className="lg:col-span-7 space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <button
                type="button"
                onClick={toggleListening}
                disabled={!speech.supported}
                aria-pressed={speech.listening}
                aria-label={speech.listening ? "Stop listening" : "Start listening"}
                className={[
                  "relative flex h-28 w-28 items-center justify-center rounded-full transition-all",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  speech.listening
                    ? "bg-destructive text-destructive-foreground shadow-[0_18px_36px_-12px_hsl(var(--destructive)/0.55)]"
                    : "bg-primary text-primary-foreground shadow-[0_18px_36px_-12px_hsl(var(--primary)/0.55)] hover:bg-primary/90",
                ].join(" ")}
              >
                {speech.listening ? (
                  <>
                    <span className="absolute inset-0 animate-ping rounded-full bg-destructive/30" />
                    <MicOff className="relative h-10 w-10" />
                  </>
                ) : (
                  <Mic className="h-10 w-10" />
                )}
              </button>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {speech.listening ? "Tap to pause" : "Tap to start listening"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {wordCount} words captured · rolling 5-minute window
                </p>
              </div>
              {speech.transcript && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    speech.reset();
                    setSuggestions([]);
                    setToolResult(null);
                  }}
                >
                  Clear transcript
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live transcript</CardTitle>
              <CardDescription>
                Stays in your browser. We only send a rolling snippet to the coach.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm leading-relaxed">
                {speech.transcript ? (
                  <p className="whitespace-pre-wrap">{speech.transcript}</p>
                ) : (
                  <p className="text-muted-foreground">
                    Nothing captured yet. Hit record to start.
                  </p>
                )}
                {speech.interim && (
                  <p className="mt-2 italic text-muted-foreground">{speech.interim}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lesson tools</CardTitle>
              <CardDescription>
                Quick AI helpers powered by what you've said so far.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => callTool("summarize")}
                  disabled={toolLoading !== null}
                >
                  <Sparkles className="h-4 w-4" />
                  {toolLoading === "summarize" ? "Summarizing…" : "Summarize this lesson"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => callTool("exit-ticket")}
                  disabled={toolLoading !== null}
                >
                  <Sparkles className="h-4 w-4" />
                  {toolLoading === "exit-ticket"
                    ? "Generating…"
                    : "Generate exit ticket question"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => callTool("translate")}
                  disabled={toolLoading !== null}
                >
                  <Globe className="h-4 w-4" />
                  {toolLoading === "translate"
                    ? "Translating…"
                    : "Translate last point to Spanish"}
                </Button>
              </div>
              {toolResult && (
                <div className="rounded-2xl border border-border/60 bg-card/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="outline">
                      {toolResult.kind === "summarize"
                        ? "Lesson summary"
                        : toolResult.kind === "exit-ticket"
                          ? "Exit ticket"
                          : "Spanish translation"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatHMS(toolResult.at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {toolResult.text}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-5">
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Coaching suggestions
                </CardTitle>
                {coachLoading && (
                  <Badge variant="muted" className="text-[10px]">
                    Thinking…
                  </Badge>
                )}
              </div>
              <CardDescription>
                Refreshes every 30 seconds while you're listening.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suggestions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                  Suggestions will appear here once we've heard a bit of the lesson.
                </p>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {suggestions.map((s, idx) => {
                      const fade = Math.max(0.45, 1 - idx * 0.07);
                      return (
                        <motion.li
                          key={s.id}
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: fade, y: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="rounded-2xl border border-border/60 bg-card p-3"
                        >
                          <p className="text-sm leading-snug">{s.text}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Generated at {formatHMS(s.at)}
                          </p>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Radio className="h-3 w-3" />
                  {speech.listening ? "Live" : "Paused"}
                </span>
                <button
                  type="button"
                  onClick={fetchSuggestions}
                  disabled={
                    coachLoading ||
                    !speech.transcript ||
                    speech.transcript.trim().length < 40
                  }
                  className="rounded-full px-2 py-1 hover:bg-muted disabled:opacity-50"
                >
                  Refresh now
                </button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
