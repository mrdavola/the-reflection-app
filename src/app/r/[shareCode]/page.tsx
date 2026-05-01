"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ListChecks, Mic, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/storage";
import { getFocus } from "@/lib/focus-catalog";
import { getGradeBand } from "@/lib/grade-bands";
import { BrandMark } from "@/components/brand";
import { t, type Lang } from "@/lib/i18n/strings";
import type { GradeBand } from "@/lib/types";

function isSpanishLang(language?: string): boolean {
  if (!language) return false;
  return language === "Spanish" || language.toLowerCase().startsWith("es");
}

function greetingSubheadFor(gradeBand: GradeBand, lang: Lang): string {
  if (lang === "es") {
    switch (gradeBand) {
      case "k-2":
        return "Cuéntanos qué intentaste hoy.";
      case "3-5":
        return "Comparte en qué trabajaste y qué estás pensando.";
      case "6-8":
      case "9-12":
        return "Te haremos algunas preguntas cortas sobre lo que estás trabajando.";
      case "higher-ed":
        return "Algunas preguntas para ayudarte a darle sentido a tu aprendizaje.";
      case "professional":
        return "Una reflexión breve y enfocada sobre tu práctica.";
      case "adult":
      default:
        return "Tómate unos minutos para dar un paso atrás y pensar.";
    }
  }
  switch (gradeBand) {
    case "k-2":
      return "Tell us what you tried today.";
    case "3-5":
      return "Share what you worked on and what you're thinking.";
    case "6-8":
    case "9-12":
      return "We'll ask a few short questions about what you're working on.";
    case "higher-ed":
      return "A few prompts to help you make sense of your learning.";
    case "professional":
      return "A short, focused reflection on your practice.";
    case "adult":
    default:
      return "Take a few minutes to step back and think.";
  }
}

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
  const [testing, setTesting] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);

  const askForName = useMemo(() => {
    if (!group) return false;
    return group.accessType !== "anonymous";
  }, [group]);

  if (!activity || !group) {
    return (
      <Card className="mt-12">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl tracking-tight">
            This reflection link isn't active anymore.
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Ask your teacher for a fresh link, or check that the URL is correct.
            Your work is safe — it just lives behind a different door.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/">Back to The Reflection App</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const focus = getFocus(activity.focus);
  const gradeBand = getGradeBand(group.gradeBand);
  const promptCount = activity.prompts.length;

  const lang: Lang =
    isSpanishLang(activity.language) || isSpanishLang(group.language) ? "es" : "en";

  if (group.greetingEnabled && !greetingDismissed) {
    return (
      <div className="space-y-6 pt-4">
        <Card className="bg-gradient-to-br from-primary/[0.04] via-card to-secondary/[0.04]">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <BrandMark className="h-12 w-12" />
            <h1 className="font-display text-2xl tracking-tight sm:text-3xl">
              {t(lang, "greeting_welcome")}
            </h1>
            <p className="max-w-sm text-sm text-foreground/75">
              {greetingSubheadFor(group.gradeBand, lang)}
            </p>
            <Button
              size="lg"
              className="mt-2"
              onClick={() => setGreetingDismissed(true)}
            >
              {t(lang, "continue")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function testMicrophone() {
    setTesting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Your browser doesn't support microphone access. You can still type your answers.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      toast.success("Microphone is working. You're all set.");
    } catch {
      toast.error("Couldn't access your microphone. Check permissions, or type your answers instead.");
    } finally {
      setTesting(false);
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
    router.push(`/r/${shareCode}/run${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const namePlaceholder =
    group.accessType === "name-only"
      ? "First name + last initial (e.g. Jordan A.)"
      : "First name";

  return (
    <div className="space-y-8 pt-4">
      <div>
        <Badge variant="primary" className="mb-3">
          <Sparkles className="h-3 w-3" />
          {focus.emoji} {focus.label}
        </Badge>
        <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          {activity.title}
        </h1>
        <p className="mt-3 text-foreground/75">{activity.objective}</p>
      </div>

      <Card className="bg-gradient-to-br from-primary/[0.03] via-card to-secondary/[0.03]">
        <CardContent className="grid gap-3 py-5 text-sm sm:grid-cols-3">
          <Stat
            icon={<ListChecks className="h-4 w-4 text-primary" />}
            label="Prompts"
            value={`${promptCount}`}
          />
          <Stat
            icon={<Sparkles className="h-4 w-4 text-primary" />}
            label="Focus"
            value={focus.label}
          />
          <Stat
            icon={<Mic className="h-4 w-4 text-primary" />}
            label="Best for"
            value={gradeBand.label}
          />
        </CardContent>
      </Card>

      <div className="space-y-5">
        {askForName && (
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={namePlaceholder}
              maxLength={48}
            />
            <p className="text-xs text-muted-foreground">
              Only your teacher can see this. We don't ask for an email or login.
            </p>
          </div>
        )}

        {!askForName && (
          <Card>
            <CardContent className="py-5">
              <div className="text-sm">
                <span className="font-medium">Anonymous reflection.</span>{" "}
                <span className="text-muted-foreground">
                  Your teacher won't be able to attribute your answer to you.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Test your microphone</div>
              <p className="text-xs text-muted-foreground">
                Quick check before you start. You can also type your answers.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={testMicrophone}
              disabled={testing}
            >
              <Mic className="h-4 w-4" />
              {testing ? "Testing…" : "Test my microphone"}
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button size="lg" onClick={start}>
            Start
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card/80 px-4 py-3 ring-1 ring-border/60">
      <div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground">
        {icon}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
