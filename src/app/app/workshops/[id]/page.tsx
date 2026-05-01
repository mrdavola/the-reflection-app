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
import { QrPlaceholder } from "@/components/qr-placeholder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
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
    <div className="space-y-10">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/workshops">
            <ArrowLeft className="h-4 w-4" />
            All workshops
          </Link>
        </Button>
      </div>

      {/* Full-bleed serif header */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
              Facilitator: {facilitatorName}
            </p>
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
              {workshop.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <StatusBadge status={workshop.status} />
            </div>
          </div>
          <StatusToggle current={workshop.status} onChange={setStatus} />
        </div>
        <hr className="rule-soft mt-2" />
      </header>

      {/* Numbered ledger: 01 join code · 02 QR · 03 board */}
      <section className="space-y-12">
        <Ledger number="01" title="Join code" hint="Project on screen.">
          <div className="space-y-3">
            <button
              type="button"
              onClick={copyJoinCode}
              aria-label="Copy join code"
              className={cn(
                "group inline-flex flex-col items-start gap-2 rounded-3xl border border-border/60 bg-card/40 px-8 py-6 transition-all",
                "hover:border-primary/40 hover:bg-card/60",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <span className="margin-note uppercase tracking-[0.3em] text-[0.65rem]">
                /w/
              </span>
              <span className="font-mono text-5xl font-semibold uppercase tracking-[0.22em] text-foreground sm:text-6xl">
                {workshop.joinCode}
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
                    Tap to copy
                  </span>
                )}
              </span>
            </button>
            <Button variant="outline" size="sm" onClick={copyJoinUrl}>
              <Copy className="h-4 w-4" />
              Copy join link
            </Button>
            <p className="text-xs text-muted-foreground">
              Participants visit{" "}
              <span className="font-mono text-foreground/85">
                /w/{workshop.joinCode}
              </span>{" "}
              and enter their first name.
            </p>
          </div>
        </Ledger>

        <Ledger number="02" title="QR for the room" hint="Scan to join.">
          <QrPlaceholder seed={workshop.joinCode} size={208} tone="primary" />
        </Ledger>

        <Ledger
          number="03"
          title="Live board"
          hint="Notes appear in real time across all open tabs."
          action={
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
          }
        >
          <CollaborativeBoard
            boardId={board.id}
            authorName={facilitatorName}
            mode="facilitator"
          />
        </Ledger>
      </section>

      <Dialog open={editPromptOpen} onOpenChange={setEditPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit board prompt</DialogTitle>
            <DialogDescription>
              The new prompt appears above the board for everyone.
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

function Ledger({
  number,
  title,
  hint,
  action,
  children,
}: {
  number: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
      <div className="sm:pt-1">
        <span
          aria-hidden
          className="font-display text-5xl leading-none text-foreground/30 tabular-nums sm:text-6xl"
        >
          {number}
        </span>
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl tracking-tight">{title}</h2>
            {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
          </div>
          {action}
        </div>
        {children}
      </div>
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
