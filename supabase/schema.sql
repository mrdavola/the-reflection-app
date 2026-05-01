-- The Reflection App — Supabase schema
-- Idempotent migration. Run via the Supabase SQL editor.
--
-- Mirrors TypeScript types in src/lib/types.ts.
-- All tables use UUID primary keys with gen_random_uuid() defaults and a
-- created_at timestamptz default now(). Mutable rich payloads (prompts,
-- responses, analysis, etc.) are stored as JSONB for flexibility.

-- pgcrypto provides gen_random_uuid().
create extension if not exists "pgcrypto";

------------------------------------------------------------------------------
-- users
------------------------------------------------------------------------------
-- One row per signed-in educator/personal user. The `id` matches
-- auth.users.id when the user authenticates via Supabase Auth, so RLS
-- policies can use auth.uid() directly.
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  role text not null default 'educator' check (role in ('educator', 'personal')),
  created_at timestamptz not null default now()
);

------------------------------------------------------------------------------
-- groups
------------------------------------------------------------------------------
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  grade_band text not null,
  access_type text not null,
  language text not null default 'English',
  recording_mode text not null default 'audio-or-text',
  greeting_enabled boolean not null default true,
  manager_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists groups_owner_user_id_idx on public.groups (owner_user_id);

------------------------------------------------------------------------------
-- participants
------------------------------------------------------------------------------
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name text not null,
  email text,
  anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists participants_group_id_idx on public.participants (group_id);

------------------------------------------------------------------------------
-- activities
------------------------------------------------------------------------------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  objective text not null,
  focus text not null,
  language text not null default 'English',
  prompts jsonb not null default '[]'::jsonb,
  prompt_mode text not null default 'all-ai',
  timing_per_prompt_seconds integer not null default 0,
  minimum_speaking_seconds integer not null default 0,
  recording_mode text not null default 'audio-or-text',
  workspace_enabled boolean not null default false,
  workspace_steps jsonb not null default '[]'::jsonb,
  feedback_visibility text not null default 'show',
  score_visibility text not null default 'show',
  status text not null default 'draft' check (status in ('draft', 'assigned', 'archived')),
  share_code text not null unique,
  assigned_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists activities_group_id_idx on public.activities (group_id);
create index if not exists activities_share_code_idx on public.activities (share_code);

