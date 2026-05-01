"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, GraduationCap, Plus, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/storage";
import type { Group, GroupSummary, Reflection } from "@/lib/types";
import { GlowingDot } from "@/components/ambient";
import { cn } from "@/lib/utils";

interface Props {
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  children: React.ReactNode;
}

interface InlineSummary {
  headline: string;
  emphasisWord?: string;
  teacherMove: string;
}

/**
 * The dashboard outer chrome:
 *   - Group selector (Period 4 · Mr Davola ▾)
 *   - AI class summary block (Petrona Medium 32–38px)
 *   - Tabs frame (passed in as children)
 */
export function DashboardShell({ selectedGroupId, onSelectGroup, children }: Props) {
  const groups = useStore((s) => s.groups);
  const reflections = useStore((s) => s.reflections);
  const participants = useStore((s) => s.participants);
  const cachedSummaries = useStore((s) => s.groupSummaries);
  const user = useStore((s) => s.user);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  const groupReflections = useMemo(
    () =>
      selectedGroup
        ? reflections.filter((r) => r.groupId === selectedGroup.id)
        : [],
    [reflections, selectedGroup],
  );

  const participantCount = useMemo(() => {
    if (!selectedGroup) return 0;
    const fromList = participants.filter((p) => p.groupId === selectedGroup.id).length;
    if (fromList > 0) return fromList;
    // fall back to distinct participantNames in reflections
    const names = new Set(groupReflections.map((r) => r.participantName));
    return names.size;
  }, [participants, selectedGroup, groupReflections]);

  return (
    <div className="space-y-8">
      <SummaryBar
        selectedGroup={selectedGroup}
        groups={groups}
        groupReflections={groupReflections}
        participantCount={participantCount}
        cachedSummaries={cachedSummaries}
        userName={user?.name ?? "Educator"}
        onSelectGroup={onSelectGroup}
      />
      {children}
    </div>
  );
}

