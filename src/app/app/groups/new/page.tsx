"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Sparkles } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GRADE_BANDS } from "@/lib/grade-bands";
import { ACCESS_TYPES } from "@/lib/access-types";
import { store } from "@/lib/storage";
import type { AccessType, GradeBand, RecordingMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gradeBand, setGradeBand] = useState<GradeBand>("6-8");
  const [accessType, setAccessType] = useState<AccessType>("name-only");
  const [language, setLanguage] = useState("en");
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("audio-or-text");
  const [greetingEnabled, setGreetingEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length >= 2 && !submitting;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const owner = store.ensureUser();
      const group = store.createGroup({
        name: name.trim(),
        ownerId: owner.id,
        gradeBand,
        accessType,
        language,
        recordingMode,
        greetingEnabled,
      });
      toast.success(`Group "${group.name}" created`);
      router.push(`/app/groups/${group.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't create group. Try again?");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>

      <div className="mb-8 flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-3xl tracking-tight">Create a group</h1>
          <p className="mt-1 text-foreground/75">
            A group is your class, cohort, or team. You'll assign reflection activities here.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Basics</CardTitle>
            <CardDescription>Give your group a name and a grade band.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                placeholder="e.g. Period 4 — Biology"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                maxLength={80}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Grade band</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {GRADE_BANDS.map((g) => {
                  const selected = gradeBand === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGradeBand(g.id)}
                      className={cn(
                        "rounded-2xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                        selected
                          ? "border-primary/60 bg-accent/60 shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.55)]"
                          : "border-border/70 hover:border-primary/30",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">{g.label}</div>
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          {g.range}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {g.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Access</CardTitle>
            <CardDescription>
              How participants join. We default to under-14-safe options.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ACCESS_TYPES.map((a) => {
              const selected = accessType === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAccessType(a.id)}
                  className={cn(
                    "w-full rounded-2xl border bg-card p-4 text-left transition-all",
                    selected
                      ? "border-primary/60 bg-accent/60"
                      : "border-border/70 hover:border-primary/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{a.label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {a.description}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
                        selected
                          ? "border-primary bg-primary"
                          : "border-border",
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Defaults</CardTitle>
            <CardDescription>
              Used as starting points when you create activities. You can override per activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Default language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default recording mode</Label>
                <Select
                  value={recordingMode}
                  onValueChange={(v) => setRecordingMode(v as RecordingMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audio-or-text">Audio or text</SelectItem>
                    <SelectItem value="audio-only">Audio only</SelectItem>
                    <SelectItem value="text-only">Text only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card p-4">
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Greeting on first reflection
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  A friendly welcome the first time a participant joins this group.
                </div>
              </div>
              <Switch
                checked={greetingEnabled}
                onCheckedChange={setGreetingEnabled}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-2 pb-4">
          <Button asChild variant="ghost" type="button">
            <Link href="/app">Cancel</Link>
          </Button>
          <Button type="submit" size="lg" disabled={!canSubmit}>
            Create group
          </Button>
        </div>
      </form>
    </div>
  );
}
