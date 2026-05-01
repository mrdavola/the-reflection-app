"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, GraduationCap, Plus, Sparkle, User2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/storage";

interface Props {
  /** "personal" | groupId | undefined (no selection) */
  current: string;
}

export function GroupSelector({ current }: Props) {
  const router = useRouter();
  const groups = useStore((s) => s.groups);
  const selectedGroup = groups.find((g) => g.id === current);
  const label = current === "personal"
    ? "Personal"
    : selectedGroup
      ? selectedGroup.name
      : "All groups";
  const Icon = current === "personal" ? User2 : GraduationCap;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Icon className="h-4 w-4 text-primary" />
        <span className="max-w-[14ch] truncate">{label}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Workspace</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => router.push("/app/personal")}>
          <User2 className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">Personal reflection</div>
            <div className="text-xs text-muted-foreground">Private journal mode</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/app")}>
          <Sparkle className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">All groups</div>
            <div className="text-xs text-muted-foreground">Dashboard overview</div>
          </div>
        </DropdownMenuItem>
        {groups.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Your groups</DropdownMenuLabel>
            {groups.map((g) => (
              <DropdownMenuItem key={g.id} onClick={() => router.push(`/app/groups/${g.id}`)}>
                <GraduationCap className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">{g.name}</div>
                  <div className="text-xs text-muted-foreground">{prettyGradeBand(g.gradeBand)}</div>
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

function prettyGradeBand(g: string) {
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
