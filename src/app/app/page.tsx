"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/storage";
import {
  DashboardShell,
  InsightsTab,
  LiveTab,
  TriageTab,
} from "@/components/dashboard";
import { SeedDemoData } from "@/components/seed-demo-data";
import type { Reflection } from "@/lib/types";
import { cn } from "@/lib/utils";

const SELECTED_GROUP_KEY = "reflection-app:dashboard-selected-group";
type TabValue = "triage" | "insights" | "live";

function isTabValue(v: string | null | undefined): v is TabValue {
  return v === "triage" || v === "insights" || v === "live";
}

// The page itself is a Suspense boundary because we read `useSearchParams`
// (per Next.js 16 prerendering rules).
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groups = useStore((s) => s.groups);
  const reflections = useStore((s) => s.reflections);

  const tabFromUrl = searchParams.get("tab");
  const activeTab: TabValue = isTabValue(tabFromUrl) ? tabFromUrl : "triage";

  // `userChoice` is the teacher's explicit pick:
  //   string     – a specific groupId
  //   null       – explicitly chose "All groups"
  //   undefined  – no explicit pick yet; fall back to stored value, then first group
  // The stored value is read once, in the lazy initializer (NOT in render),
  // so the derivation below stays pure.
  const [userChoice, setUserChoice] = useState<string | null | undefined>(
    () => readStoredGroup() ?? undefined,
  );

  const selectedGroupId: string | null = useMemo(() => {
    if (userChoice === null) return null;
    if (typeof userChoice === "string") {
      return groups.some((g) => g.id === userChoice) ? userChoice : groups[0]?.id ?? null;
    }
    // userChoice === undefined: pick the first group if any.
    return groups[0]?.id ?? null;
  }, [userChoice, groups]);

  // Persist the resolved selection so it survives reloads.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (selectedGroupId === null) {
        localStorage.removeItem(SELECTED_GROUP_KEY);
      } else {
        localStorage.setItem(SELECTED_GROUP_KEY, selectedGroupId);
      }
    } catch {
      // ignore quota errors
    }
  }, [selectedGroupId]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  const handleTabChange = useCallback(
    (value: string) => {
      if (!isTabValue(value)) return;
      // Replace so the back button doesn't accumulate tab transitions.
      const sp = new URLSearchParams(searchParams.toString());
      if (value === "triage") {
        sp.delete("tab");
      } else {
        sp.set("tab", value);
      }
      const qs = sp.toString();
      router.replace(qs ? `/app?${qs}` : "/app", { scroll: false });
    },
    [router, searchParams],
  );

  // Live tab activity count — recent reflections in the selected group.
  // Counted off the most recent reflection's timestamp (vs. wall clock) so
  // the value is stable between renders and remains pure.
  const liveCount = useMemo(
    () => countActiveLive(selectedGroup?.id ?? null, reflections),
    [reflections, selectedGroup],
  );

  const showOnboarding = groups.length === 0 && reflections.length === 0;

  return (
    <DashboardShell selectedGroupId={selectedGroupId} onSelectGroup={setUserChoice}>
      {showOnboarding && <OnboardingBanner />}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <div className="-mx-2 overflow-x-auto px-2">
          <TabsList className="flex w-max gap-1 rounded-full bg-muted/60 p-1">
            <TabsTrigger value="triage" className="px-4 uppercase tracking-[0.16em] text-[11px]">
              Triage
            </TabsTrigger>
            <TabsTrigger value="insights" className="px-4 uppercase tracking-[0.16em] text-[11px]">
              Insights
            </TabsTrigger>
            <TabsTrigger
              value="live"
              className={cn(
                "px-4 uppercase tracking-[0.16em] text-[11px]",
                liveCount > 0 && "data-[state=inactive]:text-primary",
              )}
            >
              Live
              {liveCount > 0 && (
                <span className="ml-1 inline-flex items-center gap-1 text-primary">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
                  · {liveCount} active
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="triage">
          <TriageTab group={selectedGroup} />
        </TabsContent>
        <TabsContent value="insights">
          <InsightsTab group={selectedGroup} />
        </TabsContent>
        <TabsContent value="live">
          <LiveTab group={selectedGroup} />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function OnboardingBanner() {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/30 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            New here
          </p>
          <h2 className="mt-1 font-display text-xl tracking-tight">
            Set the cockpit up in two minutes
          </h2>
          <p className="mt-1 max-w-xl text-sm text-foreground/70">
            Create a group, assign an activity, or load demo data to see the dashboard with a
            seeded class.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm">
            <Link href="/app/groups/new">
              <Sparkles className="h-4 w-4" />
              Create a group
            </Link>
          </Button>
          <SeedDemoData />
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/60 bg-card/40 px-7 py-8">
        <div className="h-6 w-40 rounded shimmer" />
        <div className="mt-6 space-y-3">
          <div className="h-9 w-3/4 rounded shimmer" />
          <div className="h-9 w-2/3 rounded shimmer" />
        </div>
      </div>
      <div className="h-10 w-72 rounded-full shimmer" />
      <div className="rounded-2xl border border-border/40 bg-card/30 p-4">
        <div className="space-y-2">
          <div className="h-9 w-full rounded shimmer" />
          <div className="h-9 w-full rounded shimmer" />
          <div className="h-9 w-full rounded shimmer" />
        </div>
      </div>
    </div>
  );
}

// ---------- helpers ----------

function readStoredGroup(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SELECTED_GROUP_KEY) ?? null;
  } catch {
    return null;
  }
}

function countActiveLive(groupId: string | null, reflections: Reflection[]): number {
  const RECENT_WINDOW_MS = 1000 * 60 * 10;
  const filtered = groupId
    ? reflections.filter((r) => r.groupId === groupId)
    : reflections;
  // Anchor "recent" to the freshest reflection's own timestamp, not wall clock.
  // This keeps the count deterministic given the same store state.
  let mostRecent = 0;
  for (const r of filtered) {
    const t = new Date(r.createdAt).getTime();
    if (t > mostRecent) mostRecent = t;
  }
  if (mostRecent === 0) return 0;
  return filtered.filter(
    (r) =>
      r.activityId &&
      !r.completedAt &&
      !r.analysis &&
      mostRecent - new Date(r.createdAt).getTime() < RECENT_WINDOW_MS,
  ).length;
}
