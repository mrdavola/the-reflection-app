"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { nanoid } from "nanoid";
import { Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { store, useStore } from "@/lib/storage";
import type { BoardNote } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

type NoteColor = BoardNote["color"];

interface Props {
  boardId: string;
  authorName: string;
  mode: "facilitator" | "participant";
}

/**
 * Sticky-note styling on dark navy.
 * Each note uses a triage background token at ~0.20 opacity so it reads as a
 * glowing post-it. Text stays warm cream (`text-foreground`) — verified legible
 * on all four backgrounds at AA contrast.
 *
 * The five note colors map onto the four triage tokens (with one paired) so we
 * stay token-only and consistent with the rest of the app.
 */
const COLORS: {
  id: NoteColor;
  label: string;
  bg: string; // surface (uses triage *-bg token)
  ring: string; // hairline ring matching the triage hue
  chip: string; // color picker chip
}[] = [
  {
    id: "yellow",
    label: "Sunny",
    bg: "bg-triage-sunny-bg",
    ring: "ring-triage-sunny/30",
    chip: "bg-triage-sunny ring-triage-sunny/50",
  },
  {
    id: "blue",
    label: "Sky",
    bg: "bg-triage-blue-bg",
    ring: "ring-triage-blue/30",
    chip: "bg-triage-blue ring-triage-blue/50",
  },
  {
    id: "green",
    label: "Coral",
    bg: "bg-triage-orange-bg",
    ring: "ring-triage-orange/30",
    chip: "bg-triage-orange ring-triage-orange/50",
  },
  {
    id: "pink",
    label: "Rose",
    bg: "bg-triage-rose-bg",
    ring: "ring-triage-rose/30",
    chip: "bg-triage-rose ring-triage-rose/50",
  },
  {
    id: "purple",
    label: "Ink",
    bg: "bg-primary/10",
    ring: "ring-primary/30",
    chip: "bg-primary ring-primary/50",
  },
];

function colorFor(c: NoteColor) {
  return COLORS.find((x) => x.id === c) ?? COLORS[0];
}

export function CollaborativeBoard({ boardId, authorName, mode }: Props) {
  const board = useStore((s) => s.boards.find((b) => b.id === boardId));
  const [text, setText] = useState("");
  const [color, setColor] = useState<NoteColor>("yellow");
  const [submitting, setSubmitting] = useState(false);

  if (!board) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          This board isn&apos;t available.
        </CardContent>
      </Card>
    );
  }

  function submitNote() {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Add some text first.");
      return;
    }
    if (!authorName.trim()) {
      toast.error("Missing your name.");
      return;
    }
    setSubmitting(true);
    try {
      store.addNote(boardId, {
        id: nanoid(8),
        authorName: authorName.trim(),
        text: trimmed,
        color,
        createdAt: new Date().toISOString(),
      });
      setText("");
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submitNote();
    }
  }

  function removeNote(noteId: string) {
    store.removeNote(boardId, noteId);
  }

  const sortedNotes = board.notes
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border/70 bg-card p-6">
        <p className="margin-note uppercase tracking-[0.18em] text-[0.7rem]">
          Prompt
        </p>
        <p className="mt-2 font-display text-xl leading-snug tracking-tight sm:text-2xl">
          {board.prompt || "(no prompt set)"}
        </p>
      </div>

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        }}
      >
        <AnimatePresence initial={false}>
          {sortedNotes.map((note) => {
            const c = colorFor(note.color);
            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.85, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={cn(
                  "group relative flex min-h-[140px] flex-col gap-2 rounded-2xl p-4 ring-1",
                  // glow signature — subtle outer halo on dark navy
                  "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_18px_40px_-22px_rgba(120,165,220,0.18)]",
                  c.bg,
                  c.ring,
                )}
              >
                {mode === "facilitator" && (
                  <button
                    type="button"
                    onClick={() => removeNote(note.id)}
                    className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-background/40 text-foreground/80 opacity-0 ring-1 ring-border/60 transition-opacity hover:bg-background/70 hover:text-foreground group-hover:opacity-100"
                    aria-label="Remove note"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {note.text}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 text-[11px] text-foreground/60">
                  <span className="font-medium text-foreground/80">
                    {note.authorName}
                  </span>
                  <span>{formatRelativeTime(note.createdAt)}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {sortedNotes.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border/70 bg-card/60 p-10 text-center text-sm text-muted-foreground">
            No notes yet — be the first to add one below.
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-3 py-5">
          <p className="margin-note uppercase tracking-[0.18em] text-[0.7rem]">
            Add a note
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your thought… (Cmd/Ctrl + Enter to post)"
            rows={3}
            maxLength={400}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {COLORS.map((c) => {
                const selected = color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    aria-label={`${c.label} note`}
                    className={cn(
                      "h-7 w-7 rounded-full ring-2 transition-transform",
                      c.chip,
                      selected
                        ? "scale-110 ring-foreground/60"
                        : "ring-transparent hover:scale-105",
                    )}
                  />
                );
              })}
            </div>
            <Button
              type="button"
              size="sm"
              onClick={submitNote}
              disabled={submitting || !text.trim()}
            >
              <Send className="h-4 w-4" />
              Post note
            </Button>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Posting as{" "}
            <span className="font-medium text-foreground/80">
              {authorName || "Anonymous"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
