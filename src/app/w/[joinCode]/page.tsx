"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Presentation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/storage";

interface Props {
  params: Promise<{ joinCode: string }>;
}

const NAME_KEY = (joinCode: string) => `reflection-app:workshop-name:${joinCode}`;

export default function WorkshopJoinPage({ params }: Props) {
  const { joinCode } = use(params);
  const router = useRouter();
  const upper = joinCode.toUpperCase();

  const workshop = useStore((s) =>
    s.workshops.find((w) => w.joinCode.toUpperCase() === upper),
  );
  const board = useStore((s) =>
    workshop ? s.boards.find((b) => b.id === workshop.boardId) : undefined,
  );

  const [name, setName] = useState("");

  if (!workshop || !board) {
    return (
      <Card className="mt-12">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Presentation className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl tracking-tight">
            That workshop code isn't active.
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Double-check the code with your facilitator. It's a 6-character
            code like <span className="font-mono">A1B2C3</span>.
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
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Presentation className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl tracking-tight">
            This workshop has ended.
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Thanks for being part of it. The board is now closed.
          </p>
        </CardContent>
      </Card>
    );
  }

  function start() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Add your first name to continue.");
      return;
    }
    try {
      sessionStorage.setItem(NAME_KEY(upper), trimmed);
    } catch {
      // ignore — board page will redirect if missing
    }
    router.push(`/w/${upper}/board`);
  }

  return (
    <div className="space-y-12 pt-8">
      <div className="space-y-3">
        <p className="margin-note uppercase tracking-[0.4em] text-[0.7rem]">
          Join workshop · {upper}
        </p>
        <h1 className="font-display text-5xl leading-[1.02] tracking-tight md:text-6xl">
          {workshop.title}
        </h1>
        <p className="font-display italic text-xl text-foreground/70">
          {board.prompt}
        </p>
      </div>

      <hr className="rule-soft" />

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="margin-note uppercase tracking-[0.18em] text-[0.65rem]">
            Your first name
          </Label>
          <Input
            id="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First name"
            maxLength={48}
            className="h-12 text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                start();
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Shown next to your notes. We don't ask for an email or login.
          </p>
        </div>

        <div className="flex justify-end">
          <Button size="lg" onClick={start}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
