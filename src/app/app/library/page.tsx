"use client";

export const dynamic = "force-dynamic";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Filter, GraduationCap, LibraryBig, Plus, Search, Sparkles } from "lucide-react";
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
      // bypass picker
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="primary" className="mb-2">
            <LibraryBig className="h-3 w-3" />
            Activity library
          </Badge>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">
            Reflection activities, ready to go.
          </h1>
          <p className="mt-1 max-w-xl text-sm text-foreground/75">
            Pick a template, drop it into a group, and share the link. Every template is editable.
          </p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary/[0.03] via-card to-secondary/[0.03]">
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
                    {f.emoji} {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
              <Search className="h-5 w-5" />
            </div>
            <CardTitle>No matches</CardTitle>
            <CardDescription className="max-w-sm">
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
                <Badge variant="primary" className="mb-1 self-start">
                  {getFocus(previewing.focus).emoji} {getFocus(previewing.focus).label}
                </Badge>
                <DialogTitle className="font-display text-2xl">
                  {previewing.title}
                </DialogTitle>
                <DialogDescription>{previewing.objective}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Prompts
                </div>
                <ol className="space-y-2">
                  {previewing.prompts.map((p, i) => (
                    <li
                      key={p.id}
                      className="rounded-2xl bg-accent/40 p-4 text-sm leading-relaxed"
                    >
                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                        0{i + 1}
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
    <Card className="group flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="bg-gradient-to-br from-primary/[0.06] to-secondary/[0.06] px-5 pt-5">
        <Badge variant="primary" className="mb-2">
          {focus.emoji} {focus.label}
        </Badge>
        <CardTitle className="font-display text-xl leading-tight tracking-tight">
          {template.title}
        </CardTitle>
        <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
          {template.category}
        </div>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        <p className="text-sm leading-relaxed text-foreground/80">
          {template.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {template.gradeBands.map((g) => {
            const gb = GRADE_BANDS.find((x) => x.id === g);
            return (
              <Badge key={g} variant="muted">
                {gb?.label ?? g}
              </Badge>
            );
          })}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> ~{template.estimatedMinutes} min
          </span>
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={onPreview}>
              Preview
            </Button>
            <Button size="sm" onClick={onUse}>
              <Sparkles className="h-4 w-4" />
              Use template
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
          Use "{template.title}"
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
              className={
                "rounded-xl border p-3 text-left text-sm transition-all " +
                (mode === "existing"
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-card hover:bg-muted")
              }
            >
              <div className="flex items-center gap-2 font-medium">
                <GraduationCap className="h-4 w-4" />
                Existing group
              </div>
              <div className="text-xs text-muted-foreground">
                Drop into a group you've already made.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("new")}
              className={
                "rounded-xl border p-3 text-left text-sm transition-all " +
                (mode === "new"
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-card hover:bg-muted")
              }
            >
              <div className="flex items-center gap-2 font-medium">
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
          <Sparkles className="h-4 w-4" />
          Add to group
        </Button>
      </DialogFooter>
    </>
  );
}
