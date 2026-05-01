"use client";

import { nanoid } from "nanoid";
import { useSyncExternalStore } from "react";
import type {
  Activity,
  Board,
  BoardNote,
  Group,
  GroupSummary,
  Participant,
  Reflection,
  User,
  Workshop,
} from "./types";

const KEYS = {
  user: "reflection-app:user",
  groups: "reflection-app:groups",
  activities: "reflection-app:activities",
  participants: "reflection-app:participants",
  reflections: "reflection-app:reflections",
  groupSummaries: "reflection-app:group-summaries",
  workshops: "reflection-app:workshops",
  boards: "reflection-app:boards",
} as const;

type StoreShape = {
  user: User | null;
  groups: Group[];
  activities: Activity[];
  participants: Participant[];
  reflections: Reflection[];
  groupSummaries: GroupSummary[];
  workshops: Workshop[];
  boards: Board[];
};

const subscribers = new Set<() => void>();
const channel = typeof window !== "undefined" ? new BroadcastChannel("reflection-app-store") : null;

function notify() {
  for (const cb of subscribers) cb();
  channel?.postMessage("change");
}

if (channel) {
  channel.onmessage = () => {
    for (const cb of subscribers) cb();
  };
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  notify();
}

// ---------- snapshot ----------

function snapshot(): StoreShape {
  return {
    user: read<User | null>(KEYS.user, null),
    groups: read<Group[]>(KEYS.groups, []),
    activities: read<Activity[]>(KEYS.activities, []),
    participants: read<Participant[]>(KEYS.participants, []),
    reflections: read<Reflection[]>(KEYS.reflections, []),
    groupSummaries: read<GroupSummary[]>(KEYS.groupSummaries, []),
    workshops: read<Workshop[]>(KEYS.workshops, []),
    boards: read<Board[]>(KEYS.boards, []),
  };
}

let cachedSnapshot: StoreShape | null = null;
let cachedJson = "";

function getSnapshot(): StoreShape {
  if (typeof window === "undefined") {
    return {
      user: null,
      groups: [],
      activities: [],
      participants: [],
      reflections: [],
      groupSummaries: [],
      workshops: [],
      boards: [],
    };
  }
  const next = snapshot();
  const nextJson = JSON.stringify(next);
  if (nextJson !== cachedJson) {
    cachedSnapshot = next;
    cachedJson = nextJson;
  }
  return cachedSnapshot ?? next;
}

function getServerSnapshot(): StoreShape {
  return {
    user: null,
    groups: [],
    activities: [],
    participants: [],
    reflections: [],
    groupSummaries: [],
    workshops: [],
    boards: [],
  };
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key && Object.values(KEYS).includes(e.key as (typeof KEYS)[keyof typeof KEYS])) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    subscribers.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStore<Selected>(selector: (s: StoreShape) => Selected): Selected {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()), () => selector(getServerSnapshot()));
}

// ---------- mutations ----------

