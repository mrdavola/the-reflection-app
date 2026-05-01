import Link from "next/link";
import { ArrowRight, Mic } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function MarketingHome() {
  return (
    <div className="relative">
      <header className="px-6 pt-6 pb-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Brand href="/" />
          <nav className="flex items-center gap-5">
            <Link
              href="#how"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              How it works
            </Link>
            <Link
              href="#educators"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              For educators
            </Link>
            <Button asChild size="sm" variant="ghost">
              <Link href="/app">Sign in</Link>
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
        {/* ---------- Hero ---------- */}
        <section className="grid items-start gap-14 pt-12 pb-20 md:grid-cols-12 md:gap-12 md:pt-20 md:pb-32">
          <div className="md:col-span-7">
            <p className="margin-note mb-6 not-italic uppercase tracking-[0.18em] text-[0.7rem] text-muted-foreground">
              No.&nbsp;01 — A reflection coach
            </p>
            <h1 className="font-display text-[clamp(2.5rem,5.6vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.02em] text-foreground">
              Reflection is a skill.
              <br />
              We make it{" "}
              <em className="marginalia not-italic">tractable</em>.
            </h1>
            <p className="prose-measure mt-7 text-[1.0625rem] leading-relaxed text-foreground/75">
              Refleckt is a quiet companion for the moments after the lesson.
              Two minutes, two prompts, one next step — for the student who
              just finished, and for the teacher reading twenty-one of them
              before the next bell.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/app/personal">
                  Begin a reflection
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/app/library">Browse the library →</Link>
              </Button>
            </div>

            <dl className="prose-measure mt-12 grid grid-cols-3 gap-x-8 gap-y-2 border-t border-border pt-6 text-[0.8125rem]">
              <div>
                <dt className="text-muted-foreground">For students</dt>
                <dd className="mt-0.5 text-foreground">No login.</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Under-14</dt>
                <dd className="mt-0.5 text-foreground">Safe by default.</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Devices</dt>
                <dd className="mt-0.5 text-foreground">Chromebook, iPad.</dd>
              </div>
            </dl>
          </div>

          {/* Hero sample — quiet, paper-stacked. */}
          <aside className="md:col-span-5">
            <SampleStack />
          </aside>
        </section>

        <hr className="rule-soft" />

        {/* ---------- How it feels ---------- */}
        <section id="how" className="py-20 md:py-28">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="margin-note mb-2 uppercase not-italic tracking-[0.18em] text-[0.7rem] text-muted-foreground">
                The loop
              </p>
              <h2 className="font-display text-[clamp(2rem,3.4vw,3rem)] font-medium leading-[1.05] tracking-tight">
                How a reflection<br />
                <em className="not-italic marginalia--ink marginalia">feels</em>.
              </h2>
              <p className="prose-measure mt-4 text-foreground/70">
                Three steps. Two minutes. One next move — the kind a student
                can actually take tomorrow.
              </p>
            </div>

            <ol className="md:col-span-8 md:pl-12">
              <Step
                index={1}
                title="Pick a focus, say what you&rsquo;re working on"
                copy="Type or record. The coach generates short, specific prompts grounded in the objective you chose — not a generic check-in."
              />
              <Step
                index={2}
                title="Answer two or three prompts"
                copy="Audio or text, fifteen seconds minimum. Auto-transcribed so a teacher can scan in seconds, not slog through twenty recordings."
              />
              <Step
                index={3}
                title="Receive feedback, a score, a next step"
                copy="Mindset, tone, the hidden lesson, possible bias — and one practical move to try in the next class. No homework, no badges."
                last
              />
            </ol>
          </div>
        </section>

        <hr className="rule-soft" />

        {/* ---------- Educators ---------- */}
        <section id="educators" className="py-20 md:py-28">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-7">
              <p className="margin-note mb-2 uppercase not-italic tracking-[0.18em] text-[0.7rem] text-muted-foreground">
                For educators
              </p>
              <h2 className="font-display text-[clamp(2rem,3.4vw,3rem)] font-medium leading-[1.04] tracking-tight">
                A dashboard built for{" "}
                <em className="marginalia not-italic">triage</em>,
                <br />
                not surveillance.
              </h2>
              <p className="prose-measure mt-5 text-foreground/75">
                Sunny, orange, dusty blue. One screen tells you who needs a
                check-in, who&rsquo;s ready for extension, and what to do
                tomorrow — so you read one summary instead of listening to
                twenty-one reflections.
              </p>

              <ul className="prose-measure mt-8 space-y-4">
                <Bullet
                  k="Class summary"
                  v="Two paragraphs and concrete teacher moves — written for the next class, not for the file cabinet."
                />
                <Bullet
                  k="Triage cards"
                  v="Color-coded by status, ordered by where to look first. Names, not avatars."
                />
                <Bullet
                  k="Real-time alerts"
                  v="If a student writes something serious, you hear about it before the bell rings."
                />
                <Bullet
                  k="Privacy by default"
                  v="No-login mode and under-14 safe defaults. Share via link, no accounts created."
                />
              </ul>
            </div>

            <aside className="md:col-span-5 md:pl-4">
              <DashboardSample />
            </aside>
          </div>
        </section>

        <hr className="rule-soft" />

        {/* ---------- Closing ---------- */}
        <section className="py-24 md:py-36">
          <div className="mx-auto max-w-2xl text-center">
            <p className="margin-note mb-3 uppercase not-italic tracking-[0.18em] text-[0.7rem] text-muted-foreground">
              When you&rsquo;re ready
            </p>
            <h2 className="font-display text-[clamp(2.25rem,4.4vw,3.75rem)] font-medium leading-[1.04] tracking-tight">
              Begin with one quiet
              <br />
              <em className="marginalia--ink marginalia not-italic">two-minute</em>{" "}
              reflection.
            </h2>
            <p className="mt-5 text-foreground/70">
              Bring a class in later, when it earns its place.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/app/personal">
                  Reflect now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/app/groups/new">Create a group</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-10 text-xs text-muted-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <Brand href="/" className="text-sm" />
          <p className="font-display italic text-[0.875rem]">
            Reflection is a skill. We make it tractable.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function Step({
  index,
  title,
  copy,
  last,
}: {
  index: number;
  title: string;
  copy: string;
  last?: boolean;
}) {
  return (
    <li
      className={`grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-border py-7 ${
        last ? "border-b" : ""
      }`}
    >
      <span className="font-display text-[2.25rem] leading-none font-medium text-muted-foreground/70 tabular-nums tracking-tight">
        {String(index).padStart(2, "0")}
      </span>
      <div>
        <h3
          className="font-display text-xl leading-snug tracking-tight"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        <p className="mt-2 max-w-prose text-[0.9375rem] text-foreground/70">
          {copy}
        </p>
      </div>
    </li>
  );
}

function Bullet({ k, v }: { k: string; v: string }) {
  return (
    <li className="grid grid-cols-[8.5rem_1fr] gap-x-5 border-t border-border pt-3">
      <span className="margin-note pt-0.5 text-foreground">{k}</span>
      <span className="text-[0.9375rem] text-foreground/75">{v}</span>
    </li>
  );
}

function SampleStack() {
  return (
    <div className="relative">
      {/* Card 1 — the prompt. */}
      <div className="rounded-lg border border-border bg-card p-7 shadow-[0_1px_0_oklch(0.88_0.010_78),0_24px_60px_-32px_oklch(0.30_0.030_252_/_0.18)]">
        <p className="margin-note text-[0.7rem] uppercase tracking-[0.16em] not-italic text-muted-foreground">
          Question 01 of 03 · Self-authorship
        </p>
        <p className="mt-4 font-display text-[1.625rem] leading-[1.18] tracking-tight text-foreground">
          What choice did you make today that reflects how you{" "}
          <em className="marginalia not-italic">want</em> to learn?
        </p>
      </div>

      {/* Card 2 — recording. Slight overlap to feel hand-stacked. */}
      <div className="relative -mt-3 ml-6 rounded-lg border border-border bg-card p-5 shadow-[0_1px_0_oklch(0.88_0.010_78)]">
        <div className="flex items-center gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-destructive/10 text-destructive recording-pulse">
            <Mic className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <div className="font-mono text-[0.8125rem] tabular-nums text-foreground">
              0:21 <span className="text-muted-foreground">/ 0:15 minimum</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Keep going if there&rsquo;s more. Tap to finish.
            </p>
          </div>
        </div>
      </div>

      {/* Card 3 — feedback. */}
      <div className="relative -mt-3 -ml-3 rounded-lg border border-border bg-card p-6 shadow-[0_1px_0_oklch(0.88_0.010_78)]">
        <div className="flex items-baseline justify-between gap-3">
          <p className="margin-note text-[0.7rem] uppercase tracking-[0.16em] not-italic text-muted-foreground">
            Coach&rsquo;s note
          </p>
          <span className="font-display text-[0.8125rem] text-[oklch(0.55_0.130_75)]">
            Level 4 · Strong
          </span>
        </div>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-foreground/85">
          You named a specific moment and explained why it mattered.
          <em className="font-display italic text-foreground"> Next: </em>
          write the strongest counter-argument to your own answer — see if it
          still holds.
        </p>
      </div>
    </div>
  );
}

function DashboardSample() {
  const cards: Array<{
    name: string;
    color: "sunny" | "orange" | "blue";
    level: number;
    note: string;
  }> = [
    {
      name: "Aaliyah",
      color: "sunny",
      level: 4,
      note: "Names what she&rsquo;ll try next, and why it matters.",
    },
    {
      name: "Marcus",
      color: "orange",
      level: 2,
      note: "Surfaces specific confusion — worth a 2-min check-in.",
    },
    {
      name: "Priya",
      color: "sunny",
      level: 3,
      note: "Connects today&rsquo;s lesson to a real-world question.",
    },
    {
      name: "Diego",
      color: "blue",
      level: 1,
      note: "Short, low-detail. Model a stronger answer aloud tomorrow.",
    },
  ];

  const dot: Record<typeof cards[number]["color"], string> = {
    sunny: "bg-[oklch(0.78_0.130_85)]",
    orange: "bg-[oklch(0.65_0.150_45)]",
    blue: "bg-[oklch(0.55_0.090_245)]",
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <p className="margin-note text-[0.7rem] uppercase tracking-[0.16em] not-italic text-muted-foreground">
          Period 4 · Mr Davola
        </p>
        <p className="text-[0.7rem] text-muted-foreground tabular-nums">21 students</p>
      </div>
      <h3 className="mt-3 font-display text-lg leading-snug tracking-tight">
        Most students named a specific moment.{" "}
        <em className="marginalia not-italic">Two</em> need a check-in.
      </h3>

      <ul className="mt-5 grid gap-2.5">
        {cards.map((c) => (
          <li
            key={c.name}
            className="grid grid-cols-[auto_auto_1fr] items-center gap-3 border-t border-border pt-2.5 text-sm"
          >
            <span
              aria-hidden
              className={`h-2.5 w-2.5 rounded-full ${dot[c.color]}`}
            />
            <span className="w-20 font-medium tabular-nums">{c.name}</span>
            <span
              className="line-clamp-1 text-foreground/70 text-[0.8125rem]"
              dangerouslySetInnerHTML={{ __html: c.note }}
            />
            <span className="col-start-3 -mt-2 hidden text-[0.7rem] text-muted-foreground tabular-nums sm:block">
              level {c.level}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
