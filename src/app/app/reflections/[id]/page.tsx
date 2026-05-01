"use client";

/**
 * Single-reflection detail — the document view.
 *
 * Vertical, serif-led, made for reading. Renders a Q/A ledger of every prompt
 * + response, the four-key Master Educator insights block (via the shared
 * <InsightsLayout> from the reflection module), audio playback for any
 * audio-backed responses, and a quiet row of bottom actions.
 *
 * Cross-agent contract: this page consumes the InsightsLayoutProps shape
 * (`insight`, `eyebrow?`, `actions?`, `className?`) exposed by Agent A and
 * uses `deriveInsight()` from `@/lib/insights` (Agent E's extraction). If
 * either contract changes, both surfaces must move together.
 */

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  ClipboardCopy,
  Download,
  Loader2,
  Printer,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InsightsLayout, type InsightAction } from "@/components/reflection";
import { deriveInsight } from "@/lib/insights";
import { getFocus } from "@/lib/focus-catalog";
import { store, useStore } from "@/lib/storage";
import { formatDate, formatDuration, formatRelativeTime } from "@/lib/utils";
import type { Reflection } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

export default function ReflectionDetailPage({ params }: Params) {
  const { id } = use(params);
  const router = useRouter();
  const reflection = useStore((s) => s.reflections.find((r) => r.id === id));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span className="sr-only">Loading reflection</span>
      </div>
    );
  }

  if (!reflection) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-24 text-center">
        <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
          Not found
        </p>
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em]">
          Reflection not found.
        </h1>
        <p className="prose-measure text-foreground/65">
          It may have been deleted, or this link belongs to a different device.
          Reflections live in your browser.
        </p>
        <Button asChild variant="ghost">
          <Link href="/app">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <ReflectionDetail
      reflection={reflection}
      onDelete={() => router.push("/app")}
    />
  );
}

function ReflectionDetail({
  reflection,
  onDelete,
}: {
  reflection: Reflection;
  onDelete: () => void;
}) {
  const focus = useMemo(() => getFocus(reflection.focus), [reflection.focus]);

  const transcripts = useMemo(
    () => reflection.responses.map((r) => r.text || ""),
    [reflection.responses],
  );
  const insight = useMemo(
    () => deriveInsight(reflection.analysis ?? null, transcripts),
    [reflection.analysis, transcripts],
  );

  const transcriptText = useMemo(
    () => buildTranscript(reflection),
    [reflection],
  );

  function copyTranscript() {
    if (!navigator.clipboard) {
      toast.error("Clipboard isn't available in this browser.");
      return;
    }
    navigator.clipboard.writeText(transcriptText).then(
      () => toast.success("Transcript copied"),
      () => toast.error("Couldn't copy to clipboard"),
    );
  }

  function downloadTranscript() {
    const blob = new Blob([transcriptText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `refleckt-${reflection.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Transcript downloaded");
  }

  function handleDelete() {
    store.deleteReflection(reflection.id);
    toast.success("Reflection deleted");
    onDelete();
  }

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  const insightActions: InsightAction[] = [
    {
      label: "Reflect again",
      href: "/app/personal",
      icon: <RotateCcw className="h-3 w-3" aria-hidden />,
    },
    {
      label: "Back to library",
      href: "/app/library",
      icon: <ArrowUpRight className="h-3 w-3" aria-hidden />,
    },
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-2">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Button asChild size="sm" variant="ghost" className="-ml-2">
          <Link href="/app">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {reflection.activityId === null ? (
            <span className="margin-note uppercase tracking-[0.3em] text-[0.65rem]">
              Personal
            </span>
          ) : (
            <span className="margin-note uppercase tracking-[0.3em] text-[0.65rem]">
              Group activity
            </span>
          )}
        </div>
      </div>

      <header className="mt-10 space-y-4">
        <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
          {focus.label}
        </p>
        <h1 className="font-display text-[clamp(2.375rem,5vw,3rem)] font-medium leading-[1.04] tracking-[-0.02em] text-foreground">
          {reflection.objective || "Personal reflection"}
        </h1>
        <p className="text-sm text-foreground/55">
          By {reflection.participantName} ·{" "}
          <span title={formatDate(reflection.createdAt)}>
            {formatRelativeTime(reflection.createdAt)}
          </span>{" "}
          · {formatDate(reflection.createdAt)}
        </p>
        {reflection.participantId && reflection.groupId && (
          <p className="text-sm print:hidden">
            <Link
              href={`/app/groups/${reflection.groupId}/participants/${reflection.participantId}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              View this learner&rsquo;s portfolio
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        )}
      </header>

      <hr className="rule-soft my-10" />

      {reflection.responses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Sparkles className="h-5 w-5" aria-hidden />
            <p>No responses recorded for this reflection.</p>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-10">
          {reflection.responses.map((r, i) => (
            <div key={`${r.promptId}-${i}`} className="space-y-4">
              <p className="margin-note uppercase tracking-[0.3em] text-[0.65rem]">
                Question {String(i + 1).padStart(2, "0")}
                {typeof r.durationSeconds === "number" && r.durationSeconds > 0
                  ? ` · ${formatDuration(r.durationSeconds)}`
                  : ""}
              </p>
              <p className="font-display text-[1.375rem] leading-[1.3] tracking-[-0.014em] text-foreground/90">
                {r.promptText}
              </p>
              {r.text ? (
                <p className="font-display italic text-[1rem] leading-[1.7] text-foreground/85">
                  &ldquo;{r.text}&rdquo;
                </p>
              ) : (
                <p className="text-[0.9rem] italic text-muted-foreground">
                  No transcript saved.
                </p>
              )}
              {r.audioBlobUrl ? (
                <ResponseAudio
                  audioBlobUrl={r.audioBlobUrl}
                  participantName={reflection.participantName}
                  index={i}
                />
              ) : null}
              {i < reflection.responses.length - 1 && (
                <hr className="rule-soft mt-8" />
              )}
            </div>
          ))}
        </section>
      )}

      <hr className="rule-soft my-12" />

      <InsightsLayout
        insight={insight}
        eyebrow={reflection.analysis ? "Insights" : "What surfaced"}
        actions={insightActions}
        className="px-0 py-8"
      />

      <hr className="rule-soft my-10 print:hidden" />

      <section className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={copyTranscript}>
            <ClipboardCopy className="h-4 w-4" />
            Copy transcript
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadTranscript}>
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button variant="ghost" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Delete this reflection?
              </DialogTitle>
              <DialogDescription>
                This removes the reflection from your browser. It can&rsquo;t
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                Delete reflection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </article>
  );
}

