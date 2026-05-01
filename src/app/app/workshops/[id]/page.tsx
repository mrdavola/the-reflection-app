"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Eraser,
  PencilLine,
  Presentation,
} from "lucide-react";
import { toast } from "sonner";
import { CollaborativeBoard } from "@/components/collaborative-board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { store, useStore } from "@/lib/storage";
import type { Workshop } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default function FacilitatorConsolePage({ params }: Props) {
  const { id } = use(params);

  const workshop = useStore((s) => s.workshops.find((w) => w.id === id));
  const board = useStore((s) =>
    workshop ? s.boards.find((b) => b.id === workshop.boardId) : undefined,
  );
  const user = useStore((s) => s.user);

  const [editPromptOpen, setEditPromptOpen] = useState(false);
  const [promptDraft, setPromptDraft] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (board) setPromptDraft(board.prompt);
  }, [board]);

  const joinUrl = useMemo(() => {
    if (!workshop) return "";
    if (typeof window === "undefined") return `/w/${workshop.joinCode}`;
    return `${window.location.origin}/w/${workshop.joinCode}`;
  }, [workshop]);

  if (!workshop || !board) {
    return (
      <Card className="mt-8">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
            <Presentation className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl tracking-tight">
            Workshop not found
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            It may have been removed, or this device doesn't have the workshop in
            local storage.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/app/workshops">Back to workshops</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const facilitatorName = user?.name ?? "Facilitator";

  function setStatus(status: Workshop["status"]) {
    store.updateWorkshop(workshop!.id, { status });
    if (status === "live") toast.success("Workshop is live");
    else if (status === "ended") toast.success("Workshop ended");
    else toast.success("Set back to draft");
  }

  async function copyJoinCode() {
    try {
      await navigator.clipboard.writeText(workshop!.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Join code copied");
    } catch {
      toast.error("Couldn't copy");
    }
  }

  async function copyJoinUrl() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success("Join link copied");
    } catch {
      toast.error("Couldn't copy");
    }
  }

  function clearAllNotes() {
    store.updateBoard(board!.id, { notes: [] });
    setConfirmClear(false);
    toast.success("Board cleared");
  }

  function savePrompt() {
    const v = promptDraft.trim();
    if (!v) {
      toast.error("Prompt can't be empty");
      return;
    }
    store.updateBoard(board!.id, { prompt: v });
    setEditPromptOpen(false);
    toast.success("Prompt updated");
  }

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/workshops">
            <ArrowLeft className="h-4 w-4" />
            Back to workshops
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge status={workshop.status} />
            <span className="text-xs text-muted-foreground">
              Facilitator: {facilitatorName}
            </span>
          </div>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            {workshop.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusToggle current={workshop.status} onChange={setStatus} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Card className="bg-gradient-to-br from-primary/[0.05] via-card to-secondary/[0.05]">
          <CardHeader>
            <CardTitle className="font-display">Join code</CardTitle>
            <CardDescription>
              Project this on screen. Anyone in the room can use it to join.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={copyJoinCode}
                className="group inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-5 py-3 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <span className="font-mono text-4xl font-semibold tracking-[0.25em] sm:text-5xl">
                  {workshop.joinCode}
                </span>
                <span className="text-muted-foreground group-hover:text-foreground">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </span>
              </button>
              <Button variant="outline" size="sm" onClick={copyJoinUrl}>
                <Copy className="h-4 w-4" />
                Copy join link
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Participants visit{" "}
              <span className="font-mono text-foreground/80">/w/{workshop.joinCode}</span>{" "}
              and enter their first name.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">QR for the room</CardTitle>
            <CardDescription>Quick scan-and-join.</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              aria-hidden
              className="grid aspect-square w-full max-w-[200px] grid-cols-8 gap-0.5 rounded-2xl border border-border/70 bg-card p-3"
            >
              {Array.from({ length: 64 }).map((_, i) => {
                // deterministic pseudo-random using join code
                const seed =
                  workshop.joinCode.charCodeAt(i % workshop.joinCode.length) +
                  i * 7;
                const filled = seed % 3 !== 0;
                return (
                  <div
                    key={i}
                    className={cn(
                      "aspect-square rounded-[2px]",
                      filled ? "bg-foreground" : "bg-transparent",
                    )}
                  />
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Placeholder pattern — share the join code or link for now.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl tracking-tight">Live board</h2>
          <p className="text-xs text-muted-foreground">
            Notes appear here in real time across all open tabs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPromptDraft(board.prompt);
              setEditPromptOpen(true);
            }}
          >
            <PencilLine className="h-4 w-4" />
            Edit prompt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmClear(true)}
            disabled={board.notes.length === 0}
          >
            <Eraser className="h-4 w-4" />
            Clear notes
          </Button>
        </div>
      </div>

      <CollaborativeBoard
        boardId={board.id}
        authorName={facilitatorName}
        mode="facilitator"
      />

      <Dialog open={editPromptOpen} onOpenChange={setEditPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit board prompt</DialogTitle>
            <DialogDescription>
              The new prompt will appear above the board for everyone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="prompt-edit">Prompt</Label>
            <Textarea
              id="prompt-edit"
              value={promptDraft}
              onChange={(e) => setPromptDraft(e.target.value)}
              rows={3}
              maxLength={280}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditPromptOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePrompt}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all notes?</DialogTitle>
            <DialogDescription>
              This removes every note on the board. Can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={clearAllNotes}>
              Clear board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: Workshop["status"] }) {
  if (status === "live") return <Badge variant="primary">Live</Badge>;
  if (status === "ended") return <Badge variant="muted">Ended</Badge>;
  return <Badge variant="outline">Draft</Badge>;
}

function StatusToggle({
  current,
  onChange,
}: {
  current: Workshop["status"];
  onChange: (s: Workshop["status"]) => void;
}) {
  const states: Workshop["status"][] = ["draft", "live", "ended"];
  return (
    <div className="inline-flex items-center rounded-full border border-border/70 bg-card p-1 text-xs">
      {states.map((s) => {
        const active = current === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              "rounded-full px-3 py-1.5 font-medium capitalize transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
