// Typed Supabase query wrappers. Mirrors the surface of `store.xxx()` in
// `@/lib/storage` so a future swap is mechanical: each function takes the
// Supabase client as the first arg and accepts/returns the same domain
// types from `@/lib/types`.
//
// TODO before this can run live:
//   npm i @supabase/ssr @supabase/supabase-js
//
// Tables mirror `supabase/schema.sql`. Column names are snake_case in the
// DB and camelCase in TS; the row<->domain mappers live at the bottom.

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Activity,
  Group,
  GroupSummary,
  Participant,
  Reflection,
  ReflectionAnalysis,
  User,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Row shapes (snake_case, as stored in Postgres).
// ---------------------------------------------------------------------------

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  role: User["role"];
  created_at: string;
};

type GroupRow = {
  id: string;
  owner_user_id: string;
  name: string;
  grade_band: Group["gradeBand"];
  access_type: Group["accessType"];
  language: string;
  recording_mode: Group["recordingMode"];
  greeting_enabled: boolean;
  manager_ids: string[];
  created_at: string;
};

type ParticipantRow = {
  id: string;
  group_id: string;
  name: string;
  email: string | null;
  anonymous: boolean;
  created_at: string;
};

type ActivityRow = {
  id: string;
  group_id: string;
  title: string;
  objective: string;
  focus: Activity["focus"];
  language: string;
  prompts: Activity["prompts"];
  prompt_mode: Activity["promptMode"];
  timing_per_prompt_seconds: number;
  minimum_speaking_seconds: number;
  recording_mode: Activity["recordingMode"];
  workspace_enabled: boolean;
  workspace_steps: Activity["workspaceSteps"];
  feedback_visibility: Activity["feedbackVisibility"];
  score_visibility: Activity["scoreVisibility"];
  status: Activity["status"];
  share_code: string;
  assigned_at: string | null;
  created_at: string;
};

type ReflectionRow = {
  id: string;
  activity_id: string | null;
  group_id: string | null;
  participant_id: string | null;
  participant_name: string;
  owner_user_id: string;
  objective: string;
  focus: Reflection["focus"];
  responses: Reflection["responses"];
  analysis: ReflectionAnalysis | null;
  feedback_visibility: Reflection["feedbackVisibility"];
  score_visibility: Reflection["scoreVisibility"];
  completed_at: string | null;
  created_at: string;
};

type GroupSummaryRow = {
  id: string;
  group_id: string;
  activity_id: string | null;
  reflection_count: number;
  understanding_paragraph: string;
  teacher_moves_paragraph: string;
  recommended_teacher_moves: string[];
  common_strengths: string[];
  common_struggles: string[];
  students_needing_follow_up: string[];
  students_ready_for_extension: string[];
  generated_at: string;
};

// ---------------------------------------------------------------------------
// Mappers — DB row <-> domain type.
// ---------------------------------------------------------------------------

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    role: row.role,
    createdAt: row.created_at,
  };
}

function toGroup(row: GroupRow, participantIds: string[] = []): Group {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_user_id,
    gradeBand: row.grade_band,
    accessType: row.access_type,
    language: row.language,
    recordingMode: row.recording_mode,
    greetingEnabled: row.greeting_enabled,
    createdAt: row.created_at,
    participantIds,
    managerIds: row.manager_ids ?? [],
  };
}

function toParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    email: row.email ?? undefined,
    anonymous: row.anonymous,
    createdAt: row.created_at,
  };
}

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    groupId: row.group_id,
    title: row.title,
    objective: row.objective,
    focus: row.focus,
    language: row.language,
    prompts: row.prompts ?? [],
    promptMode: row.prompt_mode,
    timingPerPromptSeconds: row.timing_per_prompt_seconds,
    minimumSpeakingSeconds: row.minimum_speaking_seconds,
    recordingMode: row.recording_mode,
    workspaceEnabled: row.workspace_enabled,
    workspaceSteps: row.workspace_steps ?? [],
    feedbackVisibility: row.feedback_visibility,
    scoreVisibility: row.score_visibility,
    status: row.status,
    shareCode: row.share_code,
    assignedAt: row.assigned_at ?? undefined,
    createdAt: row.created_at,
  };
}

function toReflection(row: ReflectionRow): Reflection {
  return {
    id: row.id,
    activityId: row.activity_id,
    groupId: row.group_id,
    participantId: row.participant_id,
    participantName: row.participant_name,
    ownerUserId: row.owner_user_id,
    objective: row.objective,
    focus: row.focus,
    responses: row.responses ?? [],
    analysis: row.analysis ?? undefined,
    feedbackVisibility: row.feedback_visibility,
    scoreVisibility: row.score_visibility,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
  };
}

