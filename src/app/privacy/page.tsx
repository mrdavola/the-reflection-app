import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ClearLocalDataButton } from "./clear-local-data";

export const metadata = {
  title: "Privacy & district vetting",
  description:
    "How Refleckt handles privacy, what district admins need to whitelist, and how to delete your local data.",
};

export default function PrivacyPage() {
  return (
    <div className="relative">
      <header className="px-6 pt-6 pb-4">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <Brand href="/" />
          <p className="margin-note hidden uppercase not-italic tracking-[0.18em] text-[0.7rem] text-muted-foreground sm:block">
            Privacy &amp; district vetting
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-12 md:py-16">
        <p className="margin-note mb-6 not-italic uppercase tracking-[0.18em] text-[0.7rem] text-muted-foreground">
          No.&nbsp;02 — A note on privacy
        </p>
        <h1 className="font-display text-[clamp(2.5rem,5.2vw,4.25rem)] font-medium leading-[1.04] tracking-[-0.02em] text-foreground">
          Privacy &amp;{" "}
          <em className="marginalia--ink marginalia not-italic">district vetting</em>.
        </h1>
        <p className="prose-measure mt-6 text-[1.0625rem] leading-relaxed text-foreground/75">
          A plain-language explanation of what Refleckt does with student
          thinking — written so a parent or a district admin can read it once
          and feel oriented.
        </p>

        <hr className="rule-soft my-12" />

        <Section
          number="01"
          eyebrow="For families"
          title="Privacy summary"
        >
          <p>
            Refleckt is a reflection coach. Students answer two or three short
            prompts in their own words — by typing or recording — and the app
            gives back feedback, a rough understanding score, and one next
            step. Teachers see a triage dashboard so they know who might need
            a check-in.
          </p>
          <p>
            We are designed for the way classrooms actually work: most student
            reflections in this demo live in your browser&rsquo;s local
            storage, not on a server. Teachers can choose no-login, name-only,
            or anonymous modes for younger students.
          </p>
          <p>
            Reflection is meant to support a student, not surveil them.
            Refleckt&rsquo;s dashboard is built for triage — fast scans of
            where to look first — not constant monitoring.
          </p>
        </Section>

        <hr className="rule-soft my-12" />

        <Section
          number="02"
          eyebrow="The shape of the data"
          title="What we collect, what we don&rsquo;t"
        >
          <p>What we collect:</p>
          <ul>
            <li>The reflection text the user submits.</li>
            <li>
              Optional audio — only if the user grants microphone access and
              records a response.
            </li>
            <li>
              A first name or chosen handle when the teacher uses name-only
              mode.
            </li>
            <li>
              Theme preference, display name, and locally cached AI feedback
              in your browser.
            </li>
          </ul>
          <p>What we don&rsquo;t:</p>
          <ul>
            <li>
              No advertising trackers, and no third-party analytics on student
              pages.
            </li>
            <li>
              No video recording. Audio only, and only when the user opts in.
            </li>
            <li>No accounts or PII for students under 14 — see No. 03.</li>
            <li>
              No selling, sharing, or training of third-party models on
              student reflections.
            </li>
          </ul>
        </Section>

        <hr className="rule-soft my-12" />

        <Section number="03" eyebrow="Younger students" title="Under-14 policy">
          <p>
            Students under 14 do not create accounts in Refleckt. There is no
            login flow for them, no email collection, and no profile that
            follows them between activities.
          </p>
          <p>Teachers running a reflection with a younger class use one of two modes:</p>
          <ul>
            <li>
              <em className="marginalia not-italic">No-login (name-only)</em>{" "}
              — students type their first name once on a single activity link.
              No password, no email.
            </li>
            <li>
              <em className="marginalia not-italic">Anonymous</em> — no name
              at all. Teachers can see the reflections in aggregate but cannot
              attribute them.
            </li>
          </ul>
          <p>
            Activity links are share-code based. They expire when the teacher
            archives the activity, and reflection records can be cleared at
            any time.
          </p>
        </Section>

        <hr className="rule-soft my-12" />

        <Section
          number="04"
          eyebrow="For administrators"
          title="What an admin needs"
        >
          <h3 className="font-display text-xl tracking-tight text-foreground">
            Domains to whitelist
          </h3>
          <p>For Refleckt to work end-to-end on managed devices, allow:</p>
          <ul>
            <li>
              The Vercel-hosted subdomain where this deployment lives —
              typically a{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8125rem] text-foreground">
                vercel.app
              </code>{" "}
              host.
            </li>
            <li>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8125rem] text-foreground">
                gateway.ai.vercel.app
              </code>{" "}
              — used for AI feedback when the AI Gateway key is configured.
              Without it, the app falls back to local heuristics and still
              works.
            </li>
          </ul>

          <h3 className="font-display text-xl tracking-tight text-foreground">
            Browser permissions
          </h3>
          <p>
            Microphone access is requested only when a student presses
            record. Permission can be denied — they can always type instead.
            No camera access is requested.
          </p>

          <h3 className="font-display text-xl tracking-tight text-foreground">
            Browser support
          </h3>
          <p>
            Tested on the last two versions of Chrome, Edge, Safari, and
            Firefox. Works on managed Chromebooks, MacBooks, and iPads.
          </p>

          <h3 className="font-display text-xl tracking-tight text-foreground">
            Data retention controls
          </h3>
          <p>
            Teachers can delete an activity, a group, or a single reflection
            at any time from the dashboard. Anyone using the app can also
            clear all locally stored data with the button below.
          </p>
        </Section>

        <hr className="rule-soft my-12" />

        <Section
          number="05"
          eyebrow="Your data, your move"
          title="How to delete your data"
        >
          <p>
            The button below removes the local Refleckt user, groups,
            activities, participants, reflections, and cached summaries from
            this browser. The action can&rsquo;t be undone.
          </p>
          <div className="mt-6 not-prose">
            <ClearLocalDataButton />
          </div>
        </Section>

        <hr className="rule-soft my-12" />

        <div className="flex justify-center pb-8">
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-10 text-xs text-muted-foreground">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3">
          <Brand href="/" className="text-sm" />
          <p className="font-display italic text-[0.875rem] text-foreground/70">
            Reflection is a skill. We make it tractable.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function Section({
  number,
  eyebrow,
  title,
  children,
}: {
  number: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 md:grid-cols-12">
      <div className="md:col-span-3">
        <p className="font-display text-[2.25rem] leading-none font-medium text-muted-foreground/70 tabular-nums tracking-tight">
          {number}
        </p>
        <p className="margin-note mt-2 not-italic uppercase tracking-[0.18em] text-[0.7rem] text-muted-foreground">
          {eyebrow}
        </p>
      </div>
      <div className="md:col-span-9">
        <h2
          className="font-display text-[clamp(1.75rem,2.4vw,2.25rem)] font-medium leading-[1.1] tracking-tight text-foreground"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        <div className="prose-measure mt-5 space-y-4 text-[1rem] leading-relaxed text-foreground/80 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h3]:mt-8 [&_h3:first-child]:mt-0 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:marker:text-foreground/40">
          {children}
        </div>
      </div>
    </section>
  );
}
