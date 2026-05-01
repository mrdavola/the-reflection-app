"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LibraryBig, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { store, useStore } from "@/lib/storage";

export default function NewActivityPage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;
  const router = useRouter();
  const group = useStore((s) => s.groups.find((g) => g.id === groupId));

  if (!group) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <CardTitle>Group not found</CardTitle>
            <CardDescription>This group may have been deleted.</CardDescription>
            <Button asChild className="mt-2">
              <Link href="/app">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  function startFromScratch() {
    if (!group) return;
    const a = store.createActivity({
      groupId: group.id,
      title: "Untitled activity",
      objective: "",
      focus: "understanding",
      language: group.language,
      prompts: [],
      promptMode: "all-ai",
      timingPerPromptSeconds: 0,
      minimumSpeakingSeconds: 15,
      recordingMode: group.recordingMode,
      workspaceEnabled: false,
      workspaceSteps: [],
      feedbackVisibility: "show",
      scoreVisibility: "show",
      status: "draft",
    });
    toast.success("Draft activity created");
    router.push(`/app/groups/${group.id}/activities/${a.id}/setup`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/app/groups/${group.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to {group.name}
          </Link>
        </Button>
      </div>

      <div className="mb-10">
        <h1 className="font-display text-3xl tracking-tight md:text-4xl">
          New activity
        </h1>
        <p className="mt-2 text-foreground/75">
          Pick a starting point. You can edit anything before you assign.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href={`/app/library?from=group&groupId=${group.id}`}
          className="group flex h-full flex-col gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-secondary">
              <LibraryBig className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-xl tracking-tight">
                Start from a template
              </div>
              <div className="text-xs text-muted-foreground">
                Curated activities, edit anything
              </div>
            </div>
          </div>
          <p className="text-sm text-foreground/80">
            Browse the library — exit tickets, project check-ins, SEL, debate, AI ethics.
            Pick one and we'll copy it into this group as a draft.
          </p>
          <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-secondary group-hover:translate-x-0.5 transition-transform">
            Browse library
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <button
          type="button"
          onClick={startFromScratch}
          className="group flex h-full flex-col gap-4 rounded-3xl border border-border/70 bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Wand2 className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-xl tracking-tight">
                Start from scratch
              </div>
              <div className="text-xs text-muted-foreground">
                You set the objective; AI helps with prompts
              </div>
            </div>
          </div>
          <p className="text-sm text-foreground/80">
            Type or speak your objective, choose a focus, and we'll generate
            tailored prompts. Great when you have something specific in mind.
          </p>
          <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:translate-x-0.5 transition-transform">
            <Sparkles className="h-4 w-4" />
            Build it
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </div>
    </div>
  );
}
