import Link from "next/link";
import { ArrowLeft, Check, ShieldCheck, X } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClearLocalDataButton } from "./clear-local-data";

export const metadata = {
  title: "Privacy & district vetting",
  description:
    "How The Reflection App handles privacy, what district admins need to whitelist, and how to delete your local data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/30">
      <header className="px-6 pt-6">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-display text-base font-semibold tracking-tight"
          >
            <BrandMark className="h-7 w-7" />
            <span>The Reflection App</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Privacy
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">
          Privacy &amp; district vetting
        </h1>
        <p className="mt-3 text-foreground/75">
          A plain-language explanation of what The Reflection App does with student
          thinking — written so a parent or a district admin can read it once
          and feel oriented.
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl tracking-tight">
            Privacy summary for families
          </h2>
          <Card>
            <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-foreground/85">
              <p>
                The Reflection App is a reflection coach. Students answer 2–3 short
                prompts in their own words — by typing or recording — and the
                app gives back feedback, a rough understanding score, and one
                next step. Teachers see a triage dashboard so they know who
                might need a check-in.
              </p>
              <p>
                We are designed for the way classrooms actually work: most
                student reflections in this demo live in your browser&apos;s
                local storage, not on a server. Teachers can choose
                no-login, name-only, or anonymous modes for younger students.
              </p>
              <p>
                Reflection is meant to support a student, not surveil them.
                The Reflection App&apos;s dashboard is built for triage — fast scans of
                where to look first — not constant monitoring.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl tracking-tight">
            What we collect / What we don&apos;t
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Check className="h-4 w-4 text-triage-sunny" />
                  What we collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm text-foreground/85">
                <Item>The reflection text the user submits.</Item>
                <Item>
                  Optional audio (only if the user grants microphone access and
                  records a response).
                </Item>
                <Item>
                  A first name or chosen handle when the teacher uses
                  name-only mode.
                </Item>
                <Item>
                  Theme preference, display name, and locally cached AI
                  feedback in your browser.
                </Item>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <X className="h-4 w-4 text-triage-blue" />
                  What we don&apos;t
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm text-foreground/85">
                <Item>No advertising trackers and no third-party analytics on student pages.</Item>
                <Item>No video recording. Audio only, and only if the user opts in.</Item>
                <Item>
                  No accounts or PII for students under 14 — see the next
                  section.
                </Item>
                <Item>
                  No selling, sharing, or training of third-party models on
                  student reflections.
                </Item>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl tracking-tight">
            Under-14 policy
          </h2>
          <Card>
            <CardContent className="space-y-3 pt-6 text-sm leading-relaxed text-foreground/85">
              <p>
                Students under 14 do not create accounts in The Reflection App. There is
                no login flow for them, no email collection, and no profile
                that follows them between activities.
              </p>
              <p>
                Teachers running a reflection with a younger class use one of
                two modes:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>No-login (name-only)</strong> — students type their
                  first name once on a single activity link. No password, no
                  email.
                </li>
                <li>
                  <strong>Anonymous</strong> — no name at all. Teachers can
                  see the reflections in aggregate but cannot attribute them.
                </li>
              </ul>
              <p>
                Activity links are share-code based. They expire when the
                teacher archives the activity, and reflection records can be
                cleared at any time.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl tracking-tight">
            What an admin needs
          </h2>
          <Card>
            <CardContent className="space-y-4 pt-6 text-sm leading-relaxed text-foreground/85">
              <div>
                <h3 className="font-semibold text-foreground">Domains to whitelist</h3>
                <p className="mt-1">
                  For The Reflection App to work end-to-end on managed devices, allow:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    Mirror talk-style domains — for this demo deployment, that
                    means <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">vercel.app</code>{" "}
                    subdomains where the app is hosted.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">gateway.ai.vercel.app</code>{" "}
                    — used for AI feedback when the AI Gateway key is configured.
                    Without it, the app falls back to local heuristics and still works.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Browser permissions</h3>
                <p className="mt-1">
                  Microphone access is requested only when a student presses
                  record. Permission can be denied — they can always type
                  instead. No camera access is requested.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Browser support</h3>
                <p className="mt-1">
                  Tested on the last two versions of Chrome, Edge, Safari, and
                  Firefox. Works on managed Chromebooks, MacBooks, and iPads.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Data retention controls</h3>
                <p className="mt-1">
                  Teachers can delete an activity, a group, or a single
                  reflection at any time from the dashboard. Anyone using the
                  app can also clear all locally stored data with the button
                  below.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl tracking-tight">
            How to delete your data
          </h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clear all local The Reflection App data</CardTitle>
              <CardDescription>
                Removes user, groups, activities, participants, reflections,
                and cached summaries from this browser. This action can&apos;t be
                undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ClearLocalDataButton />
            </CardContent>
          </Card>
        </section>

        <div className="mt-12 flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to The Reflection App
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
      <span>{children}</span>
    </div>
  );
}
