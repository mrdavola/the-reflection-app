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

const COLORS: { id: NoteColor; label: string; bg: string; ring: string; chip: string }[] = [
  {
    id: "yellow",
    label: "Yellow",
    bg: "bg-amber-100 dark:bg-amber-200/90 text-amber-950",
    ring: "ring-amber-300/70",
    chip: "bg-amber-200 ring-amber-400",
  },
  {
    id: "blue",
    label: "Blue",
    bg: "bg-sky-100 dark:bg-sky-200/90 text-sky-950",
    ring: "ring-sky-300/70",
    chip: "bg-sky-200 ring-sky-400",
  },
  {
    id: "green",
    label: "Green",
    bg: "bg-emerald-100 dark:bg-emerald-200/90 text-emerald-950",
    ring: "ring-emerald-300/70",
    chip: "bg-emerald-200 ring-emerald-400",
  },
  {
    id: "pink",
    label: "Pink",
    bg: "bg-pink-100 dark:bg-pink-200/90 text-pink-950",
    ring: "ring-pink-300/70",
    chip: "bg-pink-200 ring-pink-400",
  },
  {
    id: "purple",
    label: "Purple",
    bg: "bg-violet-100 dark:bg-violet-200/90 text-violet-950",
    ring: "ring-violet-300/70",
    chip: "bg-violet-200 ring-violet-400",
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
          This board isn't available.
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
      <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-primary/[0.04] via-card to-secondary/[0.04] p-6">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Prompt
        </div>
        <div className="mt-1 font-display text-xl tracking-tight sm:text-2xl">
          {board.prompt || "(no prompt set)"}
        </div>
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
                  "group relative flex min-h-[140px] flex-col gap-2 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,15,30,0.06),0_18px_40px_-24px_rgba(15,15,30,0.25)] ring-1",
                  c.bg,
                  c.ring,
                )}
              >
                {mode === "facilitator" && (
                  <button
                    type="button"
                    onClick={() => removeNote(note.id)}
                    className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/10 text-current opacity-0 transition-opacity hover:bg-black/20 group-hover:opacity-100"
                    aria-label="Remove note"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {note.text}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 text-[11px] opacity-70">
                  <span className="font-medium">{note.authorName}</span>
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
          <div className="text-sm font-medium">Add a note</div>
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
            Posting as <span className="font-medium text-foreground/80">{authorName || "Anonymous"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
