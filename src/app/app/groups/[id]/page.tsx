"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  GraduationCap,
  Link as LinkIcon,
  MoreHorizontal,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GroupSummaryCard } from "@/components/group-summary-card";
import { TrendSparkline } from "@/components/trend-sparkline";
import { TriageCard } from "@/components/triage-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateGroupSummary } from "@/lib/api-client";
import { getGradeBand } from "@/lib/grade-bands";
import { ACCESS_TYPES } from "@/lib/access-types";
import { getFocus } from "@/lib/focus-catalog";
import { store, useStore } from "@/lib/storage";
import type { Activity, GroupSummary } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

export default function GroupHomePage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;
  const router = useRouter();

  const group = useStore((s) => s.groups.find((g) => g.id === groupId));
  const activities = useStore((s) =>
    s.activities
      .filter((a) => a.groupId === groupId)
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  );
  const reflections = useStore((s) =>
    s.reflections
      .filter((r) => r.groupId === groupId)
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  );
  const participants = useStore((s) =>
    s.participants.filter((p) => p.groupId === groupId),
  );
  const cachedSummary = useStore((s) =>
    s.groupSummaries.find((x) => x.groupId === groupId && x.activityId === null),
  );

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<GroupSummary | undefined>(cachedSummary);
  const [activityFilter, setActivityFilter] = useState<string>("all");

  useEffect(() => {
    setSummary(cachedSummary);
  }, [cachedSummary]);

  const access = useMemo(
    () => ACCESS_TYPES.find((a) => a.id === group?.accessType),
    [group?.accessType],
  );

  const assignedActivities = useMemo(
    () => activities.filter((a) => a.status === "assigned"),
    [activities],
  );

  const filteredReflections = useMemo(() => {
    if (activityFilter === "all") return reflections;
    return reflections.filter((r) => r.activityId === activityFilter);
  }, [reflections, activityFilter]);

  const participantTrends = useMemo(() => {
    const buckets = new Map<
      string,
      {
        key: string;
        name: string;
        entries: { level: number; createdAt: string }[];
      }
    >();
    for (const r of filteredReflections) {
      const level = r.analysis?.reflectionLevel;
      if (!level) continue;
      const key = r.participantId ?? `name:${r.participantName}`;
      const name = r.participantName || "Anonymous";
      const existing = buckets.get(key);
      if (existing) {
        existing.entries.push({ level, createdAt: r.createdAt });
      } else {
        buckets.set(key, {
          key,
          name,
          entries: [{ level, createdAt: r.createdAt }],
        });
      }
    }
    const rows = Array.from(buckets.values())
      .filter((b) => b.entries.length >= 2)
      .map((b) => {
        // Sort entries oldest → newest so the sparkline reads left-to-right.
        const sorted = b.entries
          .slice()
          .sort((a, c) => (a.createdAt < c.createdAt ? -1 : 1));
        const latest = sorted[sorted.length - 1];
        // The bucket key is either the participant id, or `name:<name>` when
        // there's no linked participant id on the reflection. Only the former
        // can be linked to a portfolio page.
        const participantId = b.key.startsWith("name:") ? null : b.key;
        return {
          key: b.key,
          participantId,
          name: b.name,
          count: sorted.length,
          points: sorted.map((e) => e.level),
          latestLevel: latest.level,
          latestAt: latest.createdAt,
        };
      })
      .sort((a, b) => (a.latestAt < b.latestAt ? 1 : -1));
    return rows;
  }, [filteredReflections]);

  if (!group) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
              <GraduationCap className="h-6 w-6" />
            </div>
            <CardTitle>Group not found</CardTitle>
            <CardDescription>
              This group doesn't exist on this device. It may have been deleted.
            </CardDescription>
            <Button asChild className="mt-2">
              <Link href="/app">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const drafts = activities.filter((a) => a.status === "draft");
  const assigned = activities.filter((a) => a.status === "assigned");

  async function handleGenerateSummary() {
    if (!group || filteredReflections.length === 0) return;
    setGenerating(true);
    try {
      const out = await generateGroupSummary({
        groupName: group.name,
        reflections: filteredReflections.map((r) => ({
          participantName: r.participantName,
          summary: r.analysis?.summary,
          level: r.analysis?.reflectionLevel,
          mindset: r.analysis?.mindset,
          tone: r.analysis?.tone,
          transcript: r.responses[0]?.text,
        })),
      });
      const next: GroupSummary = {
        id: `${group.id}-${activityFilter}-${Date.now()}`,
        groupId: group.id,
        activityId: activityFilter === "all" ? null : activityFilter,
        reflectionCount: filteredReflections.length,
        ...out.summary,
        generatedAt: new Date().toISOString(),
      };
      if (activityFilter === "all") {
        store.saveGroupSummary(next);
      }
      setSummary(next);
      toast.success("Class summary updated");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't generate summary right now.");
    } finally {
      setGenerating(false);
    }
  }

  function copyInvite() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/g/${group!.id}`;
    void navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  }

  function handleDelete() {
    store.deleteGroup(group!.id);
    toast.success(`"${group!.name}" deleted`);
    router.push("/app");
  }

  return (
    <div className="space-y-10">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/app">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-[0_20px_50px_-25px_hsl(var(--primary)/0.6)]">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-3xl tracking-tight md:text-4xl">
              {group.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="muted">{getGradeBand(group.gradeBand).label}</Badge>
              {access && <Badge variant="outline">{access.label}</Badge>}
              <Badge variant="muted">
                <Users className="h-3 w-3" />
                {participants.length} participant{participants.length === 1 ? "" : "s"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="lg">
            <Link href={`/app/groups/${group.id}/activities/new`}>
              <Plus className="h-4 w-4" />
              New activity
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Group menu">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/app/groups/${group.id}/settings`}>
                  <Settings className="h-4 w-4" />
                  Group settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/app/groups/${group.id}/settings#participants`}>
                  <Users className="h-4 w-4" />
                  Manage participants
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyInvite}>
                <LinkIcon className="h-4 w-4" />
                Copy invite link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmDelete(true)}
                className="text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl tracking-tight">Activities</h2>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/app/groups/${group.id}/activities/new`}>
              <Plus className="h-4 w-4" />
              New activity
            </Link>
          </Button>
        </div>
        {activities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
                <Sparkles className="h-6 w-6" />
              </div>
              <CardTitle>No activities yet</CardTitle>
              <CardDescription className="max-w-sm">
                Create your first activity — start from a template or build from scratch.
                Then share the link with your students.
              </CardDescription>
              <Button asChild className="mt-2">
                <Link href={`/app/groups/${group.id}/activities/new`}>
                  Create your first activity
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {assigned.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assigned.map((a) => (
                  <ActivityCard key={a.id} activity={a} groupId={group.id} />
                ))}
              </div>
            )}
            {drafts.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Drafts
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {drafts.map((a) => (
                    <ActivityCard key={a.id} activity={a} groupId={group.id} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl tracking-tight">Reflections</h2>
            <p className="text-sm text-muted-foreground">
              {activityFilter === "all"
                ? "All reflections across this group."
                : "Filtered to one activity."}
            </p>
          </div>
          {reflections.length > 0 && assignedActivities.length > 0 && (
            <div className="w-full sm:w-64">
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger aria-label="Filter reflections by activity">
                  <SelectValue placeholder="All activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All activities</SelectItem>
                  {assignedActivities.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title || "Untitled activity"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {filteredReflections.length > 0 && (
          <div className="mb-8 space-y-4">
            <div>
              <h3 className="font-display text-xl tracking-tight">Class summary</h3>
              <p className="text-sm text-muted-foreground">
                AI-generated overview of where the group is and what to try next.
              </p>
            </div>
            {summary ? (
              <GroupSummaryCard
                groupName={group.name}
                reflectionCount={
                  activityFilter === "all"
                    ? summary.reflectionCount
                    : filteredReflections.length
                }
                summary={summary}
                loading={generating}
                onRegenerate={handleGenerateSummary}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <CardTitle>Generate a class summary</CardTitle>
                  <CardDescription className="max-w-md">
                    Pull {filteredReflections.length} reflection
                    {filteredReflections.length === 1 ? "" : "s"} together into a
                    two-paragraph overview with concrete teacher moves.
                  </CardDescription>
                  <Button onClick={handleGenerateSummary} disabled={generating} className="mt-2">
                    {generating ? "Summarising…" : "Generate summary"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="mb-3 flex items-end justify-between">
          <h3 className="font-display text-xl tracking-tight">Recent reflections</h3>
          {filteredReflections.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {filteredReflections.length} total
            </span>
          )}
        </div>
        {filteredReflections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
                <Users className="h-6 w-6" />
              </div>
              <CardTitle>
                {reflections.length === 0
                  ? "No reflections yet"
                  : "No reflections for this activity"}
              </CardTitle>
              <CardDescription className="max-w-sm">
                {reflections.length === 0
                  ? "Once you assign an activity and a participant submits a reflection, you'll see colour-coded triage cards here."
                  : "Try selecting a different activity, or switch back to all activities."}
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredReflections.slice(0, 12).map((r) => (
              <TriageCard
                key={r.id}
                reflection={r}
                href={`/app/reflections/${r.id}`}
                showScore
              />
            ))}
          </div>
        )}

        <div className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h3 className="font-display text-xl tracking-tight">Trend by participant</h3>
              <p className="text-sm text-muted-foreground">
                How each participant&apos;s reflection level has shifted over time.
              </p>
            </div>
          </div>
          {participantTrends.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <CardTitle className="text-base font-medium">
                  No trends to show yet
                </CardTitle>
                <CardDescription className="max-w-md">
                  Trends appear once a participant submits more than one reflection.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="divide-y divide-border/60 p-0">
                {participantTrends.map((row) => {
                  const rowContent = (
                    <>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">
                          {row.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.count} reflection{row.count === 1 ? "" : "s"}
                        </div>
                      </div>
                      <TrendSparkline points={row.points} />
                      <div className="text-xs font-medium text-foreground/80 tabular-nums">
                        Latest: Level {row.latestLevel}
                      </div>
                    </>
                  );
                  if (row.participantId) {
                    return (
                      <Link
                        key={row.key}
                        href={`/app/groups/${group.id}/participants/${row.participantId}`}
                        className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 sm:flex-nowrap"
                      >
                        {rowContent}
                      </Link>
                    );
                  }
                  return (
                    <div
                      key={row.key}
                      className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap"
                    >
                      {rowContent}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this group?</DialogTitle>
            <DialogDescription>
              This permanently removes "{group.name}", along with its activities and
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

function ActivityCard({ activity, groupId }: { activity: Activity; groupId: string }) {
  const focus = getFocus(activity.focus);
  const reflectionCount = useStore(
    (s) => s.reflections.filter((r) => r.activityId === activity.id).length,
  );
  const isDraft = activity.status === "draft";
  const href = isDraft
    ? `/app/groups/${groupId}/activities/${activity.id}/setup`
    : `/app/groups/${groupId}/activities/${activity.id}/share`;

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col gap-3 rounded-3xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg",
        isDraft ? "border-dashed border-border" : "border-border/70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{focus.emoji}</span>
          <div>
            <div className="font-display text-lg leading-tight tracking-tight">
              {activity.title || "Untitled activity"}
            </div>
            <div className="text-xs text-muted-foreground">{focus.label}</div>
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <p className="line-clamp-2 text-sm text-foreground/80">
        {activity.objective || "No objective yet — open to set one."}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-1.5 text-xs">
        {isDraft ? (
          <Badge variant="outline">Draft</Badge>
        ) : (
          <Badge variant="primary">Assigned</Badge>
        )}
        <Badge variant="muted">
          {reflectionCount} reflection{reflectionCount === 1 ? "" : "s"}
        </Badge>
        <span className="ml-auto text-muted-foreground">
          {formatRelativeTime(activity.assignedAt ?? activity.createdAt)}
        </span>
      </div>
    </Link>
  );
}
