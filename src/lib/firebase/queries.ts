// Typed Firestore query wrappers. Mirrors the surface of `store.xxx()` in
// `@/lib/storage` so a future swap is mechanical: each function takes the
// Firestore client as the first arg and accepts/returns the same domain
// types from `@/lib/types`.
//
// TODO before this can run live:
//   npm i firebase
//
// Collections:
//   users            — one doc per signed-in user (educator / personal)
//   groups           — educator-owned cohorts
//   participants     — students in a group
//   activities       — assignments with a unique shareCode
//   reflections      — student submissions + AI analysis
//   groupSummaries   — cached aggregate AI summaries
//
// Document IDs are nanoid-generated strings (consistent with the localStorage
// shape). `createdAt` is written via `serverTimestamp()` and read back as an
// ISO string so the rest of the app can keep using string dates.

import { nanoid } from "nanoid";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type {
  Activity,
  Group,
  GroupSummary,
  Participant,
  Reflection,
  User,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COLLECTIONS = {
  users: "users",
  groups: "groups",
  participants: "participants",
  activities: "activities",
  reflections: "reflections",
  groupSummaries: "groupSummaries",
} as const;

function nowIso(): string {
  return new Date().toISOString();
}

/** Convert a Firestore Timestamp (or already-ISO string / Date) to ISO. */
function toIso(value: unknown): string {
  if (!value) return nowIso();
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  // Firestore Timestamp shape: { toDate(): Date } | { seconds, nanoseconds }
  const v = value as { toDate?: () => Date; seconds?: number; nanoseconds?: number };
  if (typeof v.toDate === "function") return v.toDate().toISOString();
  if (typeof v.seconds === "number") {
    return new Date(v.seconds * 1000 + Math.floor((v.nanoseconds ?? 0) / 1e6)).toISOString();
  }
  return nowIso();
}

function makeShareCode(): string {
  return nanoid(10);
}

// ---------------------------------------------------------------------------
// Doc <-> domain mappers
// ---------------------------------------------------------------------------

function snapshotData(snap: QueryDocumentSnapshot | { id: string; data: () => DocumentData }): {
  id: string;
  data: DocumentData;
} {
  return { id: snap.id, data: snap.data() };
}

function toUser(id: string, d: DocumentData): User {
  return {
    id,
    name: d.name,
    email: d.email ?? undefined,
    role: d.role,
    createdAt: toIso(d.createdAt),
  };
}

function toGroup(id: string, d: DocumentData, participantIds: string[] = []): Group {
  return {
    id,
    name: d.name,
    ownerId: d.ownerId,
    gradeBand: d.gradeBand,
    accessType: d.accessType,
    language: d.language,
    recordingMode: d.recordingMode,
    greetingEnabled: d.greetingEnabled,
    createdAt: toIso(d.createdAt),
    participantIds,
    managerIds: (d.managerIds as string[] | undefined) ?? [],
  };
}

function toParticipant(id: string, d: DocumentData): Participant {
  return {
    id,
    groupId: d.groupId,
    name: d.name,
    email: d.email ?? undefined,
    anonymous: Boolean(d.anonymous),
    createdAt: toIso(d.createdAt),
  };
}

function toActivity(id: string, d: DocumentData): Activity {
  return {
    id,
    groupId: d.groupId,
    title: d.title,
    objective: d.objective,
    focus: d.focus,
    language: d.language,
    prompts: d.prompts ?? [],
    promptMode: d.promptMode,
    timingPerPromptSeconds: d.timingPerPromptSeconds ?? 0,
    minimumSpeakingSeconds: d.minimumSpeakingSeconds ?? 0,
    recordingMode: d.recordingMode,
    workspaceEnabled: Boolean(d.workspaceEnabled),
    workspaceSteps: d.workspaceSteps ?? [],
    feedbackVisibility: d.feedbackVisibility,
    scoreVisibility: d.scoreVisibility,
    status: d.status,
    shareCode: d.shareCode,
    assignedAt: d.assignedAt ? toIso(d.assignedAt) : undefined,
    createdAt: toIso(d.createdAt),
    rubric: d.rubric ?? undefined,
    modelingEnabled: d.modelingEnabled ?? undefined,
  };
}

function toReflection(id: string, d: DocumentData): Reflection {
  return {
    id,
    activityId: d.activityId ?? null,
    groupId: d.groupId ?? null,
    participantId: d.participantId ?? null,
    participantName: d.participantName,
    ownerUserId: d.ownerUserId,
    objective: d.objective,
    focus: d.focus,
    responses: d.responses ?? [],
    analysis: d.analysis ?? undefined,
    feedbackVisibility: d.feedbackVisibility,
    scoreVisibility: d.scoreVisibility,
    completedAt: d.completedAt ? toIso(d.completedAt) : undefined,
    createdAt: toIso(d.createdAt),
  };
}

function toGroupSummary(id: string, d: DocumentData): GroupSummary {
  return {
    id,
    groupId: d.groupId,
    activityId: d.activityId ?? null,
    reflectionCount: d.reflectionCount ?? 0,
    understandingParagraph: d.understandingParagraph ?? "",
    teacherMovesParagraph: d.teacherMovesParagraph ?? "",
    recommendedTeacherMoves: d.recommendedTeacherMoves ?? [],
    commonStrengths: d.commonStrengths ?? [],
    commonStruggles: d.commonStruggles ?? [],
    studentsNeedingFollowUp: d.studentsNeedingFollowUp ?? [],
    studentsReadyForExtension: d.studentsReadyForExtension ?? [],
    generatedAt: toIso(d.generatedAt),
  };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function ensureUser(
  db: Firestore,
  input: { id?: string; name?: string; email?: string; role?: User["role"] } = {},
): Promise<User> {
  const id = input.id ?? nanoid(8);
  const ref = doc(db, COLLECTIONS.users, id);
  const snap = await getDoc(ref);
  if (snap.exists()) return toUser(snap.id, snap.data());

  const data = {
    name: input.name ?? "Educator",
    email: input.email ?? null,
    role: input.role ?? "educator",
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return {
    id,
    name: data.name,
    email: data.email ?? undefined,
    role: data.role,
    createdAt: nowIso(),
  };
}

export async function updateUser(
  db: Firestore,
  id: string,
  patch: Partial<User>,
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.email !== undefined) dbPatch.email = patch.email ?? null;
  if (patch.role !== undefined) dbPatch.role = patch.role;
  await updateDoc(doc(db, COLLECTIONS.users, id), dbPatch);
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export async function listGroups(db: Firestore, ownerId: string): Promise<Group[]> {
  const q = query(
    collection(db, COLLECTIONS.groups),
    where("ownerId", "==", ownerId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot) => {
    const { id, data } = snapshotData(d);
    return toGroup(id, data);
  });
}

export async function getGroup(db: Firestore, id: string): Promise<Group | null> {
  const ref = doc(db, COLLECTIONS.groups, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const partsQ = query(
    collection(db, COLLECTIONS.participants),
    where("groupId", "==", id),
  );
  const parts = await getDocs(partsQ);
  const ids = parts.docs.map((p: QueryDocumentSnapshot) => p.id);
  return toGroup(snap.id, snap.data(), ids);
}

export async function createGroup(
  db: Firestore,
  input: Omit<Group, "id" | "createdAt" | "participantIds" | "managerIds">,
): Promise<Group> {
  const id = nanoid(8);
  const ref = doc(db, COLLECTIONS.groups, id);
  const data = {
    name: input.name,
    ownerId: input.ownerId,
    gradeBand: input.gradeBand,
    accessType: input.accessType,
    language: input.language,
    recordingMode: input.recordingMode,
    greetingEnabled: input.greetingEnabled,
    managerIds: [] as string[],
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return {
    id,
    name: data.name,
    ownerId: data.ownerId,
    gradeBand: data.gradeBand,
    accessType: data.accessType,
    language: data.language,
    recordingMode: data.recordingMode,
    greetingEnabled: data.greetingEnabled,
    managerIds: [],
    participantIds: [],
    createdAt: nowIso(),
  };
}

export async function updateGroup(
  db: Firestore,
  id: string,
  patch: Partial<Group>,
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.gradeBand !== undefined) dbPatch.gradeBand = patch.gradeBand;
  if (patch.accessType !== undefined) dbPatch.accessType = patch.accessType;
  if (patch.language !== undefined) dbPatch.language = patch.language;
  if (patch.recordingMode !== undefined) dbPatch.recordingMode = patch.recordingMode;
  if (patch.greetingEnabled !== undefined) dbPatch.greetingEnabled = patch.greetingEnabled;
  if (patch.managerIds !== undefined) dbPatch.managerIds = patch.managerIds;
  await updateDoc(doc(db, COLLECTIONS.groups, id), dbPatch);
}

/**
 * Delete a group plus its dependent activities, participants, reflections,
 * and cached summaries in a single batch.
 */
export async function deleteGroup(db: Firestore, id: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, COLLECTIONS.groups, id));

  const [activities, participants, reflections, summaries] = await Promise.all([
    getDocs(query(collection(db, COLLECTIONS.activities), where("groupId", "==", id))),
    getDocs(query(collection(db, COLLECTIONS.participants), where("groupId", "==", id))),
    getDocs(query(collection(db, COLLECTIONS.reflections), where("groupId", "==", id))),
    getDocs(query(collection(db, COLLECTIONS.groupSummaries), where("groupId", "==", id))),
  ]);

  for (const d of activities.docs as QueryDocumentSnapshot[]) batch.delete(d.ref);
  for (const d of participants.docs as QueryDocumentSnapshot[]) batch.delete(d.ref);
  for (const d of reflections.docs as QueryDocumentSnapshot[]) batch.delete(d.ref);
  for (const d of summaries.docs as QueryDocumentSnapshot[]) batch.delete(d.ref);

  await batch.commit();
}

// ---------------------------------------------------------------------------
// Participants
// ---------------------------------------------------------------------------

export async function listParticipants(
  db: Firestore,
  groupId: string,
): Promise<Participant[]> {
  const q = query(
    collection(db, COLLECTIONS.participants),
    where("groupId", "==", groupId),
    orderBy("createdAt", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot) => toParticipant(d.id, d.data()));
}

export async function ensureParticipant(
  db: Firestore,
  groupId: string,
  name: string,
  anonymous = false,
): Promise<Participant> {
  // Look for an existing match (case-insensitive). Firestore has no `ilike`,
  // so we filter client-side over the small set of group participants.
  const existingQ = query(
    collection(db, COLLECTIONS.participants),
    where("groupId", "==", groupId),
  );
  const existing = await getDocs(existingQ);
  for (const d of existing.docs as QueryDocumentSnapshot[]) {
    const data = d.data();
    if (typeof data.name === "string" && data.name.toLowerCase() === name.toLowerCase()) {
      return toParticipant(d.id, data);
    }
  }

  const id = nanoid(8);
  const ref = doc(db, COLLECTIONS.participants, id);
  const data = {
    groupId,
    name,
    anonymous,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return {
    id,
    groupId,
    name,
    anonymous,
    createdAt: nowIso(),
  };
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export async function listActivities(
  db: Firestore,
  groupId?: string,
): Promise<Activity[]> {
  const constraints = [orderBy("createdAt", "desc")];
  const base = groupId
    ? query(collection(db, COLLECTIONS.activities), where("groupId", "==", groupId), ...constraints)
    : query(collection(db, COLLECTIONS.activities), ...constraints);
  const snap = await getDocs(base);
  return snap.docs.map((d: QueryDocumentSnapshot) => toActivity(d.id, d.data()));
}

export async function getActivity(db: Firestore, id: string): Promise<Activity | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.activities, id));
  return snap.exists() ? toActivity(snap.id, snap.data()) : null;
}

export async function getActivityByShareCode(
  db: Firestore,
  code: string,
): Promise<Activity | null> {
  const q = query(
    collection(db, COLLECTIONS.activities),
    where("shareCode", "==", code),
    fbLimit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0] as QueryDocumentSnapshot;
  return toActivity(d.id, d.data());
}

export async function createActivity(
  db: Firestore,
  input: Omit<Activity, "id" | "createdAt" | "shareCode"> & { shareCode?: string },
): Promise<Activity> {
  const id = nanoid(8);
  const shareCode = input.shareCode ?? makeShareCode();
  const ref = doc(db, COLLECTIONS.activities, id);
  const data = {
    groupId: input.groupId,
    title: input.title,
    objective: input.objective,
    focus: input.focus,
    language: input.language,
    prompts: input.prompts,
    promptMode: input.promptMode,
    timingPerPromptSeconds: input.timingPerPromptSeconds,
    minimumSpeakingSeconds: input.minimumSpeakingSeconds,
    recordingMode: input.recordingMode,
    workspaceEnabled: input.workspaceEnabled,
    workspaceSteps: input.workspaceSteps,
    feedbackVisibility: input.feedbackVisibility,
    scoreVisibility: input.scoreVisibility,
    status: input.status,
    shareCode,
    assignedAt: input.assignedAt ?? null,
    rubric: input.rubric ?? null,
    modelingEnabled: input.modelingEnabled ?? null,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return {
    ...input,
    id,
    shareCode,
    createdAt: nowIso(),
  } as Activity;
}

export async function updateActivity(
  db: Firestore,
  id: string,
  patch: Partial<Activity>,
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.objective !== undefined) dbPatch.objective = patch.objective;
  if (patch.focus !== undefined) dbPatch.focus = patch.focus;
  if (patch.language !== undefined) dbPatch.language = patch.language;
  if (patch.prompts !== undefined) dbPatch.prompts = patch.prompts;
  if (patch.promptMode !== undefined) dbPatch.promptMode = patch.promptMode;
  if (patch.timingPerPromptSeconds !== undefined)
    dbPatch.timingPerPromptSeconds = patch.timingPerPromptSeconds;
  if (patch.minimumSpeakingSeconds !== undefined)
    dbPatch.minimumSpeakingSeconds = patch.minimumSpeakingSeconds;
  if (patch.recordingMode !== undefined) dbPatch.recordingMode = patch.recordingMode;
  if (patch.workspaceEnabled !== undefined) dbPatch.workspaceEnabled = patch.workspaceEnabled;
  if (patch.workspaceSteps !== undefined) dbPatch.workspaceSteps = patch.workspaceSteps;
  if (patch.feedbackVisibility !== undefined) dbPatch.feedbackVisibility = patch.feedbackVisibility;
  if (patch.scoreVisibility !== undefined) dbPatch.scoreVisibility = patch.scoreVisibility;
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.shareCode !== undefined) dbPatch.shareCode = patch.shareCode;
  if (patch.assignedAt !== undefined) dbPatch.assignedAt = patch.assignedAt ?? null;
  if (patch.rubric !== undefined) dbPatch.rubric = patch.rubric ?? null;
  if (patch.modelingEnabled !== undefined) dbPatch.modelingEnabled = patch.modelingEnabled ?? null;
  await updateDoc(doc(db, COLLECTIONS.activities, id), dbPatch);
}