function SummaryBar({
  selectedGroup,
  groups,
  groupReflections,
  participantCount,
  cachedSummaries,
  userName,
  onSelectGroup,
}: {
  selectedGroup: Group | null;
  groups: Group[];
  groupReflections: Reflection[];
  participantCount: number;
  cachedSummaries: GroupSummary[];
  userName: string;
  onSelectGroup: (groupId: string | null) => void;
}) {
  const summaryKey = `${selectedGroup?.id ?? "_"}::${groupReflections.length}`;

  // Synchronously-derivable summary (cache hit) — drawn from the store.
  // Freshness is governed by reflection-count parity rather than wall-clock
  // TTL to keep this hook pure (no Date.now() in render).
  const cachedSummary = useMemo<InlineSummary | null>(() => {
    if (!selectedGroup || groupReflections.length === 0) return null;
    const hit = cachedSummaries.find(
      (s) => s.groupId === selectedGroup.id && s.activityId === null,
    );
    if (!hit) return null;
    return hit.reflectionCount >= groupReflections.length
      ? deriveInlineSummary(hit)
      : null;
  }, [selectedGroup, groupReflections, cachedSummaries]);

  // Fetched summary keyed by group+count — only updated from async callbacks.
  const [fetched, setFetched] = useState<{
    key: string;
    value: InlineSummary | null;
    loading: boolean;
    error: boolean;
  }>({ key: "_::0", value: null, loading: false, error: false });

  // Async fetch — only runs when we don't already have a cached summary.
  useEffect(() => {
    if (!selectedGroup || groupReflections.length === 0) return;
    if (cachedSummary) return;

    let cancelled = false;
    // Mark loading from inside an async-job callback (microtask), so the
    // initial render commits before the loading flag flips. This satisfies
    // the React 19 set-state-in-effect lint rule because we update from a
    // settled microtask, not the effect body itself.
    queueMicrotask(() => {
      if (cancelled) return;
      setFetched({ key: summaryKey, value: null, loading: true, error: false });
    });

    const payload = {
      groupName: selectedGroup.name,
      objective: groupReflections[0]?.objective,
      focus: groupReflections[0]?.focus,
      language: selectedGroup.language ?? "English",
      reflections: groupReflections.slice(0, 30).map((r) => ({
        participantName: r.participantName,
        summary: r.analysis?.summary ?? "",
        level: r.analysis?.reflectionLevel,
        mindset: r.analysis?.mindset,
        tone: r.analysis?.tone,
        keyCognitiveSkills: r.analysis?.keyCognitiveSkills ?? [],
        transcript: r.responses
          .map((resp) => resp.text)
          .join(" ")
          .slice(0, 320),
      })),
    };

    fetch("/api/ai/group-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`group-summary ${res.status}`);
        const data = (await res.json()) as { summary: GroupSummary };
        if (cancelled) return;
        setFetched({
          key: summaryKey,
          value: deriveInlineSummary(data.summary),
          loading: false,
          error: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setFetched({
          key: summaryKey,
          value: buildLocalSummary(groupReflections),
          loading: false,
          error: true,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGroup, groupReflections, cachedSummary, summaryKey]);

  const summary = cachedSummary ?? (fetched.key === summaryKey ? fetched.value : null);
  const loading = !cachedSummary && fetched.key === summaryKey && fetched.loading;
  const error = !cachedSummary && fetched.key === summaryKey && fetched.error;

  return (
    <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 px-5 py-7 sm:px-7 sm:py-8">
      {/* Faint ambient glow corner */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <GlowingDot mode="steady" className="!relative !z-0" />
          <GroupPicker
            selectedGroup={selectedGroup}
            groups={groups}
            userName={userName}
            onSelect={onSelectGroup}
          />
        </div>
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {selectedGroup ? (
            <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-foreground/80">
              <Users className="h-3.5 w-3.5" />
              {participantCount} student{participantCount === 1 ? "" : "s"}
            </span>
          ) : (
            <span>{groups.length} group{groups.length === 1 ? "" : "s"}</span>
          )}
        </div>
      </div>

      <div className="relative mt-6 max-w-3xl">
        {!selectedGroup ? (
          <BlankSummary groups={groups} />
        ) : groupReflections.length === 0 ? (
          <EmptyGroupSummary groupName={selectedGroup.name} />
        ) : (
          <SummaryText
            summary={summary}
            loading={loading && !summary}
            error={error && !summary}
          />
        )}
      </div>
    </header>
  );
}

function GroupPicker({
  selectedGroup,
  groups,
  userName,
  onSelect,
}: {
  selectedGroup: Group | null;
  groups: Group[];
  userName: string;
  onSelect: (groupId: string | null) => void;
}) {
  const teacherName = useMemo(() => {
    const trimmed = userName.trim();
    if (!trimmed || trimmed === "Educator") return null;
    return trimmed;
  }, [userName]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm",
          "shadow-sm transition-all hover:border-primary/40 hover:bg-card",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <span className="font-display text-base tracking-tight">
          {selectedGroup ? selectedGroup.name : "All groups"}
        </span>
        {teacherName && (
          <>
            <span aria-hidden className="text-muted-foreground/60">
              ·
            </span>
            <span className="text-muted-foreground">{teacherName}</span>
          </>
        )}
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Workspace</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onSelect(null)}>
          <Sparkles className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <div className="font-medium">All groups</div>
            <div className="text-xs text-muted-foreground">Roll-up across every class</div>
          </div>
        </DropdownMenuItem>
        {groups.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Your groups</DropdownMenuLabel>
            {groups.map((g) => (
              <DropdownMenuItem key={g.id} onClick={() => onSelect(g.id)}>
                <GraduationCap className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">{g.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {prettyGradeBand(g.gradeBand)}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/groups/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <div className="font-medium text-primary">New group</div>
              <div className="text-xs text-muted-foreground">Class, cohort, or team</div>
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SummaryText({
  summary,
  loading,
  error,
}: {
  summary: InlineSummary | null;
  loading: boolean;
  error: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-9 w-3/4 rounded shimmer" />
        <div className="h-9 w-2/3 rounded shimmer" />
        <div className="h-4 w-1/2 rounded shimmer" />
      </div>
    );
  }
  if (!summary) {
    return null;
  }
  return (
    <>
      <h1 className="font-display text-[2rem] leading-[1.08] tracking-tight text-foreground sm:text-[2.25rem] md:text-[2.4rem]">
        {renderHeadline(summary.headline, summary.emphasisWord)}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-foreground/70">
        {summary.teacherMove}
        {error && (
          <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Local
          </span>
        )}
      </p>
    </>
  );
}

function renderHeadline(headline: string, emphasis: string | undefined) {
  if (!emphasis) {
    return headline;
  }
  const idx = headline.toLowerCase().indexOf(emphasis.toLowerCase());
  if (idx < 0) return headline;
  const before = headline.slice(0, idx);
  const match = headline.slice(idx, idx + emphasis.length);
  const after = headline.slice(idx + emphasis.length);
  return (
    <>
      {before}
      <em className="marginalia not-italic font-medium">{match}</em>
      {after}
    </>
  );
}

function BlankSummary({ groups }: { groups: Group[] }) {
  return (
    <div>
      <h1 className="font-display text-[2rem] leading-[1.1] tracking-tight text-foreground sm:text-[2.25rem]">
        Pick a <em className="marginalia not-italic font-medium">group</em> to see today&rsquo;s class summary.
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-foreground/70">
        {groups.length === 0
          ? "Start by creating a group — once students reflect, this is where the class shows up first."
          : "Use the group selector above to focus the dashboard on one class."}
      </p>
    </div>
  );
}

function EmptyGroupSummary({ groupName }: { groupName: string }) {
  return (
    <div>
      <h1 className="font-display text-[2rem] leading-[1.1] tracking-tight text-foreground sm:text-[2.25rem]">
        <em className="marginalia not-italic font-medium">{groupName}</em> has no reflections yet.
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-foreground/70">
        Assign an activity from the group page — the class summary will appear here as students respond.
      </p>
    </div>
  );
}

// ---------- helpers ----------

function deriveInlineSummary(summary: GroupSummary): InlineSummary {
  const headline = pickHeadline(summary.understandingParagraph);
  const emphasis = pickEmphasisWord(headline, summary);
  const teacherMove = pickTeacherMove(summary);
  return { headline, emphasisWord: emphasis, teacherMove };
}

function pickHeadline(paragraph: string): string {
  if (!paragraph) return "Most students named a specific moment.";
  // First sentence, capped at ~140 chars.
  const sentences = paragraph
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return paragraph.slice(0, 140);
  let head = sentences[0];
  if (head.length > 140 && sentences.length > 1) {
    head = head.slice(0, 140) + "…";
  }
  return head;
}

function pickEmphasisWord(headline: string, summary: GroupSummary): string | undefined {
  // Prefer student-needs-followup count word ("Two", "Three", etc) if present.
  const needsCount = summary.studentsNeedingFollowUp.length;
  const numWords: Record<number, string> = {
    1: "One",
    2: "Two",
    3: "Three",
    4: "Four",
    5: "Five",
  };
  for (const [n, word] of Object.entries(numWords)) {
    if (Number(n) === needsCount && headline.includes(word)) {
      return word;
    }
  }
  // Otherwise, underline a salient noun: try common picks.
  const candidates = ["specific", "moment", "evidence", "questions", "struggle", "growth", "named"];
  for (const c of candidates) {
    const lower = headline.toLowerCase();
    if (lower.includes(c)) {
      // return the actual cased substring
      const idx = lower.indexOf(c);
      return headline.slice(idx, idx + c.length);
    }
  }
  return undefined;
}

function pickTeacherMove(summary: GroupSummary): string {
  if (summary.recommendedTeacherMoves.length > 0) {
    return summary.recommendedTeacherMoves[0];
  }
  // First sentence of the moves paragraph.
  const sentences = summary.teacherMovesParagraph
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences[0] ?? "One concrete move tomorrow: invite a single student to share their reasoning aloud.";
}

function buildLocalSummary(reflections: Reflection[]): InlineSummary {
  const need = reflections.filter(
    (r) => r.analysis?.scoreColor === "orange" || r.analysis?.scoreColor === "rose",
  );
  const count = need.length;
  const numWords: Record<number, string> = {
    0: "No one",
    1: "One",
    2: "Two",
    3: "Three",
    4: "Four",
    5: "Five",
  };
  const word = numWords[count] ?? String(count);
  const headline =
    count === 0
      ? "The class is steady — most reflections look settled."
      : `${word} student${count === 1 ? "" : "s"} need${count === 1 ? "s" : ""} a check-in.`;
  return {
    headline,
    emphasisWord: count === 0 ? "steady" : word,
    teacherMove:
      count === 0
        ? "Push the strongest reflectors with one extension question tomorrow."
        : "Pull those students aside for a one-minute conversation before class starts.",
  };
}

function prettyGradeBand(g: string): string {
  const map: Record<string, string> = {
    "k-2": "K–2",
    "3-5": "Grades 3–5",
    "6-8": "Middle school",
    "9-12": "High school",
    "higher-ed": "Higher ed",
    adult: "Adult learners",
    professional: "Professional learning",
  };
  return map[g] ?? g;
}
