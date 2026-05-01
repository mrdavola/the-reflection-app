"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Presentation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { store, useStore } from "@/lib/storage";
import { formatRelativeTime } from "@/lib/utils";

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
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <Presentation className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl tracking-tight">Workshops</h1>
            <p className="mt-1 text-foreground/75">
              Run a live, in-person session with a shared collaborative board.
            </p>
          </div>
        </div>
        <Button asChild size="lg">
          <Link href="/app/workshops/new">
            <Plus className="h-4 w-4" />
            New workshop
          </Link>
        </Button>
      </div>

      {workshops.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
              <Presentation className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl tracking-tight">
              No workshops yet
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Start one to get a join code and a Padlet-style board your room can
              fill in together.
            </p>
            <Button asChild className="mt-2">
              <Link href="/app/workshops/new">
                <Plus className="h-4 w-4" />
                New workshop
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workshops.map((w) => {
            const board = boards.find((b) => b.id === w.boardId);
            const noteCount = board?.notes.length ?? 0;
            return (
              <Link key={w.id} href={`/app/workshops/${w.id}`}>
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="font-display">{w.title}</CardTitle>
                      <StatusBadge status={w.status} />
                    </div>
                    <CardDescription>
                      Created {formatRelativeTime(w.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Join code
                      </div>
                      <div className="font-mono text-2xl font-semibold tracking-[0.2em]">
                        {w.joinCode}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {noteCount} note{noteCount === 1 ? "" : "s"}
                    </div>
                  </CardContent>
                </Card>
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
