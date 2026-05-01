"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Loader2,
  Mic,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { AudioRecorder } from "@/components/audio-recorder";
import { FocusSelector } from "@/components/focus-selector";
import { RubricEditor } from "@/components/rubric-editor";
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
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { generatePrompts } from "@/lib/api-client";
import { store, useStore } from "@/lib/storage";
import type {
  Activity,
  ActivityPrompt,
  FocusId,
  RecordingMode,
  Rubric,
  WorkspaceStep,
} from "@/lib/types";
import { cn, formatDuration } from "@/lib/utils";

const TIMING_OPTIONS = [
  { value: 0, label: "No limit" },
  { value: 30, label: "30s" },
  { value: 60, label: "1 min" },
  { value: 90, label: "90s" },
  { value: 120, label: "2 min" },
  { value: 180, label: "3 min" },
];

const MIN_SPEAKING_OPTIONS = [10, 15, 30, 60];

export default function ActivitySetupPage() {
  const params = useParams<{ id: string; activityId: string }>();
  const groupId = params.id;
  const activityId = params.activityId;
  const router = useRouter();

  const group = useStore((s) => s.groups.find((g) => g.id === groupId));
  const activity = useStore((s) => s.activities.find((a) => a.id === activityId));

  // Local form state
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [showRecorder, setShowRecorder] = useState(false);
  const [focus, setFocus] = useState<FocusId>("understanding");
  const [promptMode, setPromptMode] = useState<Activity["promptMode"]>("all-ai");
  const [promptCount, setPromptCount] = useState(3);
  const [timingPerPromptSeconds, setTimingPerPromptSeconds] = useState(0);
  const [minimumSpeakingSeconds, setMinimumSpeakingSeconds] = useState(15);
  const [language, setLanguage] = useState("en");
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("audio-or-text");
  const [feedbackVisibility, setFeedbackVisibility] =
    useState<Activity["feedbackVisibility"]>("show");
  const [scoreVisibility, setScoreVisibility] =
    useState<Activity["scoreVisibility"]>("show");
  const [prompts, setPrompts] = useState<ActivityPrompt[]>([]);
  const [workspaceEnabled, setWorkspaceEnabled] = useState(false);
  const [workspaceSteps, setWorkspaceSteps] = useState<WorkspaceStep[]>([]);
  const [rubric, setRubric] = useState<Rubric>({ enabled: false, criteria: [] });
  const [modelingEnabled, setModelingEnabled] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!activity || hydrated) return;
    setTitle(activity.title);
    setObjective(activity.objective);
    setFocus(activity.focus);
    setPromptMode(activity.promptMode);
    setPromptCount(Math.max(1, Math.min(5, activity.prompts.length || 3)));
    setTimingPerPromptSeconds(activity.timingPerPromptSeconds);
    setMinimumSpeakingSeconds(activity.minimumSpeakingSeconds);
    setLanguage(activity.language);
    setRecordingMode(activity.recordingMode);
    setFeedbackVisibility(activity.feedbackVisibility);
    setScoreVisibility(activity.scoreVisibility);
    setPrompts(activity.prompts);
    setWorkspaceEnabled(activity.workspaceEnabled);
    setWorkspaceSteps(activity.workspaceSteps);
    setRubric(activity.rubric ?? { enabled: false, criteria: [] });
    setModelingEnabled(activity.modelingEnabled ?? false);
    setHydrated(true);
  }, [activity, hydrated]);

  const showsAiGenerator = promptMode === "all-ai" || promptMode === "first-teacher-then-ai";

  const collectPatch = useMemo(
    () => (statusOverride?: Activity["status"]): Partial<Activity> => ({
      title: title.trim() || "Untitled activity",
      objective: objective.trim(),
      focus,
      promptMode,
      prompts,
      timingPerPromptSeconds,
      minimumSpeakingSeconds,
      language,
      recordingMode,
      feedbackVisibility,
      scoreVisibility,
      workspaceEnabled,
      workspaceSteps,
      rubric,
      modelingEnabled,
      ...(statusOverride ? { status: statusOverride } : {}),
    }),
    [
      title,
      objective,
      focus,
      promptMode,
      prompts,
      timingPerPromptSeconds,
      minimumSpeakingSeconds,
      language,
      recordingMode,
      feedbackVisibility,
      scoreVisibility,
      workspaceEnabled,
      workspaceSteps,
      rubric,
      modelingEnabled,
    ],
  );

  if (!group || !activity) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <CardTitle>Activity not found</CardTitle>
            <CardDescription>This activity may have been deleted.</CardDescription>
            <Button asChild className="mt-2">
              <Link href={`/app/groups/${groupId}`}>Back to group</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  function addPrompt(source: ActivityPrompt["source"] = "teacher", text = "") {
    setPrompts((cur) => [...cur, { id: nanoid(8), text, source }]);
  }

  function updatePrompt(id: string, text: string) {
    setPrompts((cur) => cur.map((p) => (p.id === id ? { ...p, text } : p)));
  }

  function removePrompt(id: string) {
    setPrompts((cur) => cur.filter((p) => p.id !== id));
  }

  function movePrompt(id: string, direction: -1 | 1) {
    setPrompts((cur) => {
      const idx = cur.findIndex((p) => p.id === id);
      if (idx === -1) return cur;
      const target = idx + direction;
      if (target < 0 || target >= cur.length) return cur;
      const next = cur.slice();
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  async function handleGeneratePrompts() {
    if (!objective.trim()) {
      toast.error("Add an objective first so we can tailor the prompts.");
      return;
    }
    setGenerating(true);
    try {
      const out = await generatePrompts({
        objective: objective.trim(),
        focus,
        gradeBand: group?.gradeBand,
        count: promptCount,
        language,
      });
      const generated: ActivityPrompt[] = out.prompts.map((text) => ({
        id: nanoid(8),
        text,
        source: "ai",
      }));
      // If we already have teacher prompts and mode is first-teacher-then-ai, append.
      // Otherwise replace AI prompts (keep teacher-authored ones at the top).
      setPrompts((cur) => {
        if (promptMode === "first-teacher-then-ai") {
          const teacherOnes = cur.filter((p) => p.source === "teacher");
          return [...teacherOnes, ...generated];
        }
        return generated;
      });
      toast.success(`Generated ${generated.length} prompt${generated.length === 1 ? "" : "s"}`);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't generate prompts. Try again?");
    } finally {
      setGenerating(false);
    }
  }

  function handleSaveDraft() {
    store.updateActivity(activity!.id, collectPatch("draft"));
    toast.success("Draft saved");
  }

  function handleAssign() {
    if (!objective.trim()) {
      toast.error("Add an objective before assigning.");
      return;
    }
    if (prompts.length === 0) {
      toast.error("Add at least one prompt before assigning.");
      return;
    }
    if (prompts.some((p) => p.text.trim().length === 0)) {
      toast.error("Every prompt needs some text.");
      return;
    }
    store.updateActivity(activity!.id, {
      ...collectPatch("assigned"),
      assignedAt: new Date().toISOString(),
    });
    toast.success("Activity assigned");
    router.push(`/app/groups/${group!.id}/activities/${activity!.id}/share`);
  }

  function handleClose() {
    handleSaveDraft();
    router.push(`/app/groups/${group!.id}`);
  }

  function addWorkspaceStep() {
    setWorkspaceSteps((cur) => [...cur, { id: nanoid(8), text: "" }]);
  }

  function updateWorkspaceStep(id: string, text: string) {
    setWorkspaceSteps((cur) =>
      cur.map((s) => (s.id === id ? { ...s, text } : s)),
    );
  }

  function removeWorkspaceStep(id: string) {
    setWorkspaceSteps((cur) => cur.filter((s) => s.id !== id));
  }

  return (
    <div className="mx-auto max-w-4xl pb-32">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/app/groups/${group.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to {group.name}
          </Link>
        </Button>
      </div>

      <div className="mb-8 space-y-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Activity title"
          className="border-0 bg-transparent px-0 font-display text-3xl tracking-tight shadow-none focus-visible:ring-0 md:text-4xl !h-auto"
          maxLength={120}
        />
        <p className="text-sm text-muted-foreground">
          Designing for {group.name} · {activity.status === "draft" ? "Draft" : "Assigned"}
        </p>
      </div>

      <div className="space-y-8">
        {/* Objective */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Objective</CardTitle>
            <CardDescription>
              What should learners reflect on? One or two sentences. Or record yourself
              and we'll transcribe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. Students will reflect on what surprised them in today's lab and identify a question worth exploring tomorrow."
              className="min-h-[120px]"
            />
            {showRecorder ? (
              <div className="rounded-2xl border border-dashed border-border/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Record your objective
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setShowRecorder(false)}
                  >
                    <X className="h-4 w-4" />
                    Hide
                  </Button>
                </div>
                <AudioRecorder
                  minimumSpeakingSeconds={0}
                  initialText={objective}
                  submitLabel="Use this transcript"
                  onComplete={(r) => {
                    if (r.text) setObjective(r.text);
                    setShowRecorder(false);
                    toast.success("Objective updated");
                  }}
                />
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRecorder(true)}
              >
                <Mic className="h-4 w-4" />
                Record instead
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Reflection focus */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Reflection focus</CardTitle>
            <CardDescription>
              Pick the lens that matches what you want learners to grow in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FocusSelector value={focus} onChange={setFocus} />
          </CardContent>
        </Card>

        {/* Reflection settings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Reflection settings</CardTitle>
            <CardDescription>
              Tune how prompts are generated, how long learners speak, and what they see.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Prompt mode</Label>
              <RadioGroup
                value={promptMode}
                onValueChange={(v) => setPromptMode(v as Activity["promptMode"])}
              >
                {(
                  [
                    {
                      id: "all-ai",
                      title: "All AI-generated",
                      copy: "We'll write prompts based on your objective and focus.",
                    },
                    {
                      id: "first-teacher-then-ai",
                      title: "First teacher, then AI",
                      copy: "You write the opener; we follow up with deeper prompts.",
                    },
                    {
                      id: "all-teacher",
                      title: "All teacher-written",
                      copy: "Every prompt is yours. AI stays out of prompt-writing.",
                    },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.id}
                    htmlFor={`pm-${opt.id}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-2xl border bg-card p-4 transition-colors",
                      promptMode === opt.id
                        ? "border-primary/60 bg-accent/60"
                        : "border-border/70 hover:border-primary/30",
                    )}
                  >
                    <RadioGroupItem value={opt.id} id={`pm-${opt.id}`} className="mt-1" />
                    <div>
                      <div className="text-sm font-semibold">{opt.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {opt.copy}
                      </div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prompt-count">Number of prompts</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="prompt-count"
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={promptCount}
                    onChange={(e) => setPromptCount(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="font-mono text-sm tabular-nums text-foreground/85">
                    {promptCount}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timing">Time per prompt</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="timing"
                    type="range"
                    min={0}
                    max={5}
                    step={1}
                    value={TIMING_OPTIONS.findIndex(
                      (t) => t.value === timingPerPromptSeconds,
                    )}
                    onChange={(e) =>
                      setTimingPerPromptSeconds(
                        TIMING_OPTIONS[Number(e.target.value)]?.value ?? 0,
                      )
                    }
                    className="flex-1 accent-primary"
                  />
                  <span className="font-mono text-sm tabular-nums text-foreground/85">
                    {TIMING_OPTIONS.find((t) => t.value === timingPerPromptSeconds)
                      ?.label ?? "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Minimum speaking time</Label>
              <div className="flex flex-wrap gap-2">
                {MIN_SPEAKING_OPTIONS.map((sec) => {
                  const selected = minimumSpeakingSeconds === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setMinimumSpeakingSeconds(sec)}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground/85 hover:border-primary/40",
                      )}
                    >
                      {formatDuration(sec)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Language</Label>
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
                <Label>Recording mode</Label>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Feedback visibility</Label>
                <Select
                  value={feedbackVisibility}
                  onValueChange={(v) =>
                    setFeedbackVisibility(v as Activity["feedbackVisibility"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="show">Show full feedback</SelectItem>
                    <SelectItem value="summary">Summary only</SelectItem>
                    <SelectItem value="hide">Hide from learner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Score visibility</Label>
                <Select
                  value={scoreVisibility}
                  onValueChange={(v) =>
                    setScoreVisibility(v as Activity["scoreVisibility"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="show">Show score</SelectItem>
                    <SelectItem value="hide">Hide score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card/60 p-4">
              <div className="space-y-1">
                <Label
                  htmlFor="modeling-enabled"
                  className="text-sm font-semibold"
                >
                  Show students a model reflection first
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display a quick weak vs. strong example before the first
                  prompt so students hear what good reflection sounds like.
                </p>
              </div>
              <Switch
                id="modeling-enabled"
                checked={modelingEnabled}
                onCheckedChange={setModelingEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Prompts */}
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="font-display">Prompts</CardTitle>
              <CardDescription>
                {showsAiGenerator
                  ? "Generate, edit, and reorder. Add your own anytime."
                  : "Write the prompts you want learners to answer."}
              </CardDescription>
            </div>
            {showsAiGenerator && (
              <Button
                type="button"
                variant="outline"
                onClick={handleGeneratePrompts}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate prompts
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {prompts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                <Sparkles className="h-5 w-5 text-primary" />
                {showsAiGenerator
                  ? "No prompts yet. Generate from your objective, or add one manually."
                  : "Add the prompts you want learners to answer."}
              </div>
            ) : (
              <ul className="space-y-2">
                {prompts.map((p, idx) => (
                  <li
                    key={p.id}
                    className="rounded-2xl border border-border/70 bg-card p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
                        {idx + 1}
                      </span>
                      <Textarea
                        value={p.text}
                        onChange={(e) => updatePrompt(p.id, e.target.value)}
                        placeholder="Type your prompt…"
                        className="min-h-[60px]"
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Move up"
                          onClick={() => movePrompt(p.id, -1)}
                          disabled={idx === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Move down"
                          onClick={() => movePrompt(p.id, 1)}
                          disabled={idx === prompts.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Remove prompt"
                          onClick={() => removePrompt(p.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-1 pl-9 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {p.source === "ai" ? "AI-generated" : "Teacher-written"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => addPrompt("teacher")}
              disabled={prompts.length >= 5}
            >
              <Plus className="h-4 w-4" />
              Add prompt
            </Button>
          </CardContent>
        </Card>

        {/* Rubric */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Rubric</CardTitle>
            <CardDescription>
              Optional. Define 3–6 criteria and AI feedback will rate the
              reflection on each, with a short evidence quote.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RubricEditor value={rubric} onChange={setRubric} />
          </CardContent>
        </Card>

        {/* Workspace */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="font-display">Pre-reflection workspace</CardTitle>
                <CardDescription>
                  Optional steps learners complete before reflecting — like notes,
                  evidence, or a quick warm-up.
                </CardDescription>
              </div>
              <Switch
                checked={workspaceEnabled}
                onCheckedChange={setWorkspaceEnabled}
              />
            </div>
          </CardHeader>
          {workspaceEnabled && (
            <CardContent className="space-y-3">
              {workspaceSteps.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                  Add a step to walk learners through before they reflect.
                </div>
              ) : (
                <ul className="space-y-2">
                  {workspaceSteps.map((step, idx) => (
                    <li
                      key={step.id}
                      className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-3"
                    >
                      <span className="mt-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
                        {idx + 1}
                      </span>
                      <Input
                        value={step.text}
                        onChange={(e) =>
                          updateWorkspaceStep(step.id, e.target.value)
                        }
                        placeholder="e.g. Re-read your draft and underline one strong sentence."
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Remove step"
                        onClick={() => removeWorkspaceStep(step.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <Button type="button" variant="ghost" onClick={addWorkspaceStep}>
                <Plus className="h-4 w-4" />
                Add step
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Close
          </Button>
          <Button type="button" variant="outline" onClick={handleSaveDraft}>
            Save draft
          </Button>
          <Button type="button" size="lg" onClick={handleAssign}>
            <Send className="h-4 w-4" />
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
}
