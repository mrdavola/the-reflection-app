"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, GraduationCap, Sparkles, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { store, useStore } from "@/lib/storage";
import type { AccessType, GradeBand, RecordingMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function GroupSettingsPage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;
  const router = useRouter();

  const group = useStore((s) => s.groups.find((g) => g.id === groupId));
  const participants = useStore((s) =>
    s.participants.filter((p) => p.groupId === groupId),
  );

  // Local form state — initialised from store, kept in sync if group changes.
  const [name, setName] = useState(group?.name ?? "");
  const [gradeBand, setGradeBand] = useState<GradeBand>(group?.gradeBand ?? "6-8");
  const [accessType, setAccessType] = useState<AccessType>(
    group?.accessType ?? "name-only",
  );
  const [language, setLanguage] = useState(group?.language ?? "en");
  const [recordingMode, setRecordingMode] = useState<RecordingMode>(
    group?.recordingMode ?? "audio-or-text",
  );
  const [greetingEnabled, setGreetingEnabled] = useState(
    group?.greetingEnabled ?? true,
  );

  const [newParticipant, setNewParticipant] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Re-hydrate local state when the group changes (e.g. mounting after save).
  useEffect(() => {
    if (!group) return;
    setName(group.name);
    setGradeBand(group.gradeBand);
    setAccessType(group.accessType);
    setLanguage(group.language);
    setRecordingMode(group.recordingMode);
    setGreetingEnabled(group.greetingEnabled);
  }, [group]);

  const dirty = useMemo(() => {
    if (!group) return false;
    return (
      name.trim() !== group.name ||
      gradeBand !== group.gradeBand ||
      accessType !== group.accessType ||
      language !== group.language ||
      recordingMode !== group.recordingMode ||
      greetingEnabled !== group.greetingEnabled
    );
  }, [group, name, gradeBand, accessType, language, recordingMode, greetingEnabled]);

  if (!group) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
              <GraduationCap className="h-6 w-6" />
            </div>
            <CardTitle>Group not found</CardTitle>
            <CardDescription>This group may have been deleted.</CardDescription>
            <Button asChild className="mt-2">
              <Link href="/app/groups">Back to groups</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!group) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Give your group a name first.");
      return;
    }
    store.updateGroup(group.id, {
      name: trimmed,
      gradeBand,
      accessType,
      language,
      recordingMode,
      greetingEnabled,
    });
    toast.success("Group settings saved");
  }

  function handleAddParticipant(e: React.FormEvent) {
    e.preventDefault();
    if (!group) return;
    const trimmed = newParticipant.trim();
    if (trimmed.length < 1) return;
    store.ensureParticipant(group.id, trimmed, false);
    setNewParticipant("");
    toast.success(`${trimmed} added`);
  }

  function handleDelete() {
    if (!group) return;
    store.deleteGroup(group.id);
    toast.success(`"${group.name}" deleted`);
    router.push("/app/groups");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/app/groups/${group.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to group
          </Link>
        </Button>
      </div>

      <div className="mb-10">
        <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
          {group.name}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Group settings
        </h1>
        <p className="mt-3 max-w-prose text-foreground/70">
          Update name, grade band, access, and defaults for this group.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                          ? "border-primary/60 bg-accent/60"
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
            <CardDescription>How participants join this group.</CardDescription>
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
                        selected ? "border-primary bg-primary" : "border-border",
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

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button asChild variant="ghost" type="button">
            <Link href={`/app/groups/${group.id}`}>Cancel</Link>
          </Button>
          <Button type="submit" size="lg" disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </form>

      <section id="participants" className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Manage participants</CardTitle>
            <CardDescription>
              Participants who've joined this group. Add anyone manually if you'd like.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddParticipant} className="flex gap-2">
              <Input
                placeholder="Add a participant by name…"
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
              />
              <Button type="submit" variant="outline" disabled={newParticipant.trim().length === 0}>
                <UserPlus className="h-4 w-4" />
                Add
              </Button>
            </form>

            {participants.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                <Users className="h-5 w-5" />
                No one has joined yet. They'll appear here once they reflect.
              </div>
            ) : (
              <ul className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-card">
                {participants.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="font-medium">{p.name}</span>
                    {p.anonymous && (
                      <span className="text-xs text-muted-foreground">Anonymous</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="font-display text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Deleting this group permanently removes its activities and reflections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              type="button"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete group
            </Button>
          </CardContent>
        </Card>
      </section>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this group?</DialogTitle>
            <DialogDescription>
              This permanently removes "{group.name}" along with its activities and
              reflections. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
