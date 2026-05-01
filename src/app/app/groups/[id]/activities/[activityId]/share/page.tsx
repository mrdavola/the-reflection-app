"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { QrPlaceholder } from "@/components/qr-placeholder";
import { useStore } from "@/lib/storage";
import { cn } from "@/lib/utils";

export default function ShareActivityPage() {
  const params = useParams<{ id: string; activityId: string }>();
  const groupId = params.id;
  const activityId = params.activityId;

  const group = useStore((s) => s.groups.find((g) => g.id === groupId));
  const activity = useStore((s) => s.activities.find((a) => a.id === activityId));

  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const shareUrl = useMemo(
    () => (activity ? `${origin}/r/${activity.shareCode}` : ""),
    [origin, activity],
  );

  const formattedCode = useMemo(
    () => formatShareCode(activity?.shareCode ?? ""),
    [activity?.shareCode],
  );

  if (!group || !activity) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <CardTitle>Activity not found</CardTitle>
            <CardDescription>
              This activity may have been deleted.
            </CardDescription>
            <Button asChild className="mt-2">
              <Link href={`/app/groups/${groupId}`}>Back to group</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy. Select and copy the link manually.");
    }
  }

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4rem)] sm:-mx-6">
      <div
        className={cn(
          "relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-background px-6 py-10 sm:px-10",
          // ambient sky-glow at the bottom-center
          "before:absolute before:inset-x-0 before:bottom-[-30%] before:-z-10 before:h-[80%]",
          "before:bg-[radial-gradient(60%_60%_at_50%_60%,_oklch(0.78_0.105_230_/_0.18)_0%,_transparent_70%)]",
        )}
      >
        {/* Top bar */}
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/app/groups/${group.id}/activities/${activity.id}`}>
              <ArrowLeft className="h-4 w-4" />
              Back to activity
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/app/groups/${group.id}/activities/${activity.id}/setup`}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>

        {/* Stage */}
        <div className="mx-auto mt-12 flex w-full max-w-3xl flex-col items-center text-center">
          <p className="margin-note uppercase tracking-[0.4em] text-[0.7rem]">
            Activity share · Live
          </p>

          <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
            {activity.title || "Untitled activity"}
          </h1>

          <p className="mt-3 font-display italic text-lg text-foreground/70">
            Open on student devices.
          </p>

          {/* The share code — huge, mono, sky-tinted */}
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy share code"
            className={cn(
              "group mt-12 inline-flex flex-col items-center gap-2 rounded-3xl border border-border/60 bg-card/40 px-10 py-8 transition-all",
              "hover:border-primary/40 hover:bg-card/60",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <span className="margin-note uppercase tracking-[0.3em] text-[0.65rem]">
              Share code
            </span>
            <span className="font-mono text-5xl uppercase tracking-[0.18em] text-foreground sm:text-6xl">
              {formattedCode}
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {copied ? (
                <span className="inline-flex items-center gap-1 text-primary">
                  <Check className="h-3 w-3" />
                  Copied
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 group-hover:text-foreground/80">
                  <Copy className="h-3 w-3" />
                  Tap to copy link
                </span>
              )}
            </span>
          </button>

          {/* QR */}
          <div className="mt-10 flex flex-col items-center gap-3">
            <QrPlaceholder seed={activity.shareCode} size={208} tone="primary" />
            <code className="font-mono text-xs text-foreground/55">
              {shareUrl || `/r/${activity.shareCode}`}
            </code>
          </div>

          {/* Footer actions */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={handleCopy} size="lg">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy link
                </>
              )}
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/app/groups/${group.id}/activities/${activity.id}`}>
                Done — back to activity
              </Link>
            </Button>
          </div>
        </div>

        {/* Faint prompt preview */}
        {activity.prompts.length > 0 && (
          <div className="mx-auto mt-20 w-full max-w-3xl">
            <hr className="rule-soft mb-6" />
            <p className="margin-note uppercase tracking-[0.3em] text-[0.65rem] text-center">
              Students will see, in order
            </p>
            <ol className="mt-4 space-y-3">
              {activity.prompts.map((p, idx) => (
                <li
                  key={p.id}
                  className="flex items-start gap-4 text-foreground/70"
                >
                  <span className="font-display text-lg leading-none text-foreground/40 tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <p className="font-display italic">{p.text}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

function formatShareCode(code: string): string {
  // 10-char nanoid → split into 4 + 4 + 2 (hyphens read on stage)
  if (!code) return "";
  const upper = code.toUpperCase();
  if (upper.length <= 4) return upper;
  if (upper.length <= 8) return `${upper.slice(0, 4)}-${upper.slice(4)}`;
  return `${upper.slice(0, 4)}-${upper.slice(4, 8)}-${upper.slice(8)}`;
}