function toGroupSummary(row: GroupSummaryRow): GroupSummary {
  return {
    id: row.id,
    groupId: row.group_id,
    activityId: row.activity_id,
    reflectionCount: row.reflection_count,
    understandingParagraph: row.understanding_paragraph,
    teacherMovesParagraph: row.teacher_moves_paragraph,
    recommendedTeacherMoves: row.recommended_teacher_moves ?? [],
    commonStrengths: row.common_strengths ?? [],
    commonStruggles: row.common_struggles ?? [],
    studentsNeedingFollowUp: row.students_needing_follow_up ?? [],
    studentsReadyForExtension: row.students_ready_for_extension ?? [],
    generatedAt: row.generated_at,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}

function makeShareCode(): string {
  // Random URL-safe code, 10 chars. Avoids needing a server-only nanoid call.
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function ensureUser(
  client: SupabaseClient,
  input: { id: string; name?: string; email?: string; role?: User["role"] },
): Promise<User> {
  const existing = await client
    .from("users")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();
  if (existing.data) return toUser(existing.data as UserRow);

  const inserted = await client
    .from("users")
    .insert({
      id: input.id,
      name: input.name ?? "Educator",
      email: input.email ?? null,
      role: input.role ?? "educator",
    })
    .select("*")
    .single();
  if (inserted.error) throw inserted.error;
  return toUser(inserted.data as UserRow);
}

export async function updateUser(
  client: SupabaseClient,
  id: string,
  patch: Partial<User>,
): Promise<void> {
  const dbPatch: Partial<UserRow> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.email !== undefined) dbPatch.email = patch.email ?? null;
  if (patch.role !== undefined) dbPatch.role = patch.role;
  const res = await client.from("users").update(dbPatch).eq("id", id);
  if (res.error) throw res.error;
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export async function listGroups(client: SupabaseClient, ownerUserId: string): Promise<Group[]> {
  const res = await client
    .from("groups")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: false });
  if (res.error) throw res.error;
  return ((res.data ?? []) as GroupRow[]).map((r) => toGroup(r));
}

export async function getGroup(client: SupabaseClient, id: string): Promise<Group | null> {
  const res = await client.from("groups").select("*").eq("id", id).maybeSingle();
  if (res.error) throw res.error;
  if (!res.data) return null;

  const participants = await client
    .from("participants")
    .select("id")
    .eq("group_id", id);
  const ids = ((participants.data ?? []) as { id: string }[]).map((p) => p.id);
  return toGroup(res.data as GroupRow, ids);
}

export async function createGroup(
  client: SupabaseClient,
  input: Omit<Group, "id" | "createdAt" | "participantIds" | "managerIds">,
): Promise<Group> {
  const res = await client
    .from("groups")
    .insert({
      name: input.name,
      owner_user_id: input.ownerId,
      grade_band: input.gradeBand,
      access_type: input.accessType,
      language: input.language,
      recording_mode: input.recordingMode,
      greeting_enabled: input.greetingEnabled,
      manager_ids: [],
    })
    .select("*")
    .single();
  if (res.error) throw res.error;
  return toGroup(res.data as GroupRow);
}

export async function updateGroup(
  client: SupabaseClient,
  id: string,
  patch: Partial<Group>,
): Promise<void> {
  const dbPatch: Partial<GroupRow> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.gradeBand !== undefined) dbPatch.grade_band = patch.gradeBand;
  if (patch.accessType !== undefined) dbPatch.access_type = patch.accessType;
  if (patch.language !== undefined) dbPatch.language = patch.language;
  if (patch.recordingMode !== undefined) dbPatch.recording_mode = patch.recordingMode;
  if (patch.greetingEnabled !== undefined) dbPatch.greeting_enabled = patch.greetingEnabled;
  if (patch.managerIds !== undefined) dbPatch.manager_ids = patch.managerIds;
  const res = await client.from("groups").update(dbPatch).eq("id", id);
  if (res.error) throw res.error;
}

export async function deleteGroup(client: SupabaseClient, id: string): Promise<void> {
  const res = await client.from("groups").delete().eq("id", id);
  if (res.error) throw res.error;
}

// ---------------------------------------------------------------------------
// Participants
// ---------------------------------------------------------------------------

export async function listParticipants(
  client: SupabaseClient,
  groupId: string,
): Promise<Participant[]> {
  const res = await client
    .from("participants")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });
  if (res.error) throw res.error;
  return ((res.data ?? []) as ParticipantRow[]).map(toParticipant);
}

