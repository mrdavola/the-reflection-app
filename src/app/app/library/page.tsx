"use client";

export const dynamic = "force-dynamic";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Filter, GraduationCap, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVITY_TEMPLATES, type ActivityTemplate } from "@/lib/templates";
import { FOCUS_OPTIONS, getFocus } from "@/lib/focus-catalog";
import { GRADE_BANDS } from "@/lib/grade-bands";
import { store, useStore } from "@/lib/storage";
import type { GradeBand } from "@/lib/types";

const CATEGORIES = Array.from(
  new Set(ACTIVITY_TEMPLATES.map((t) => t.category)),
).sort();

export default function LibraryPage() {
  return (
    <Suspense fallback={null}>
      <LibraryPageInner />
    </Suspense>
  );
}

function LibraryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromGroupId = searchParams.get("from") === "group" ? searchParams.get("groupId") : null;

  const groups = useStore((s) => s.groups);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [gradeBand, setGradeBand] = useState<string>("all");
  const [focusId, setFocusId] = useState<string>("all");
  const [previewing, setPreviewing] = useState<ActivityTemplate | null>(null);
  const [usingTemplate, setUsingTemplate] = useState<ActivityTemplate | null>(null);

  const filtered = useMemo(() => {
    return ACTIVITY_TEMPLATES.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (gradeBand !== "all" && !t.gradeBands.includes(gradeBand as GradeBand)) return false;
      if (focusId !== "all" && t.focus !== focusId) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const haystack = `${t.title} ${t.description} ${t.objective} ${t.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [category, gradeBand, focusId, query]);

  function handleUseTemplate(template: ActivityTemplate) {
    if (fromGroupId) {
      createFromTemplate(template, fromGroupId);
      return;
    }
    setUsingTemplate(template);
  }

  function createFromTemplate(template: ActivityTemplate, groupId: string) {
    const activity = store.createActivity({
      groupId,
      title: template.title,
      objective: template.objective,
      focus: template.focus,
      language: "English",
      prompts: template.prompts,
      promptMode: "all-teacher",
      timingPerPromptSeconds: 0,
      minimumSpeakingSeconds: 15,
      recordingMode: "audio-or-text",
      workspaceEnabled: false,
      workspaceSteps: [],
      feedbackVisibility: "show",
      scoreVisibility: "show",
      status: "draft",
    });
    toast.success(`Added "${template.title}" to your group.`);
    router.push(`/app/groups/${groupId}/activities/${activity.id}/setup`);
  }

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
          No.&nbsp;01 — Activity library
        </p>
        <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em]">
          Reflection activities, ready to lift off the page.
        </h1>
        <p className="prose-measure text-foreground/70">
          Pick a template, drop it into a group, and share the link. Every
          template is editable.
        </p>
      </header>

      <Card className="bg-surface">
        <CardContent className="grid gap-3 py-5 lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, objective, or category"
              className="pl-9"
            />
          </div>
          <div className="lg:col-span-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <Select value={gradeBand} onValueChange={setGradeBand}>
              <SelectTrigger>
                <SelectValue placeholder="Grade band" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All grades</SelectItem>
                {GRADE_BANDS.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <Select value={focusId} onValueChange={setFocusId}>
              <SelectTrigger>
                <SelectValue placeholder="Focus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All focuses</SelectItem>
                {FOCUS_OPTIONS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
              No matches
            </p>
            <CardTitle className="font-display text-2xl">
              Nothing here for that combination.
            </CardTitle>
            <CardDescription className="prose-measure">
              Try clearing a filter or searching for a broader term.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onPreview={() => setPreviewing(t)}
              onUse={() => handleUseTemplate(t)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-w-xl">
          {previewing && (
            <>
              <DialogHeader>
                <p className="margin-note uppercase tracking-[0.3em] text-[0.65rem]">
                  {getFocus(previewing.focus).label}
                </p>
                <DialogTitle className="font-display text-2xl leading-tight">
                  {previewing.title}
                </DialogTitle>
                <DialogDescription>{previewing.objective}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <p className="margin-note uppercase tracking-[0.3em] text-[0.65rem]">
                  Prompts
                </p>
                <ol className="space-y-2">
                  {previewing.prompts.map((p, i) => (
                    <li
                      key={p.id}
                      className="rounded-xl border border-border bg-surface p-4 text-[0.95rem] leading-relaxed text-foreground/85"
                    >
                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {p.text}
                    </li>
                  ))}
                </ol>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setPreviewing(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const t = previewing;
                    setPreviewing(null);
                    handleUseTemplate(t);
                  }}
                >
                  Use this template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!usingTemplate} onOpenChange={(o) => !o && setUsingTemplate(null)}>
        <DialogContent>
          {usingTemplate && (
            <UseTemplateDialog
              template={usingTemplate}
              onCancel={() => setUsingTemplate(null)}
              onPick={(groupId) => {
                const t = usingTemplate;
                setUsingTemplate(null);
                createFromTemplate(t, groupId);
              }}
              groups={groups}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateCard({
  template,
  onPreview,
  onUse,
}: {
  template: ActivityTemplate;
  onPreview: () => void;
  onUse: () => void;
}) {
  const focus = getFocus(template.focus);
  return (
    <Card className="group flex h-full flex-col bg-card transition-colors hover:border-primary/30">
      <CardHeader className="space-y-2.5">
        <p className="margin-note uppercase tracking-[0.3em] text-[0.65rem]">
          {focus.label}
        </p>
        <CardTitle className="font-display text-[1.25rem] leading-[1.18] tracking-[-0.016em]">
          {template.title}
        </CardTitle>
        <p className="font-display italic text-[0.95rem] leading-[1.45] text-foreground/55">
          {template.category}
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-[0.875rem] leading-[1.55] text-foreground/70">
          {template.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {template.gradeBands.map((g) => {
            const gb = GRADE_BANDS.find((x) => x.id === g);
            return (
              <Badge key={g} variant="outline">
                {gb?.label ?? g}
              </Badge>
            );
          })}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-4">
          <span className="text-[0.7rem] uppercase tracking-[0.2em] text-foreground/40">
            ~{template.estimatedMinutes} min
          </span>
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={onPreview}>
              Preview
            </Button>
            <Button size="sm" variant="ghost" onClick={onUse}>
              Use template
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UseTemplateDialog({
  template,
  groups,
  onPick,
  onCancel,
}: {
  template: ActivityTemplate;
  groups: { id: string; name: string; gradeBand: string }[];
  onPick: (groupId: string) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<"existing" | "new">(
    groups.length > 0 ? "existing" : "new",
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    groups[0]?.id ?? "",
  );
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupGrade, setNewGroupGrade] = useState<GradeBand>(
    template.gradeBands[0] ?? "9-12",
  );

  function confirm() {
    if (mode === "existing") {
      if (!selectedGroupId) {
        toast.error("Pick a group.");
        return;
      }
      onPick(selectedGroupId);
      return;
    }
    const name = newGroupName.trim();
    if (!name) {
      toast.error("Give your new group a name.");
      return;
    }
    const user = store.ensureUser();
    const created = store.createGroup({
      name,
      ownerId: user.id,
      gradeBand: newGroupGrade,
      accessType: "name-only",
      language: "English",
      recordingMode: "audio-or-text",
      greetingEnabled: true,
    });
    onPick(created.id);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-xl">
          Use &ldquo;{template.title}&rdquo;
        </DialogTitle>
        <DialogDescription>
          Choose where this activity should live. You can edit everything after.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {groups.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                mode === "existing"
                  ? "border-primary/50 bg-primary/10"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-foreground">
                <GraduationCap className="h-4 w-4" />
                Existing group
              </div>
              <div className="text-xs text-muted-foreground">
                Drop into a group you&rsquo;ve already made.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("new")}
              className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                mode === "new"
                  ? "border-primary/50 bg-primary/10"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Plus className="h-4 w-4" />
                New group
              </div>
              <div className="text-xs text-muted-foreground">
                Create a class or cohort just for this.
              </div>
            </button>
          </div>
        )}

        {mode === "existing" && groups.length > 0 && (
          <div className="space-y-2">
            <Label>Pick a group</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {mode === "new" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Period 3 — World History"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label>Grade band</Label>
              <Select
                value={newGroupGrade}
                onValueChange={(v) => setNewGroupGrade(v as GradeBand)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_BANDS.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.label} · {g.range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={confirm}>
          Add to group
          <ArrowRight className="h-4 w-4" />
        </Button>
      </DialogFooter>
    </>
  );
}