export async function deleteActivity(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.activities, id));
}

// ---------------------------------------------------------------------------
// Reflections
// ---------------------------------------------------------------------------

export async function listReflections(
  db: Firestore,
  filter?: { groupId?: string; activityId?: string; ownerUserId?: string },
): Promise<Reflection[]> {
  const wheres = [] as ReturnType<typeof where>[];
  if (filter?.groupId) wheres.push(where("groupId", "==", filter.groupId));
  if (filter?.activityId) wheres.push(where("activityId", "==", filter.activityId));
  if (filter?.ownerUserId) wheres.push(where("ownerUserId", "==", filter.ownerUserId));

  const q = query(
    collection(db, COLLECTIONS.reflections),
    ...wheres,
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot) => toReflection(d.id, d.data()));
}

export async function getReflection(
  db: Firestore,
  id: string,
): Promise<Reflection | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.reflections, id));
  return snap.exists() ? toReflection(snap.id, snap.data()) : null;
}

export async function createReflection(
  db: Firestore,
  input: Omit<Reflection, "id" | "createdAt">,
): Promise<Reflection> {
  const id = nanoid(8);
  const ref = doc(db, COLLECTIONS.reflections, id);
  const data = {
    activityId: input.activityId,
    groupId: input.groupId,
    participantId: input.participantId,
    participantName: input.participantName,
    ownerUserId: input.ownerUserId,
    objective: input.objective,
    focus: input.focus,
    responses: input.responses,
    analysis: input.analysis ?? null,
    feedbackVisibility: input.feedbackVisibility,
    scoreVisibility: input.scoreVisibility,
    completedAt: input.completedAt ?? null,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return {
    ...input,
    id,
    createdAt: nowIso(),
  };
}

export async function updateReflection(
  db: Firestore,
  id: string,
  patch: Partial<Reflection>,
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.activityId !== undefined) dbPatch.activityId = patch.activityId;
  if (patch.groupId !== undefined) dbPatch.groupId = patch.groupId;
  if (patch.participantId !== undefined) dbPatch.participantId = patch.participantId;
  if (patch.participantName !== undefined) dbPatch.participantName = patch.participantName;
  if (patch.objective !== undefined) dbPatch.objective = patch.objective;
  if (patch.focus !== undefined) dbPatch.focus = patch.focus;
  if (patch.responses !== undefined) dbPatch.responses = patch.responses;
  if (patch.analysis !== undefined) dbPatch.analysis = patch.analysis ?? null;
  if (patch.feedbackVisibility !== undefined) dbPatch.feedbackVisibility = patch.feedbackVisibility;
  if (patch.scoreVisibility !== undefined) dbPatch.scoreVisibility = patch.scoreVisibility;
  if (patch.completedAt !== undefined) dbPatch.completedAt = patch.completedAt ?? null;
  await updateDoc(doc(db, COLLECTIONS.reflections, id), dbPatch);
}

