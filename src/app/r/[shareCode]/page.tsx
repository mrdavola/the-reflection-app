"use client";

/**
 * Share-link intro screen.
 *
 * Same shape as the personal setup screen, but instead of picking a focus the
 * student is told what they're joining and given a single Begin button. Name
 * input shown only when the group is non-anonymous.
 */

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mic } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RippleField } from "@/components/ambient";
import { useStore } from "@/lib/storage";
import { getFocus } from "@/lib/focus-catalog";

interface Props {
  params: Promise<{ shareCode: string }>;
}

export default function ShareEntryPage({ params }: Props) {
  const { shareCode } = use(params);
  const router = useRouter();

  const activity = useStore((s) =>
    s.activities.find((a) => a.shareCode === shareCode),
  );
  const group = useStore((s) =>
    activity ? s.groups.find((g) => g.id === activity.groupId) : undefined,
  );

  const [name, setName] = useState("");
  const [testingMic, setTestingMic] = useState(false);

  const askForName = useMemo(() => {
    if (!group) return false;
    return group.accessType !== "anonymous";
  }, [group]);

  if (!activity || !group) {
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">Reflection link</p>
        <h1 className="font-display text-[2.25rem] md:text-[2.625rem] leading-[1.15] tracking-[-0.018em]">
          This link isn&rsquo;t active anymore.
        </h1>
        <p className="text-foreground/70 max-w-prose">
          Ask your teacher for a fresh link, or check the URL. Your work is
          safe — it just lives behind a different door.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-foreground/60 hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-3 w-3" />
          Back to Refleckt
        </Link>
      </div>
    );
  }

  const focusMeta = getFocus(activity.focus);

  async function testMicrophone() {
    setTestingMic(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Your browser doesn't support microphone access.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      toast.success("Microphone is working. You're all set.");
    } catch {
      toast.error("Couldn't access your microphone. Check permissions.");
    } finally {
      setTestingMic(false);
    }
  }

  function start() {
    if (askForName && !name.trim()) {
      toast.error("Add your first name to continue.");
      return;
    }
    const trimmed = name.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("name", trimmed);
    router.push(
      `/r/${shareCode}/run${params.toString() ? `?${params.toString()}` : ""}`,
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-24 h-[26rem] w-[26rem] opacity-70"
      >
        <RippleField intensity={0.04} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-[1] mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col justify-center gap-12 px-6 py-24"
      >
        <header className="space-y-4">
          <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
            Joining: {group.name} · {activity.title}
          </p>
          <h1 className="font-display text-[2.5rem] md:text-[3.25rem] leading-[1.05] tracking-[-0.02em] max-w-3xl">
            {activity.objective}
          </h1>
          <p className="text-foreground/70 max-w-prose">
            A short reflection — {activity.prompts.length}{" "}
            {activity.prompts.length === 1 ? "question" : "questions"}, focused on{" "}
            <span className="text-foreground/90">{focusMeta.label}</span>. Speak
            when you&rsquo;re ready.
          </p>
        </header>

        <section className="space-y-5">
          {askForName ? (
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="margin-note uppercase tracking-[0.3em] text-[0.7rem]"
              >
                Your name
              </Label>
              <Input
                id="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  group.accessType === "name-only"
                    ? "First name + last initial (e.g. Jordan A.)"
                    : "First name"
                }
                maxLength={48}
                className="h-12 text-[1rem]"
              />
              <p className="text-[0.75rem] text-foreground/50">
                Only your teacher sees this. No email, no login.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 bg-surface px-5 py-4">
              <p className="text-[0.875rem] text-foreground/80">
                <span className="text-foreground">Anonymous reflection.</span>{" "}
                <span className="text-foreground/60">
                  Your teacher won&rsquo;t be able to attribute your answer to you.
                </span>
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={testMicrophone}
            disabled={testingMic}
            className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground transition-colors"
          >
            <Mic className="h-3 w-3" />
            {testingMic ? "Testing…" : "Test my microphone"}
          </button>
        </section>

        <div className="flex justify-end">
          <Button onClick={start} size="lg">
            Begin
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
