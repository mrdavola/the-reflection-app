"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Presentation } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { store } from "@/lib/storage";

export default function NewWorkshopPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length >= 2 && prompt.trim().length >= 2 && !submitting;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const owner = store.ensureUser();
      const board = store.createBoard({
        workshopId: null,
        title: title.trim(),
        prompt: prompt.trim(),
      });
      const workshop = store.createWorkshop({
        title: title.trim(),
        joinCode: nanoid(6).toUpperCase(),
        facilitatorUserId: owner.id,
        boardId: board.id,
        status: "draft",
      });
      // link board back to workshop
      store.updateBoard(board.id, { workshopId: workshop.id });
      toast.success(`Workshop "${workshop.title}" created`);
      router.push(`/app/workshops/${workshop.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't create workshop. Try again?");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/workshops">
            <ArrowLeft className="h-4 w-4" />
            Back to workshops
          </Link>
        </Button>
      </div>

      <div className="mb-8 flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Presentation className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-3xl tracking-tight">New workshop</h1>
          <p className="mt-1 text-foreground/75">
            Give your session a title and an opening prompt. Participants will see
            the prompt above the shared board.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Workshop details</CardTitle>
            <CardDescription>
              You'll get a 6-character join code to share with the room.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="workshop-title">Title</Label>
              <Input
                id="workshop-title"
                placeholder="e.g. PD Day — Reflection routines"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                maxLength={80}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="board-prompt">Opening board prompt</Label>
              <Textarea
                id="board-prompt"
                placeholder="e.g. What's one routine you want to try this week?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                maxLength={280}
                required
              />
              <p className="text-xs text-muted-foreground">
                Keep it open-ended. You can change it later.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-2 pb-4">
          <Button asChild variant="ghost" type="button">
            <Link href="/app/workshops">Cancel</Link>
          </Button>
          <Button type="submit" size="lg" disabled={!canSubmit}>
            Create workshop
          </Button>
        </div>
      </form>
    </div>
  );
}
