"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Copy,
  Pencil,
  PartyPopper,
  Sparkles,
} from "lucide-react";
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
import { getFocus } from "@/lib/focus-catalog";
import { useStore } from "@/lib/storage";

export default function ShareActivityPage() {
  const params = useParams<{ id: string; activityId: string }>();
  const groupId = params.id;
  const activityId = params.activityId;
  const router = useRouter();

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

  if (!group || !activity) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <CardTitle>Activity not found</CardTitle>
            <CardDescription>This activity may have been deleted.</CardDescription>
            <Button asChild className="mt-2">
              <Link href={`/app/groups/${groupId}`}>Back to group</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const focus = getFocus(activity.focus);

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy. Select and copy the link manually.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-12">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/app/groups/${group.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to {group.name}
          </Link>
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/[0.06] via-card to-secondary/[0.06]">
          <div className="absolute right-[-30px] top-[-30px] h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute left-[-40px] bottom-[-40px] h-44 w-44 rounded-full bg-secondary/15 blur-3xl" />

          <CardHeader className="relative">
            <div className="flex items-center gap-2">
              <Badge variant="primary">
                <PartyPopper className="h-3 w-3" />
                Activity assigned
              </Badge>
              <Badge variant="muted">
                <span className="text-base leading-none">{focus.emoji}</span>
                {focus.label}
              </Badge>
            </div>
            <CardTitle className="font-display text-3xl tracking-tight md:text-4xl">
              {activity.title || "Untitled activity"} is live
            </CardTitle>
            <CardDescription>
              Share this link with your participants. They don't need an account —
              just open the link and reflect.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative space-y-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                <code className="truncate text-sm text-foreground/85">
                  {shareUrl || "…"}
                </code>
              </div>
              <Button onClick={handleCopy} size="lg" disabled={!shareUrl}>
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
            </div>

            <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
              <QrPlaceholder seed={activity.shareCode} />
              <div className="space-y-2 text-sm text-foreground/80">
                <p>
                  <span className="font-semibold text-foreground">
                    Share code:
                  </span>{" "}
                  <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">
                    {activity.shareCode}
                  </code>
                </p>
                <p className="text-muted-foreground">
                  Project this code on a screen if you'd rather have students type
                  it. The link works on Chromebooks, iPads, and phones — no login.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-display">Prompt preview</CardTitle>
          <CardDescription>
            What learners will see, in order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activity.prompts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No prompts on this activity yet.</p>
          ) : (
            <ol className="space-y-2">
              {activity.prompts.map((p, idx) => (
                <li
                  key={p.id}
                  className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-3"
                >
                  <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-foreground/90">{p.text}</p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/app/groups/${group.id}/activities/${activity.id}/setup`)
          }
        >
          <Pencil className="h-4 w-4" />
          Reopen activity
        </Button>
        <Button asChild size="lg">
          <Link href={`/app/groups/${group.id}`}>
            Done — back to group
          </Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * Tiny deterministic SVG block-grid that visually stands in for a QR code.
 * The real share link is the source of truth above; this is decorative.
 */
function QrPlaceholder({ seed }: { seed: string }) {
  const size = 17; // grid cells per side
  const cells = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const grid: boolean[] = [];
    for (let i = 0; i < size * size; i++) {
      h = (h * 1664525 + 1013904223) >>> 0;
      grid.push((h & 0xff) > 130);
    }
    // anchor squares (top-left, top-right, bottom-left)
    const setBlock = (r: number, c: number) => {
      for (let dr = 0; dr < 5; dr++) {
        for (let dc = 0; dc < 5; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
            const ringEdge =
              dr === 0 || dr === 4 || dc === 0 || dc === 4;
            const innerCenter = dr >= 1 && dr <= 3 && dc >= 1 && dc <= 3;
            grid[rr * size + cc] =
              ringEdge || (innerCenter && dr === 2 && dc === 2);
          }
        }
      }
    };
    setBlock(0, 0);
    setBlock(0, size - 5);
    setBlock(size - 5, 0);
    return grid;
  }, [seed]);

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-32 w-32"
        aria-hidden="true"
      >
        <rect x="0" y="0" width={size} height={size} fill="white" />
        {cells.map((on, i) =>
          on ? (
            <rect
              key={i}
              x={i % size}
              y={Math.floor(i / size)}
              width={1}
              height={1}
              fill="hsl(var(--foreground))"
            />
          ) : null,
        )}
      </svg>
    </div>
  );
}
