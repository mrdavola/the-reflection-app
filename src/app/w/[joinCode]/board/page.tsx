"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Presentation } from "lucide-react";
import { CollaborativeBoard } from "@/components/collaborative-board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/storage";

interface Props {
  params: Promise<{ joinCode: string }>;
}

const NAME_KEY = (joinCode: string) => `reflection-app:workshop-name:${joinCode}`;

export default function WorkshopBoardPage({ params }: Props) {
  const { joinCode } = use(params);
  const router = useRouter();
  const upper = joinCode.toUpperCase();

  const workshop = useStore((s) =>
    s.workshops.find((w) => w.joinCode.toUpperCase() === upper),
  );
  const board = useStore((s) =>
    workshop ? s.boards.find((b) => b.id === workshop.boardId) : undefined,
  );

  const [name, setName] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(NAME_KEY(upper));
      if (!stored) {
        router.replace(`/w/${upper}`);
        return;
      }
      setName(stored);
    } catch {
      router.replace(`/w/${upper}`);
    } finally {
      setHydrated(true);
    }
  }, [upper, router]);

  if (!hydrated) {
    return null;
  }

  if (!workshop || !board) {
    return (
      <Card className="mt-12">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Presentation className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl tracking-tight">
            Workshop not found.
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            The link may have expired or the code is wrong.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/">Back to The Reflection App</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (workshop.status === "ended") {
    return (
      <Card className="mt-12">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <h1 className="font-display text-2xl tracking-tight">
            This workshop has ended.
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Thanks for taking part. The board is now closed.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!name) return null;

  return (
    <div className="space-y-8 pt-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
            Workshop · {upper}
          </p>
          <h1 className="font-display text-3xl leading-tight tracking-tight md:text-4xl">
            {workshop.title}
          </h1>
          <Badge variant={workshop.status === "live" ? "primary" : "outline"}>
            {workshop.status === "live" ? "Live" : "Workshop"}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          Posting as{" "}
          <span className="font-medium text-foreground/85">{name}</span>
        </div>
      </div>

      <hr className="rule-soft" />

      <CollaborativeBoard
        boardId={board.id}
        authorName={name}
        mode="participant"
      />
    </div>
  );
}