export async function deleteReflection(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.reflections, id));
}

// ---------------------------------------------------------------------------
// Group summaries
// ---------------------------------------------------------------------------

export async function getGroupSummary(
  db: Firestore,
  groupId: string,
  activityId: string | null,
): Promise<GroupSummary | null> {
  const wheres = [where("groupId", "==", groupId)];
  if (activityId === null) wheres.push(where("activityId", "==", null));
  else wheres.push(where("activityId", "==", activityId));

  const q = query(
    collection(db, COLLECTIONS.groupSummaries),
    ...wheres,
    orderBy("generatedAt", "desc"),
    fbLimit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0] as QueryDocumentSnapshot;
  return toGroupSummary(d.id, d.data());
}

export async function saveGroupSummary(
  db: Firestore,
  summary: GroupSummary,
): Promise<GroupSummary> {
  // Replace any prior summary for the same (groupId, activityId) tuple.
  const wheres = [where("groupId", "==", summary.groupId)];
  if (summary.activityId === null) wheres.push(where("activityId", "==", null));
  else wheres.push(where("activityId", "==", summary.activityId));

  const stale = await getDocs(query(collection(db, COLLECTIONS.groupSummaries), ...wheres));
  if (!stale.empty) {
    const batch = writeBatch(db);
    for (const d of stale.docs as QueryDocumentSnapshot[]) batch.delete(d.ref);
    await batch.commit();
  }

  const id = summary.id || nanoid(8);
  const ref = doc(db, COLLECTIONS.groupSummaries, id);
  const data = {
    groupId: summary.groupId,
    activityId: summary.activityId,
    reflectionCount: summary.reflectionCount,
    understandingParagraph: summary.understandingParagraph,
    teacherMovesParagraph: summary.teacherMovesParagraph,
    recommendedTeacherMoves: summary.recommendedTeacherMoves,
    commonStrengths: summary.commonStrengths,
    commonStruggles: summary.commonStruggles,
    studentsNeedingFollowUp: summary.studentsNeedingFollowUp,
    studentsReadyForExtension: summary.studentsReadyForExtension,
    generatedAt: summary.generatedAt ?? nowIso(),
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return { ...summary, id };
}

// addDoc is exported above to keep the import list aligned with potential
// future use; reference once here so the unused-import lint stays quiet.
void addDoc;