export const store = {
  // user
  ensureUser(name = "Educator"): User {
    const existing = read<User | null>(KEYS.user, null);
    if (existing) return existing;
    const u: User = {
      id: nanoid(8),
      name,
      role: "educator",
      createdAt: new Date().toISOString(),
    };
    write(KEYS.user, u);
    return u;
  },
  updateUser(patch: Partial<User>) {
    const cur = read<User | null>(KEYS.user, null);
    if (!cur) return;
    write(KEYS.user, { ...cur, ...patch });
  },

  // groups
  listGroups(): Group[] {
    return read<Group[]>(KEYS.groups, []);
  },
  getGroup(id: string): Group | undefined {
    return read<Group[]>(KEYS.groups, []).find((g) => g.id === id);
  },
  createGroup(input: Omit<Group, "id" | "createdAt" | "participantIds" | "managerIds">): Group {
    const g: Group = {
      ...input,
      id: nanoid(8),
      participantIds: [],
      managerIds: [],
      createdAt: new Date().toISOString(),
    };
    write(KEYS.groups, [g, ...read<Group[]>(KEYS.groups, [])]);
    return g;
  },
  updateGroup(id: string, patch: Partial<Group>) {
    const groups = read<Group[]>(KEYS.groups, []);
    write(
      KEYS.groups,
      groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    );
  },
  deleteGroup(id: string) {
    write(
      KEYS.groups,
      read<Group[]>(KEYS.groups, []).filter((g) => g.id !== id),
    );
    write(
      KEYS.activities,
      read<Activity[]>(KEYS.activities, []).filter((a) => a.groupId !== id),
    );
    write(
      KEYS.reflections,
      read<Reflection[]>(KEYS.reflections, []).filter((r) => r.groupId !== id),
    );
  },

  // activities
  listActivities(groupId?: string): Activity[] {
    const all = read<Activity[]>(KEYS.activities, []);
    return groupId ? all.filter((a) => a.groupId === groupId) : all;
  },
  getActivity(id: string): Activity | undefined {
    return read<Activity[]>(KEYS.activities, []).find((a) => a.id === id);
  },
  getActivityByShareCode(code: string): Activity | undefined {
    return read<Activity[]>(KEYS.activities, []).find((a) => a.shareCode === code);
  },
  createActivity(input: Omit<Activity, "id" | "createdAt" | "shareCode">): Activity {
    const a: Activity = {
      ...input,
      id: nanoid(8),
      shareCode: nanoid(10),
      createdAt: new Date().toISOString(),
    };
    write(KEYS.activities, [a, ...read<Activity[]>(KEYS.activities, [])]);
    return a;
  },
  updateActivity(id: string, patch: Partial<Activity>) {
    write(
      KEYS.activities,
      read<Activity[]>(KEYS.activities, []).map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
  },
  deleteActivity(id: string) {
    write(
      KEYS.activities,
      read<Activity[]>(KEYS.activities, []).filter((a) => a.id !== id),
    );
  },

  // participants
  listParticipants(groupId: string): Participant[] {
    return read<Participant[]>(KEYS.participants, []).filter((p) => p.groupId === groupId);
  },
  ensureParticipant(groupId: string, name: string, anonymous = false): Participant {
    const existing = read<Participant[]>(KEYS.participants, []).find(
      (p) => p.groupId === groupId && p.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) return existing;
    const p: Participant = {
      id: nanoid(8),
      groupId,
      name,
      anonymous,
      createdAt: new Date().toISOString(),
    };
    write(KEYS.participants, [...read<Participant[]>(KEYS.participants, []), p]);
    return p;
  },

  // reflections
  listReflections(filter?: { groupId?: string; activityId?: string; ownerUserId?: string }) {
    let list = read<Reflection[]>(KEYS.reflections, []);
    if (filter?.groupId) list = list.filter((r) => r.groupId === filter.groupId);
    if (filter?.activityId) list = list.filter((r) => r.activityId === filter.activityId);
    if (filter?.ownerUserId) list = list.filter((r) => r.ownerUserId === filter.ownerUserId);
    return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  getReflection(id: string): Reflection | undefined {
    return read<Reflection[]>(KEYS.reflections, []).find((r) => r.id === id);
  },
  createReflection(input: Omit<Reflection, "id" | "createdAt">): Reflection {
    const r: Reflection = {
      ...input,
      id: nanoid(8),
      createdAt: new Date().toISOString(),
    };
    write(KEYS.reflections, [r, ...read<Reflection[]>(KEYS.reflections, [])]);
    return r;
  },
  updateReflection(id: string, patch: Partial<Reflection>) {
    write(
      KEYS.reflections,
      read<Reflection[]>(KEYS.reflections, []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  },
  deleteReflection(id: string) {
    write(
      KEYS.reflections,
      read<Reflection[]>(KEYS.reflections, []).filter((r) => r.id !== id),
    );
  },

  // group summaries (cached)
  getGroupSummary(groupId: string, activityId: string | null): GroupSummary | undefined {
    return read<GroupSummary[]>(KEYS.groupSummaries, []).find(
      (s) => s.groupId === groupId && s.activityId === activityId,
    );
  },
  saveGroupSummary(s: GroupSummary) {
    const existing = read<GroupSummary[]>(KEYS.groupSummaries, []).filter(
      (x) => !(x.groupId === s.groupId && x.activityId === s.activityId),
    );
    write(KEYS.groupSummaries, [s, ...existing]);
  },

  // workshops
  listWorkshops(facilitatorUserId?: string): Workshop[] {
    const all = read<Workshop[]>(KEYS.workshops, []);
    return facilitatorUserId
      ? all.filter((w) => w.facilitatorUserId === facilitatorUserId)
      : all;
  },
  getWorkshop(id: string): Workshop | undefined {
    return read<Workshop[]>(KEYS.workshops, []).find((w) => w.id === id);
  },
  getWorkshopByJoinCode(code: string): Workshop | undefined {
    const upper = code.toUpperCase();
    return read<Workshop[]>(KEYS.workshops, []).find(
      (w) => w.joinCode.toUpperCase() === upper,
    );
  },
  createWorkshop(input: Omit<Workshop, "id" | "createdAt">): Workshop {
    const w: Workshop = {
      ...input,
      id: nanoid(8),
      createdAt: new Date().toISOString(),
    };
    write(KEYS.workshops, [w, ...read<Workshop[]>(KEYS.workshops, [])]);
    return w;
  },
  updateWorkshop(id: string, patch: Partial<Workshop>) {
    write(
      KEYS.workshops,
      read<Workshop[]>(KEYS.workshops, []).map((w) =>
        w.id === id ? { ...w, ...patch } : w,
      ),
    );
  },

  // boards
  listBoards(workshopId?: string): Board[] {
    const all = read<Board[]>(KEYS.boards, []);
    return workshopId ? all.filter((b) => b.workshopId === workshopId) : all;
  },
  getBoard(id: string): Board | undefined {
    return read<Board[]>(KEYS.boards, []).find((b) => b.id === id);
  },
  createBoard(input: Omit<Board, "id" | "createdAt" | "notes"> & { notes?: BoardNote[] }): Board {
    const b: Board = {
      ...input,
      notes: input.notes ?? [],
      id: nanoid(8),
      createdAt: new Date().toISOString(),
    };
    write(KEYS.boards, [b, ...read<Board[]>(KEYS.boards, [])]);
    return b;
  },
  updateBoard(id: string, patch: Partial<Board>) {
    write(
      KEYS.boards,
      read<Board[]>(KEYS.boards, []).map((b) =>
        b.id === id ? { ...b, ...patch } : b,
      ),
    );
  },
  addNote(boardId: string, note: BoardNote) {
    write(
      KEYS.boards,
      read<Board[]>(KEYS.boards, []).map((b) =>
        b.id === boardId ? { ...b, notes: [...b.notes, note] } : b,
      ),
    );
  },
  removeNote(boardId: string, noteId: string) {
    write(
      KEYS.boards,
      read<Board[]>(KEYS.boards, []).map((b) =>
        b.id === boardId
          ? { ...b, notes: b.notes.filter((n) => n.id !== noteId) }
          : b,
      ),
    );
  },

  reset() {
    if (typeof window === "undefined") return;
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    notify();
  },
};
