"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupSummaryCard } from "@/components/group-summary-card";
import { TriageRow, type TriageRowData } from "@/components/dashboard";
import { generateGroupSummary } from "@/lib/api-client";
import { getGradeBand } from "@/lib/grade-bands";
import { ACCESS_TYPES } from "@/lib/access-types";
import { getFocus } from "@/lib/focus-catalog";
import { store, useStore } from "@/lib/storage";
import type {
  Activity,
  GroupSummary,
  Reflection,
  ScoreColor,
} from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

type TabId = "activities" | "participants" | "settings";

const TAB_PARAM = "tab";
const SEEN_KEY = (groupId: string) =>
  `reflection-app:group-seen:${groupId}`;

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const groupId = params.id;

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

  const initialTab: TabId = (() => {
    const t = search.get(TAB_PARAM);
    if (t === "participants" || t === "settings") return t;
    return "activities";
  })();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<GroupSummary | undefined>(cachedSummary);

  useEffect(() => {
    setSummary(cachedSummary);
  }, [cachedSummary]);

  function handleTabChange(next: string) {
    const v = (next as TabId);
    setTab(v);
    const url = new URL(window.location.href);
    if (v === "activities") url.searchParams.delete(TAB_PARAM);
    else url.searchParams.set(TAB_PARAM, v);
    router.replace(url.pathname + (url.search || ""), { scroll: false });
  }

  if (!group) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <CardTitle>Group not found</CardTitle>
            <CardDescription>
              This group doesn't exist on this device. It may have been deleted.
            </CardDescription>
            <Button asChild className="mt-2">
              <Link href="/app/groups">Back to groups</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const access = ACCESS_TYPES.find((a) => a.id === group.accessType);
  const gradeBand = getGradeBand(group.gradeBand);

  async function handleGenerateSummary() {
    if (!group || reflections.length === 0) return;
    setGenerating(true);
    try {
      const out = await generateGroupSummary({
        groupName: group.name,
        reflections: reflections.map((r) => ({
          participantName: r.participantName,
          summary: r.analysis?.summary,
          level: r.analysis?.reflectionLevel,
          mindset: r.analysis?.mindset,
          tone: r.analysis?.tone,
          transcript: r.responses[0]?.text,
        })),
      });
      const next: GroupSummary = {
        id: `${group.id}-all-${Date.now()}`,
        groupId: group.id,
        activityId: null,
        reflectionCount: reflections.length,
        ...out.summary,
        generatedAt: new Date().toISOString(),
      };
      store.saveGroupSummary(next);
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
    router.push("/app/groups");
  }

  return (
    <div className="space-y-10">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/groups">
            <ArrowLeft className="h-4 w-4" />
            All groups
          </Link>
        </Button>
      </div>

      {/* Full-bleed serif header */}
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">
              {participants.length || group.participantIds.length}{" "}
              {(participants.length || group.participantIds.length) === 1
                ? "Student"
                : "Students"}
            </p>
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
              {group.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-foreground/70">
              <Badge variant="outline">{gradeBand.label}</Badge>
              {access && <Badge variant="muted">{access.label}</Badge>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
                <DropdownMenuItem onClick={() => handleTabChange("settings")}>
                  <Settings className="h-4 w-4" />
                  Group settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTabChange("participants")}>
                  <Users className="h-4 w-4" />
                  Manage participants
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
        </div>
        <hr className="rule-soft mt-2" />
      </header>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="activities">
            Activities
            <span className="ml-1 text-[10px] font-mono tabular-nums text-muted-foreground">
              {activities.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="participants">
            Participants
            <span className="ml-1 text-[10px] font-mono tabular-nums text-muted-foreground">
              {reflections.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="mt-8 space-y-8">
          {reflections.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl tracking-tight">
                    Class summary
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    AI-generated overview of where the group is and what to try
                    next.
                  </p>
                </div>
              </div>
              {summary ? (
                <GroupSummaryCard
                  groupName={group.name}
                  reflectionCount={summary.reflectionCount}
                  summary={summary}
                  loading={generating}
                  onRegenerate={handleGenerateSummary}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <CardTitle className="font-display text-lg">
                      Generate a class summary
                    </CardTitle>
                    <CardDescription className="max-w-md">
                      Pull {reflections.length} reflection
                      {reflections.length === 1 ? "" : "s"} together into a
                      two-paragraph overview with concrete teacher moves.
                    </CardDescription>
                    <Button
                      onClick={handleGenerateSummary}
                      disabled={generating}
                      className="mt-2"
                    >
                      {generating ? "Summarising…" : "Generate summary"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </section>
          )}

          <ActivitiesSection group={group} activities={activities} />
        </TabsContent>

        <TabsContent value="participants" className="mt-8">
          <ParticipantsSection
            groupId={group.id}
            reflections={reflections}
            participants={participants}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-8">
          <SettingsCallout groupId={group.id} />
        </TabsContent>
      </Tabs>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this group?</DialogTitle>
            <DialogDescription>
              This permanently removes "{group.name}", along with its activities
              and reflections. This can't be undone.
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

// ---------- Activities sub-tab ----------

function ActivitiesSection({
  group,
  activities,
}: {
  group: { id: string; name: string };
  activities: Activity[];
}) {
  const drafts = activities.filter((a) => a.status === "draft");
  const assigned = activities.filter((a) => a.status === "assigned");

  if (activities.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 px-6 py-14 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="font-display text-2xl tracking-tight">
          No activities yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-foreground/70">
          Create your first activity — start from a template or build from
          scratch. Then share the link with your students.
        </p>
        <Button asChild className="mt-5">
          <Link href={`/app/groups/${group.id}/activities/new`}>
            Create the first activity
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Activities</h2>
          <p className="text-sm text-muted-foreground">
            What you've assigned to {group.name}.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={`/app/groups/${group.id}/activities/new`}>
            <Plus className="h-4 w-4" />
            New activity
          </Link>
        </Button>
      </div>

      {assigned.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assigned.map((a) => (
            <ActivityCard key={a.id} activity={a} groupId={group.id} />
          ))}
        </div>
      )}

      {drafts.length > 0 && (
        <div className="space-y-3">
          <p className="margin-note uppercase tracking-[0.18em] text-[0.65rem]">
            Drafts
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((a) => (
              <ActivityCard key={a.id} activity={a} groupId={group.id} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ActivityCard({
  activity,
  groupId,
}: {
  activity: Activity;
  groupId: string;
}) {
  const focus = getFocus(activity.focus);
  const reflectionCount = useStore(
    (s) => s.reflections.filter((r) => r.activityId === activity.id).length,
  );
  const participantCount = useStore(
    (s) =>
      s.participants.filter((p) => p.groupId === groupId).length ||
      s.groups.find((g) => g.id === groupId)?.participantIds.length ||
      0,
  );
  const isDraft = activity.status === "draft";
  const detailHref = `/app/groups/${groupId}/activities/${activity.id}`;
  const setupHref = `/app/groups/${groupId}/activities/${activity.id}/setup`;
  const href = isDraft ? setupHref : detailHref;

  const progress =
    participantCount > 0 ? Math.min(reflectionCount / participantCount, 1) : 0;

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col gap-4 rounded-3xl border bg-card p-5 transition-all",
        "hover:-translate-y-0.5 hover:border-primary/30",
        "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_24px_48px_-32px_rgba(120,165,220,0.18)]",
        isDraft ? "border-dashed border-border" : "border-border/70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="margin-note uppercase tracking-[0.18em] text-[0.65rem]">
            {focus.label}
          </p>
          <h3 className="mt-1 font-display text-xl leading-tight tracking-tight">
            {activity.title || "Untitled activity"}
          </h3>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
      </div>

      <p className="line-clamp-2 text-sm text-foreground/75">
        {activity.objective || "No objective yet — open to set one."}
      </p>

      {!isDraft && participantCount > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between text-[12px]">
            <span className="text-foreground/70">
              <span className="font-mono tabular-nums text-foreground">
                {reflectionCount}
              </span>{" "}
              of{" "}
              <span className="font-mono tabular-nums">
                {participantCount}
              </span>{" "}
              reflected
            </span>
            <span className="font-mono tabular-nums text-foreground/55">
              {Math.round(progress * 100)}%
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary/70"
              style={{ width: `${progress * 100}%` }}
              aria-hidden
            />
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 text-xs">
        {isDraft ? (
          <Badge variant="outline">Draft</Badge>
        ) : (
          <Badge variant="primary">Assigned</Badge>
        )}
        {isDraft && (
          <Badge variant="muted">
            {reflectionCount} reflection{reflectionCount === 1 ? "" : "s"}
          </Badge>
        )}
        <span className="ml-auto text-muted-foreground">
          {formatRelativeTime(activity.assignedAt ?? activity.createdAt)}
        </span>
      </div>
    </Link>
  );
}

// ---------- Participants sub-tab ----------

function ParticipantsSection({
  groupId,
  reflections,
  participants,
}: {
  groupId: string;
  reflections: Reflection[];
  participants: { id: string; name: string }[];
}) {
  const [seen, setSeen] = useState<Set<string>>(() => loadSeen(groupId));

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SEEN_KEY(groupId), JSON.stringify([...seen]));
    } catch {
      // ignore
    }
  }, [seen, groupId]);

  const rows = useMemo<TriageRowData[]>(() => {
    return reflections.map((reflection) => {
      const a = reflection.analysis;
      const color: ScoreColor = a?.scoreColor ?? "blue";
      const level = a?.reflectionLevel ?? 1;
      const quote = pickQuote(reflection);
      const teacherMove =
        a?.teacherFollowUp ?? a?.suggestedNextStep ?? "";
      const hasSafetyAlert = (a?.contentAlerts ?? []).some(
        (x) => x.severity === "high",
      );
      return { reflection, color, level, quote, teacherMove, hasSafetyAlert };
    });
  }, [reflections]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (a.hasSafetyAlert !== b.hasSafetyAlert) {
        return a.hasSafetyAlert ? -1 : 1;
      }
      // Default: name A–Z, but rose pinned via the alert check above.
      return a.reflection.participantName.localeCompare(
        b.reflection.participantName,
      );
    });
  }, [rows]);

  const handleMarkSeen = (id: string) => {
    setSeen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (rows.length === 0 && participants.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 px-6 py-14 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="font-display text-2xl tracking-tight">
          No participants yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-foreground/70">
          Once a student joins and reflects, they appear here with their
          most recent quote.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Reflections roll-up */}
      {sorted.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl tracking-tight">Triage</h2>
              <p className="text-sm text-muted-foreground">
                Each row is one reflection. Sorted A–Z; safety alerts pinned.
              </p>
            </div>
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {sorted.length} {sorted.length === 1 ? "reflection" : "reflections"}
            </span>
          </div>
          <ul className="overflow-hidden rounded-2xl border border-border/60 bg-card/30">
            {sorted.map((row) => (
              <TriageRow
                key={row.reflection.id}
                data={row}
                density="cards"
                seen={seen.has(row.reflection.id)}
                onMarkSeen={handleMarkSeen}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Roster — participants who haven't reflected yet still surface */}
      <div className="space-y-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Roster</h2>
          <p className="text-sm text-muted-foreground">
            Tap a student to open their portfolio.
          </p>
        </div>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Roster is empty — students appear once they reflect or you add them
            in settings.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-border/60 bg-card/30 divide-y divide-border/40">
            {participants
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((p) => {
                const count = reflections.filter(
                  (r) => r.participantId === p.id,
                ).length;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/app/groups/${groupId}/participants/${p.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-card/60"
                    >
                      <span className="font-mono text-[13px] tabular-nums text-foreground/85">
                        {p.name}
                      </span>
                      <span className="ml-auto text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        {count} {count === 1 ? "reflection" : "reflections"}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </section>
  );
}

function pickQuote(r: Reflection): string {
  const fromAnalysis = r.analysis?.studentQuotes?.[0];
  if (fromAnalysis && fromAnalysis.trim()) return cleanQuote(fromAnalysis);
  const fromResponse = r.responses[0]?.text;
  if (fromResponse && fromResponse.trim()) {
    const clean = fromResponse.trim();
    return clean.length > 160 ? `${clean.slice(0, 157)}…` : clean;
  }
  return "";
}

function cleanQuote(q: string): string {
  const trimmed = q.replace(/^["“”']|["“”']$/g, "").trim();
  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed;
}

function loadSeen(groupId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY(groupId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}


// ---------- Settings tab — links out to the dedicated settings route ----------

function SettingsCallout({ groupId }: { groupId: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card/40 px-6 py-10 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Settings className="h-6 w-6" />
      </div>
      <h3 className="font-display text-2xl tracking-tight">Group settings</h3>
      <p className="mx-auto mt-2 max-w-md text-foreground/70">
        Edit name, grade band, access type, language, recording mode, and
        defaults. Or archive / delete the group.
      </p>
      <Button asChild className="mt-5" size="lg">
        <Link href={`/app/groups/${groupId}/settings`}>
          Open settings
        </Link>
      </Button>
    </div>
  );
}
