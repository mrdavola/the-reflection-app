"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  ClipboardCopy,
  Download,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AnalysisCard } from "@/components/analysis-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
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
    // Give useSyncExternalStore one tick to subscribe and pull from localStorage.
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!reflection) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-20 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="font-display text-3xl tracking-tight">
          We couldn&rsquo;t find that reflection
        </h1>
        <p className="max-w-md text-foreground/70">
          It may have been deleted, or this link belongs to a different device.
          Reflections live in your browser.
        </p>
        <Button asChild>
          <Link href="/app">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return <ReflectionDetail reflection={reflection} onDelete={() => router.push("/app")} />;
}

function ReflectionDetail({
  reflection,
  onDelete,
}: {
  reflection: Reflection;
  onDelete: () => void;
}) {
  const focusMeta = useMemo(() => getFocus(reflection.focus), [reflection.focus]);
  const activity = useStore((s) =>
    reflection.activityId
      ? s.activities.find((a) => a.id === reflection.activityId)
      : undefined,
  );

  const transcriptText = useMemo(
    () => buildTranscript(reflection),
    [reflection],
  );
  const insightsText = useMemo(
    () => buildInsights(reflection),
    [reflection],
  );

  function copy(text: string, label: string) {
    if (!navigator.clipboard) {
      toast.error("Clipboard isn't available in this browser.");
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Couldn't copy to clipboard"),
    );
  }

  function download() {
    const blob = new Blob([transcriptText], { type: "text/plain;charset=utf-8" });
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

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-2">
      <Button asChild size="sm" variant="ghost" className="-ml-2">
        <Link href="/app">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Badge variant="muted" className="gap-1">
            <span>{focusMeta.emoji}</span>
            {focusMeta.label}
          </Badge>
          {reflection.activityId === null ? (
            <Badge variant="outline">Personal</Badge>
          ) : (
            <Badge variant="outline">Group activity</Badge>
          )}
          <span>·</span>
          <span title={formatDate(reflection.createdAt)}>
            {formatRelativeTime(reflection.createdAt)}
          </span>
        </div>
        <h1 className="font-display text-4xl leading-tight tracking-tight">
          {reflection.objective || "Personal reflection"}
        </h1>
        <p className="text-sm text-muted-foreground">
          By {reflection.participantName} · {formatDate(reflection.createdAt)}
        </p>
        {reflection.participantId && reflection.groupId && (
          <p className="text-sm">
            <Link
              href={`/app/groups/${reflection.groupId}/participants/${reflection.participantId}`}
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              View this learner&apos;s portfolio
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        )}
      </header>

      {reflection.analysis ? (
        <AnalysisCard
          analysis={reflection.analysis}
          showScore={reflection.scoreVisibility === "show"}
          showTeacherFollowUp={reflection.activityId !== null}
          rubric={activity?.rubric}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Sparkles className="h-5 w-5" />
            <p>This reflection doesn&rsquo;t have analysis yet.</p>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-tight">Your responses</h2>
        <div className="space-y-3">
          {reflection.responses.map((r, i) => (
            <Card key={`${r.promptId}-${i}`}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <CardTitle className="text-base font-semibold leading-snug">
                  {r.promptText}
                </CardTitle>
                <Badge variant="outline" className="shrink-0 capitalize">
                  {r.inputType}
                  {typeof r.durationSeconds === "number" && r.durationSeconds > 0
                    ? ` · ${formatDuration(r.durationSeconds)}`
                    : null}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {r.audioBlobUrl ? (
                  <ResponseAudio
                    audioBlobUrl={r.audioBlobUrl}
                    participantName={reflection.participantName}
                    index={i}
                  />
                ) : null}
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {r.text || <span className="text-muted-foreground italic">No transcript saved.</span>}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-tight">Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => copy(transcriptText, "Transcript")}>
            <ClipboardCopy className="h-4 w-4" />
            Copy transcript
          </Button>
          <Button variant="outline" onClick={download}>
            <Download className="h-4 w-4" />
            Download transcript
          </Button>
          {reflection.analysis && (
            <Button variant="outline" onClick={() => copy(insightsText, "Insights")}>
              <ClipboardCopy className="h-4 w-4" />
              Copy insights
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this reflection?</DialogTitle>
                <DialogDescription>
                  This removes the reflection from your browser. It can&rsquo;t be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete reflection
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </div>
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
        (participantName || "reflection").trim().replace(/\s+/g, "-").toLowerCase() ||
        "reflection";
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
    <div className="flex flex-wrap items-center gap-2">
      <audio
        src={audioBlobUrl}
        controls
        className="w-full flex-1 min-w-0"
        preload="none"
      />
      <Button size="sm" variant="outline" onClick={downloadAudio}>
        <Download className="h-4 w-4" />
        Download audio
      </Button>
    </div>
  );
}

function buildTranscript(r: Reflection): string {
  const lines: string[] = [];
  lines.push(`The Reflection App — ${r.objective || "Personal reflection"}`);
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

function buildInsights(r: Reflection): string {
  if (!r.analysis) return "";
  const a = r.analysis;
  return [
    a.summary,
    "",
    `Level ${a.reflectionLevel} of 4 · ${a.understandingLabel} (${a.understandingScore}%)`,
    "",
    `Feedback: ${a.feedback}`,
    `Suggested next step: ${a.suggestedNextStep}`,
    "",
    `Strengths: ${a.strengthsNoticed.join(", ")}`,
    `Cognitive skills: ${a.keyCognitiveSkills.join(", ")}`,
    `Mindset: ${a.mindset} — ${a.mindsetSummary}`,
    `Tone: ${a.tone} — ${a.toneSummary}`,
    `Hidden lesson: ${a.hiddenLesson}`,
  ].join("\n");
}