function ResponseAudio({
  audioBlobUrl,
  participantName,
  index,
}: {
  audioBlobUrl: string;
  participantName: string;
  index: number;
}) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(audioBlobUrl)
      .then((res) => {
        if (cancelled) return;
        setAvailable(res.ok);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [audioBlobUrl]);

  if (available === false) {
    return (
      <p className="text-xs text-muted-foreground">
        Audio not available — saved to this browser only.
      </p>
    );
  }

  async function downloadAudio() {
    try {
      const res = await fetch(audioBlobUrl);
      if (!res.ok) throw new Error("Audio not available");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const safeName =
        (participantName || "reflection")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase() || "reflection";
      const a = document.createElement("a");
      a.href = url;
      a.download = `the-reflection-app-${safeName}-${index + 1}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Audio downloaded");
    } catch {
      toast.error("Couldn't download audio");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <audio
        src={audioBlobUrl}
        controls
        className="w-full min-w-0 flex-1"
        preload="none"
      />
      <Button size="sm" variant="ghost" onClick={downloadAudio}>
        <Download className="h-4 w-4" />
        Download audio
      </Button>
    </div>
  );
}

function buildTranscript(r: Reflection): string {
  const lines: string[] = [];
  lines.push(`Refleckt — ${r.objective || "Personal reflection"}`);
  lines.push(`Focus: ${getFocus(r.focus).label}`);
  lines.push(`Date: ${formatDate(r.createdAt)}`);
  lines.push(`By: ${r.participantName}`);
  lines.push("");
  r.responses.forEach((resp, i) => {
    lines.push(`Q${i + 1}. ${resp.promptText}`);
    lines.push(resp.text || "(no transcript)");
    lines.push("");
  });
  if (r.analysis) {
    lines.push("— Insights —");
    lines.push(r.analysis.summary);
    lines.push("");
    lines.push(`Feedback: ${r.analysis.feedback}`);
    lines.push(`Next step: ${r.analysis.suggestedNextStep}`);
  }
  return lines.join("\n");
}