export async function ensureParticipant(
  client: SupabaseClient,
  groupId: string,
  name: string,
  anonymous = false,
): Promise<Participant> {
  const existing = await client
    .from("participants")
    .select("*")
    .eq("group_id", groupId)
    .ilike("name", name)
    .maybeSingle();
  if (existing.data) return toParticipant(existing.data as ParticipantRow);

  const inserted = await client
    .from("participants")
    .insert({ group_id: groupId, name, anonymous })
    .select("*")
    .single();
  if (inserted.error) throw inserted.error;
  return toParticipant(inserted.data as ParticipantRow);
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export async function listActivities(
  client: SupabaseClient,
  groupId?: string,
): Promise<Activity[]> {
  let q = client.from("activities").select("*").order("created_at", { ascending: false });
  if (groupId) q = q.eq("group_id", groupId);
  const res = await q;
  if (res.error) throw res.error;
  return ((res.data ?? []) as ActivityRow[]).map(toActivity);
}

export async function getActivity(
  client: SupabaseClient,
  id: string,
): Promise<Activity | null> {
  const res = await client.from("activities").select("*").eq("id", id).maybeSingle();
  if (res.error) throw res.error;
  return res.data ? toActivity(res.data as ActivityRow) : null;
}

export async function getActivityByShareCode(
  client: SupabaseClient,
  code: string,
): Promise<Activity | null> {
  const res = await client
    .from("activities")
    .select("*")
    .eq("share_code", code)
    .maybeSingle();
  if (res.error) throw res.error;
  return res.data ? toActivity(res.data as ActivityRow) : null;
}

export async function createActivity(
  client: SupabaseClient,
  input: Omit<Activity, "id" | "createdAt" | "shareCode"> & { shareCode?: string },
): Promise<Activity> {
  const res = await client
    .from("activities")
    .insert({
      group_id: input.groupId,
      title: input.title,
      objective: input.objective,
      focus: input.focus,
      language: input.language,
      prompts: input.prompts,
      prompt_mode: input.promptMode,
      timing_per_prompt_seconds: input.timingPerPromptSeconds,
      minimum_speaking_seconds: input.minimumSpeakingSeconds,
      recording_mode: input.recordingMode,
      workspace_enabled: input.workspaceEnabled,
      workspace_steps: input.workspaceSteps,
      feedback_visibility: input.feedbackVisibility,
      score_visibility: input.scoreVisibility,
      status: input.status,
      share_code: input.shareCode ?? makeShareCode(),
      assigned_at: input.assignedAt ?? null,
    })
    .select("*")
    .single();
  if (res.error) throw res.error;
  return toActivity(res.data as ActivityRow);
}

export async function updateActivity(
  client: SupabaseClient,
  id: string,
  patch: Partial<Activity>,
): Promise<void> {
  const dbPatch: Partial<ActivityRow> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.objective !== undefined) dbPatch.objective = patch.objective;
  if (patch.focus !== undefined) dbPatch.focus = patch.focus;
  if (patch.language !== undefined) dbPatch.language = patch.language;
  if (patch.prompts !== undefined) dbPatch.prompts = patch.prompts;
  if (patch.promptMode !== undefined) dbPatch.prompt_mode = patch.promptMode;
  if (patch.timingPerPromptSeconds !== undefined)
    dbPatch.timing_per_prompt_seconds = patch.timingPerPromptSeconds;
  if (patch.minimumSpeakingSeconds !== undefined)
    dbPatch.minimum_speaking_seconds = patch.minimumSpeakingSeconds;
  if (patch.recordingMode !== undefined) dbPatch.recording_mode = patch.recordingMode;
  if (patch.workspaceEnabled !== undefined) dbPatch.workspace_enabled = patch.workspaceEnabled;
  if (patch.workspaceSteps !== undefined) dbPatch.workspace_steps = patch.workspaceSteps;
  if (patch.feedbackVisibility !== undefined) dbPatch.feedback_visibility = patch.feedbackVisibility;
  if (patch.scoreVisibility !== undefined) dbPatch.score_visibility = patch.scoreVisibility;
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.shareCode !== undefined) dbPatch.share_code = patch.shareCode;
  if (patch.assignedAt !== undefined) dbPatch.assigned_at = patch.assignedAt ?? null;
  const res = await client.from("activities").update(dbPatch).eq("id", id);
  if (res.error) throw res.error;
}

export async function deleteActivity(client: SupabaseClient, id: string): Promise<void> {
  const res = await client.from("activities").delete().eq("id", id);
  if (res.error) throw res.error;
}

// ---------------------------------------------------------------------------
// Reflections
// ---------------------------------------------------------------------------

