import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Heart,
  Lightbulb,
  ListChecks,
  Mic,
  Sparkles,
  Users,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MarketingHome() {
  return (
    <div className="relative">
      <header className="px-6 py-5">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Brand href="/" />
          <nav className="flex items-center gap-3">
            <Link
              href="#how"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
            >
              How it works
            </Link>
            <Link
              href="#educators"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
            >
              For educators
            </Link>
            <Button asChild size="sm" variant="outline">
              <Link href="/app">Open app</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/app/personal">
                Try it
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6">
        <section className="grid items-center gap-12 py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-7">
            <Badge variant="primary" className="mb-5">
              <Sparkles className="h-3 w-3" />
              Reflection that earns its place in your week
            </Badge>
            <h1 className="font-display text-5xl leading-[1.04] tracking-tight text-foreground sm:text-6xl md:text-7xl">
              Turn student thinking into{" "}
              <span className="bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
                growth you can act on.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/75">
              The Reflection App is an AI reflection coach for learners and educators.
              Speak, type, or record a quick reflection. We surface what's
              working, what's stuck, and what to do next — with privacy-first
              defaults and a dashboard built for triage, not surveillance.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/app/personal">
                  Start a personal reflection
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/app/library">Browse the activity library</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5" /> No login needed for students
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" /> Under-14 safe defaults
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5" /> Works on Chromebooks & iPads
              </span>
            </div>
          </div>
          <div className="md:col-span-5">
            <ShowcaseCard />
          </div>
        </section>

        <section id="how" className="py-12">
          <h2 className="font-display text-3xl tracking-tight">How a reflection feels</h2>
          <p className="mt-2 text-muted-foreground">Three steps. Two minutes. One next move.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Step
              n={1}
              title="Pick a focus and say what you're working on"
              copy="Type or record. The AI generates short, specific prompts grounded in your objective."
              icon={<Sparkles className="h-5 w-5" />}
            />
            <Step
              n={2}
              title="Answer 2–3 prompts with audio or text"
              copy="A 15-second minimum nudges depth. We auto-transcribe so teachers can scan, not slog."
              icon={<Mic className="h-5 w-5" />}
            />
            <Step
              n={3}
              title="Get feedback, score, and a next step"
              copy="Mindset, tone, hidden lesson, possible bias — and one practical next move you can try tomorrow."
              icon={<Lightbulb className="h-5 w-5" />}
            />
          </div>
        </section>

        <section id="educators" className="py-16">
          <div className="grid gap-8 rounded-3xl border border-border/70 bg-gradient-to-br from-primary/[0.04] via-card to-secondary/[0.04] p-8 md:grid-cols-12 md:p-12">
            <div className="md:col-span-7">
              <Badge variant="secondary" className="mb-4">
                <Users className="h-3 w-3" />
                For educators
              </Badge>
              <h2 className="font-display text-3xl tracking-tight md:text-4xl">
                A dashboard built for triage — not surveillance.
              </h2>
              <p className="mt-3 text-foreground/75">
                Yellow-sunny, orange, blue. Scan one screen and know who needs a
                check-in, who's ready for extension, and what to do tomorrow.
                You read one summary instead of listening to 21 reflections.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {[
                  "Class-level summary with two paragraphs and concrete teacher moves",
                  "Color-coded student cards prioritise where you should look first",
                  "Real-time content alerts when a student mentions something serious",
                  "No-login mode and under-14 safe defaults — share via link, no accounts",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <ListChecks className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-5">
              <DashboardPreview />
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="rounded-3xl bg-gradient-to-br from-primary to-secondary p-10 text-center text-primary-foreground shadow-2xl md:p-16">
            <h2 className="font-display text-3xl tracking-tight md:text-5xl">
              Ready when you are.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
              Start with a personal reflection, then create your first group when you want to bring students or a team in.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/app/personal">
                  Reflect now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10"
              >
                <Link href="/app/groups/new">Create a group</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 px-6 py-8 text-xs text-muted-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
          <Brand href="/" className="text-sm" />
          <p>Reflection is a skill. The Reflection App makes it tractable.</p>
        </div>
      </footer>
    </div>
  );
}

function Step({
  n,
  title,
  copy,
  icon,
}: {
  n: number;
  title: string;
  copy: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="absolute right-5 top-5 text-5xl font-display font-semibold text-muted/40">
        0{n}
      </div>
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-xl tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{copy}</p>
    </div>
  );
}

function ShowcaseCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/30 via-secondary/20 to-transparent blur-2xl" />
      <div className="rounded-3xl bg-gradient-to-br from-primary to-secondary p-7 shadow-2xl">
        <div className="text-xs font-medium uppercase tracking-wider text-primary-foreground/70">
          Question 1 of 3 · Self-Authorship
        </div>
        <p className="mt-3 font-display text-2xl leading-snug text-primary-foreground sm:text-3xl">
          What choice did you make today that reflects how you want to learn?
        </p>
      </div>
      <div className="mt-3 rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground recording-pulse">
            <Mic className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-mono text-sm tabular-nums">0:21 / 0:15 minimum</div>
            <p className="text-xs text-muted-foreground">
              Keep going if you have more to say. Tap to finish.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
        <Badge variant="sunny">Level 4 · Strong</Badge>
        <p className="mt-3 text-sm leading-relaxed text-foreground/85">
          “Nice work. You named a specific moment and explained why it mattered to you. Next step: try writing the strongest counter-argument to your own answer — see if it still holds.”
        </p>
      </div>
    </div>
  );
}

function DashboardPreview() {
  const cards = [
    { name: "Aaliyah", color: "sunny" as const, level: 4, mindset: "growth", tone: "constructive" },
    { name: "Marcus", color: "orange" as const, level: 2, mindset: "uncertain", tone: "hesitant" },
    { name: "Priya", color: "sunny" as const, level: 3, mindset: "curious", tone: "motivated" },
    { name: "Diego", color: "blue" as const, level: 1, mindset: "frustrated", tone: "low-energy" },
  ];
  const colorMap: Record<typeof cards[number]["color"], string> = {
    sunny: "bg-triage-sunny-bg border-triage-sunny/30",
    orange: "bg-triage-orange-bg border-triage-orange/30",
    blue: "bg-triage-blue-bg border-triage-blue/40",
  };
  const dotMap: Record<typeof cards[number]["color"], string> = {
    sunny: "bg-triage-sunny",
    orange: "bg-triage-orange",
    blue: "bg-triage-blue",
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <div
          key={c.name}
          className={`rounded-2xl border p-4 ${colorMap[c.color]}`}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{c.name}</div>
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold text-white ${dotMap[c.color]}`}
            >
              {c.level}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-xs text-foreground/80">
            {c.mindset === "growth"
              ? "Names what they'll try next and why it matters."
              : c.mindset === "curious"
                ? "Connects today's lesson to a real-world question."
                : c.mindset === "uncertain"
                  ? "Surfaces specific confusion — worth a 2-min check-in."
                  : "Short, low-detail response — model a stronger one."}
          </p>
          <div className="mt-3 flex gap-1.5 text-[10px]">
            <span className="rounded-full bg-card px-2 py-0.5 ring-1 ring-border/60">
              {c.mindset}
            </span>
            <span className="rounded-full bg-card px-2 py-0.5 ring-1 ring-border/60">
              {c.tone}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
