"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Plus, Presentation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { store, useStore } from "@/lib/storage";
import { cn, formatRelativeTime } from "@/lib/utils";

export default function WorkshopsPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const u = store.ensureUser();
    setUserId(u.id);
  }, []);

  const workshops = useStore((s) =>
    s.workshops
      .filter((w) => (userId ? w.facilitatorUserId === userId : true))
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  );
  const boards = useStore((s) => s.boards);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
            Live sessions
          </p>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">
            Workshops
          </h1>
          <p className="mt-2 max-w-prose text-foreground/70">
            Run a live, in-person session with a shared collaborative board.
            Share a join code, and notes appear in real time.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/app/workshops/new">
            <Plus className="h-4 w-4" />
            New workshop
          </Link>
        </Button>
      </header>

      {workshops.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 px-6 py-16 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Presentation className="h-6 w-6" />
          </div>
          <h2 className="font-display text-2xl tracking-tight">
            No workshops yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-foreground/70">
            Start one to get a join code and a board your room can fill in
            together.
          </p>
          <Button asChild className="mt-6">
            <Link href="/app/workshops/new">
              <Plus className="h-4 w-4" />
              New workshop
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workshops.map((w) => {
            const board = boards.find((b) => b.id === w.boardId);
            const noteCount = board?.notes.length ?? 0;
            return (
              <Link
                key={w.id}
                href={`/app/workshops/${w.id}`}
                className={cn(
                  "group flex h-full flex-col gap-5 rounded-3xl border border-border/70 bg-card p-6 transition-all",
                  "hover:-translate-y-0.5 hover:border-primary/30",
                  "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_24px_48px_-32px_rgba(120,165,220,0.18)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1">
                      <StatusBadge status={w.status} />
                    </div>
                    <h2 className="font-display text-xl leading-tight tracking-tight">
                      {w.title}
                    </h2>
                    <p className="mt-1 text-[12px] text-foreground/60">
                      Created {formatRelativeTime(w.createdAt)}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                </div>

                <div className="flex-1" />

                <div>
                  <p className="margin-note uppercase tracking-[0.18em] text-[0.65rem]">
                    Join code
                  </p>
                  <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.22em]">
                    {w.joinCode}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[12px] text-foreground/60">
                  <span>
                    {noteCount} note{noteCount === 1 ? "" : "s"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "draft" | "live" | "ended" }) {
  if (status === "live") return <Badge variant="primary">Live</Badge>;
  if (status === "ended") return <Badge variant="muted">Ended</Badge>;
  return <Badge variant="outline">Draft</Badge>;
}