------------------------------------------------------------------------------
-- reflections
------------------------------------------------------------------------------
create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references public.activities(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  participant_id uuid references public.participants(id) on delete set null,
  participant_name text not null,
  owner_user_id uuid not null references public.users(id) on delete cascade,
  objective text not null,
  focus text not null,
  responses jsonb not null default '[]'::jsonb,
  analysis jsonb,
  feedback_visibility text not null default 'show',
  score_visibility text not null default 'show',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists reflections_owner_user_id_idx on public.reflections (owner_user_id);
create index if not exists reflections_activity_id_idx on public.reflections (activity_id);
create index if not exists reflections_group_id_idx on public.reflections (group_id);

------------------------------------------------------------------------------
-- group_summaries
------------------------------------------------------------------------------
create table if not exists public.group_summaries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  reflection_count integer not null default 0,
  understanding_paragraph text not null default '',
  teacher_moves_paragraph text not null default '',
  recommended_teacher_moves jsonb not null default '[]'::jsonb,
  common_strengths jsonb not null default '[]'::jsonb,
  common_struggles jsonb not null default '[]'::jsonb,
  students_needing_follow_up jsonb not null default '[]'::jsonb,
  students_ready_for_extension jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists group_summaries_group_id_idx on public.group_summaries (group_id);
create index if not exists group_summaries_activity_id_idx on public.group_summaries (activity_id);

------------------------------------------------------------------------------
-- Row Level Security
------------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.participants enable row level security;
alter table public.activities enable row level security;
alter table public.reflections enable row level security;
alter table public.group_summaries enable row level security;

-- users: each row is readable + writable by the matching auth user.
create policy if not exists "users self read"
  on public.users for select
  using (auth.uid() = id);

create policy if not exists "users self upsert"
  on public.users for insert
  with check (auth.uid() = id);

create policy if not exists "users self update"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- groups: educators read+write their own.
create policy if not exists "groups owner read"
  on public.groups for select
  using (auth.uid() = owner_user_id);

create policy if not exists "groups owner write"
  on public.groups for insert
  with check (auth.uid() = owner_user_id);

create policy if not exists "groups owner update"
  on public.groups for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

create policy if not exists "groups owner delete"
  on public.groups for delete
  using (auth.uid() = owner_user_id);

-- participants: educator who owns the group can read+write.
-- Anonymous users can also INSERT a participant when they hit a share-code
-- activity (validated at the activity level — see policies below).
create policy if not exists "participants owner read"
  on public.participants for select
  using (
    exists (
      select 1 from public.groups g
      where g.id = participants.group_id and g.owner_user_id = auth.uid()
    )
  );

create policy if not exists "participants owner write"
  on public.participants for insert
  with check (
    exists (
      select 1 from public.groups g
      where g.id = participants.group_id and g.owner_user_id = auth.uid()
    )
  );

-- Allow anonymous participant creation when an active share_code exists for
-- the activity context. This lets students join via share-code without auth.
create policy if not exists "participants anon insert via share"
  on public.participants for insert
  to anon
  with check (
    exists (
      select 1 from public.activities a
      where a.group_id = participants.group_id
        and a.status = 'assigned'
    )
  );

-- activities: educators read+write their own. Anyone (including anon) can
-- read an activity by share_code only if it's assigned — needed for the
-- student share-code flow.
create policy if not exists "activities owner read"
  on public.activities for select
  using (
    exists (
      select 1 from public.groups g
      where g.id = activities.group_id and g.owner_user_id = auth.uid()
    )
  );

create policy if not exists "activities anon read by share"
  on public.activities for select
  to anon
  using (status = 'assigned');

create policy if not exists "activities owner write"
  on public.activities for insert
  with check (
    exists (
      select 1 from public.groups g
      where g.id = activities.group_id and g.owner_user_id = auth.uid()
    )
  );

create policy if not exists "activities owner update"
  on public.activities for update
  using (
    exists (
      select 1 from public.groups g
      where g.id = activities.group_id and g.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.groups g
      where g.id = activities.group_id and g.owner_user_id = auth.uid()
    )
  );

create policy if not exists "activities owner delete"
  on public.activities for delete
  using (
    exists (
      select 1 from public.groups g
      where g.id = activities.group_id and g.owner_user_id = auth.uid()
    )
  );

-- reflections: educators read+write their own. Anonymous students can
-- INSERT reflections that are tied to an assigned activity (share-code
-- submission path). They cannot read existing reflections.
create policy if not exists "reflections owner read"
  on public.reflections for select
  using (auth.uid() = owner_user_id);

create policy if not exists "reflections owner write"
  on public.reflections for insert
  with check (auth.uid() = owner_user_id);

create policy if not exists "reflections owner update"
  on public.reflections for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

create policy if not exists "reflections owner delete"
  on public.reflections for delete
  using (auth.uid() = owner_user_id);

create policy if not exists "reflections anon insert via share"
  on public.reflections for insert
  to anon
  with check (
    activity_id is not null
    and exists (
      select 1 from public.activities a
      where a.id = reflections.activity_id and a.status = 'assigned'
    )
  );

-- group_summaries: educators read+write their own.
create policy if not exists "group_summaries owner read"
  on public.group_summaries for select
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_summaries.group_id and g.owner_user_id = auth.uid()
    )
  );

create policy if not exists "group_summaries owner write"
  on public.group_summaries for insert
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_summaries.group_id and g.owner_user_id = auth.uid()
    )
  );

create policy if not exists "group_summaries owner update"
  on public.group_summaries for update
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_summaries.group_id and g.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_summaries.group_id and g.owner_user_id = auth.uid()
    )
  );