export async function listReflections(
  client: SupabaseClient,
  filter?: { groupId?: string; activityId?: string; ownerUserId?: string },
): Promise<Reflection[]> {
  let q = client.from("reflections").select("*").order("created_at", { ascending: false });
  if (filter?.groupId) q = q.eq("group_id", filter.groupId);
  if (filter?.activityId) q = q.eq("activity_id", filter.activityId);
  if (filter?.ownerUserId) q = q.eq("owner_user_id", filter.ownerUserId);
  const res = await q;
  if (res.error) throw res.error;
  return ((res.data ?? []) as ReflectionRow[]).map(toReflection);
}

export async function getReflection(
  client: SupabaseClient,
  id: string,
): Promise<Reflection | null> {
  const res = await client.from("reflections").select("*").eq("id", id).maybeSingle();
  if (res.error) throw res.error;
  return res.data ? toReflection(res.data as ReflectionRow) : null;
}

export async function createReflection(
  client: SupabaseClient,
  input: Omit<Reflection, "id" | "createdAt">,
): Promise<Reflection> {
  const res = await client
    .from("reflections")
    .insert({
      activity_id: input.activityId,
      group_id: input.groupId,
      participant_id: input.participantId,
      participant_name: input.participantName,
      owner_user_id: input.ownerUserId,
      objective: input.objective,
      focus: input.focus,
      responses: input.responses,
      analysis: input.analysis ?? null,
      feedback_visibility: input.feedbackVisibility,
      score_visibility: input.scoreVisibility,
      completed_at: input.completedAt ?? null,
    })
    .select("*")
    .single();
  if (res.error) throw res.error;
  return toReflection(res.data as ReflectionRow);
}

export async function updateReflection(
  client: SupabaseClient,
  id: string,
  patch: Partial<Reflection>,
): Promise<void> {
  const dbPatch: Partial<ReflectionRow> = {};
  if (patch.activityId !== undefined) dbPatch.activity_id = patch.activityId;
  if (patch.groupId !== undefined) dbPatch.group_id = patch.groupId;
  if (patch.participantId !== undefined) dbPatch.participant_id = patch.participantId;
  if (patch.participantName !== undefined) dbPatch.participant_name = patch.participantName;
  if (patch.objective !== undefined) dbPatch.objective = patch.objective;
  if (patch.focus !== undefined) dbPatch.focus = patch.focus;
  if (patch.responses !== undefined) dbPatch.responses = patch.responses;
  if (patch.analysis !== undefined) dbPatch.analysis = patch.analysis ?? null;
  if (patch.feedbackVisibility !== undefined) dbPatch.feedback_visibility = patch.feedbackVisibility;
  if (patch.scoreVisibility !== undefined) dbPatch.score_visibility = patch.scoreVisibility;
  if (patch.completedAt !== undefined) dbPatch.completed_at = patch.completedAt ?? null;
  const res = await client.from("reflections").update(dbPatch).eq("id", id);
  if (res.error) throw res.error;
}

export async function deleteReflection(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const res = await client.from("reflections").delete().eq("id", id);
  if (res.error) throw res.error;
}

// ---------------------------------------------------------------------------
// Group summaries
// ---------------------------------------------------------------------------

export async function getGroupSummary(
  client: SupabaseClient,
  groupId: string,
  activityId: string | null,
): Promise<GroupSummary | null> {
  let q = client.from("group_summaries").select("*").eq("group_id", groupId);
  q = activityId === null ? q.is("activity_id", null) : q.eq("activity_id", activityId);
  const res = await q.order("generated_at", { ascending: false }).limit(1).maybeSingle();
  if (res.error) throw res.error;
  return res.data ? toGroupSummary(res.data as GroupSummaryRow) : null;
}

export async function saveGroupSummary(
  client: SupabaseClient,
  summary: GroupSummary,
): Promise<GroupSummary> {
  // Replace prior row for the same (group_id, activity_id) tuple.
  const del = client.from("group_summaries").delete().eq("group_id", summary.groupId);
  const delQ =
    summary.activityId === null
      ? del.is("activity_id", null)
      : del.eq("activity_id", summary.activityId);
  const delRes = await delQ;
  if (delRes.error) throw delRes.error;

  const res = await client
    .from("group_summaries")
    .insert({
      group_id: summary.groupId,
      activity_id: summary.activityId,
      reflection_count: summary.reflectionCount,
      understanding_paragraph: summary.understandingParagraph,
      teacher_moves_paragraph: summary.teacherMovesParagraph,
      recommended_teacher_moves: summary.recommendedTeacherMoves,
      common_strengths: summary.commonStrengths,
      common_struggles: summary.commonStruggles,
      students_needing_follow_up: summary.studentsNeedingFollowUp,
      students_ready_for_extension: summary.studentsReadyForExtension,
      generated_at: summary.generatedAt ?? nowIso(),
    })
    .select("*")
    .single();
  if (res.error) throw res.error;
  return toGroupSummary(res.data as GroupSummaryRow);
}
