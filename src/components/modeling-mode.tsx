"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FocusId } from "@/lib/types";

interface Props {
  objective: string;
  focus: FocusId;
  onSkip: () => void;
}

interface ExamplePair {
  weakResponse: string;
  weakFeedback: string;
  strongResponse: string;
  strongFeedback: string;
}

// Hardcoded examples tailored to a few common focuses. Anything else falls
// back to the problem-solving pair so the page never renders empty.
const EXAMPLES: Record<string, ExamplePair> = {
  retrieval: {
    weakResponse: "I learned some stuff about cells today. It was okay.",
    weakFeedback:
      "There's a real seed of an idea here. Try saying more about *why* this matters to you — and name one specific thing you can recall, like a part of a cell or a function. Even one detail will give your reflection more traction.",
    strongResponse:
      "Today I learned that mitochondria turn food into ATP, which is the energy cells actually use. The part that surprised me was that muscle cells have *way* more mitochondria than skin cells — that connects to why training makes you tire less. Next time I'll quiz myself on the steps before checking my notes.",
    strongFeedback:
      "Strong recall paired with a real-world connection. You named the function (ATP), a comparison (muscle vs. skin cells), and a concrete next step (self-quiz before notes). Push yourself further next time by adding one place this idea breaks down or surprises you. Keep going.",
  },
  "problem-solving": {
    weakResponse: "It was hard. I tried but couldn't get it.",
    weakFeedback:
      "There's a real seed of an idea here. Try saying more about *which step* was hard, what you actually tried, and what made it stuck. One concrete detail will turn this into a useful reflection you can act on.",
    strongResponse:
      "I got stuck on step 3 of the problem because I assumed both triangles were similar without checking the angles. Once I drew it again and labeled each angle, I saw they weren't. Next time I'll check my assumptions before I start substituting numbers — that's where the wheels came off.",
    strongFeedback:
      "Specific, honest, and forward-looking. You named the exact step that broke (step 3), the assumption underneath it (similarity without checking angles), and a concrete next move (label angles before substituting). That's the kind of reflection that actually changes what happens tomorrow. See you next reflection.",
  },
  "self-authorship": {
    weakResponse: "I want to do better. I'll try harder.",
    weakFeedback:
      "There's a real seed of an idea here. Try saying more about *what* you want to do better and *why* it matters to you. What's the value or version of yourself you're moving toward? Even one specific image will give this more weight.",
    strongResponse:
      "I noticed I keep saying yes to projects I don't actually care about, then resenting the work. What I'm realizing is that I've been letting other people's expectations shape my schedule. Next week I'm going to say no to the committee role and protect Friday afternoons for the writing I actually want to do. That feels uncomfortable but more like me.",
    strongFeedback:
      "This is real self-authorship — you named a pattern (saying yes out of obligation), traced it to a value (writing matters more than committee work), and committed to a concrete change (no to committee, yes to Friday afternoons). The discomfort you flagged is usually the signal you're moving in the right direction. Keep going.",
  },
};

function getExample(focus: FocusId): ExamplePair {
  return EXAMPLES[focus] ?? EXAMPLES["problem-solving"];
}

export function ModelingMode({ objective, focus, onSkip }: Props) {
  const example = getExample(focus);

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <Badge variant="primary" className="mb-1">
          Before you start
        </Badge>
        <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
          Here's what a strong reflection sounds like.
        </h2>
        <p className="max-w-2xl text-sm text-foreground/75">
          Read both quickly, then start your own. You don't need to copy them —
          just notice the difference between vague and specific.
        </p>
        {objective && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium uppercase tracking-wider">Objective:</span>{" "}
            {objective}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-destructive/30 bg-destructive/[0.04]">
          <CardHeader>
            <CardTitle className="font-display text-base">
              <span className="mr-2" aria-hidden>
                ❌
              </span>
              A weak reflection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <blockquote className="rounded-2xl bg-background/60 p-4 text-sm italic text-foreground/85 ring-1 ring-border/60">
              "{example.weakResponse}"
            </blockquote>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                What the AI would say
              </div>
              <p className="mt-1 text-sm text-foreground/85">
                {example.weakFeedback}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/40 bg-primary/[0.05]">
          <CardHeader>
            <CardTitle className="font-display text-base">
              <span className="mr-2" aria-hidden>
                ✅
              </span>
              A strong reflection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <blockquote className="rounded-2xl bg-background/60 p-4 text-sm italic text-foreground/85 ring-1 ring-border/60">
              "{example.strongResponse}"
            </blockquote>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                What the AI would say
              </div>
              <p className="mt-1 text-sm text-foreground/85">
                {example.strongFeedback}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-2 sm:justify-end">
        <Button size="lg" onClick={onSkip}>
          Got it — start my reflection
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default ModelingMode;
