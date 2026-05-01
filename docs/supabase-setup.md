# Supabase + email-alerts setup

The Reflection App ships with **localStorage persistence by default** — the
demo flows run end-to-end without any external service. The files in this
guide give you a one-flag-flip path to real persistence (Supabase) and
real educator emails (Resend) when you're ready.

Until the env vars below are set, the runtime path is unchanged: every
mutation goes through `src/lib/storage.ts` and stays on the device.

---

## 1. Install the SDKs

The Supabase wrappers (`src/lib/supabase/*`) are written against
`@supabase/ssr` and `@supabase/supabase-js` but the packages are **not yet
installed**. Run:

```bash
npm i @supabase/ssr @supabase/supabase-js
```

Once installed, the ambient module declarations in
`src/lib/supabase/types.d.ts` get shadowed by the real package types and
the wrappers become fully type-safe.

The email-alert helper (`src/lib/email/alerts.ts`) calls Resend directly
via `fetch`, so no email SDK install is needed.

---

## 2. Create a Supabase project

1. Go to <https://supabase.com> and create a new project.
2. In the project dashboard, open **SQL Editor → New query**.
3. Paste the contents of [`supabase/schema.sql`](../supabase/schema.sql) and
   run it. The migration is idempotent (`CREATE TABLE IF NOT EXISTS`,
   `CREATE POLICY IF NOT EXISTS`) so you can rerun it safely.

The schema mirrors the TypeScript types in `src/lib/types.ts`:

| Table              | Purpose                                                         |
| ------------------ | --------------------------------------------------------------- |
| `users`            | Educator + personal accounts; `id` matches `auth.users.id`.     |
| `groups`           | Educator-owned cohorts.                                         |
| `participants`     | Students inside a group (named or anonymous).                   |
| `activities`       | Reflection assignments with a unique `share_code`.              |
| `reflections`      | Student submissions + AI analysis (`responses`, `analysis` JSON).|
| `group_summaries`  | Cached aggregate AI summaries.                                  |

Row-Level Security is on for every table:

- Educators can read + write **their own** groups, activities, reflections,
  participants, and summaries.
- Anonymous users (the share-code path) can:
  - read an activity by `share_code` only when its `status = 'assigned'`,
  - insert a participant tied to that activity's group,
  - insert a reflection tied to that activity.
- Anonymous users cannot read existing reflections or group data.

---

## 3. Wire up env vars

Copy your project's URL and anon key from
**Settings → API** in the Supabase dashboard, then add them to
`.env.local`:

```bash
# Supabase persistence (optional). When unset, the app uses localStorage only.
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

`getSupabaseClient()` and `getSupabaseServerClient()` both return `null`
when these vars are absent — call sites should fall through to the
`store.xxx()` localStorage path.

---

## 4. Configure Resend for safety-alert emails (optional)

The `/api/alerts/safety` route calls `sendSafetyAlert()` which talks to
[Resend](https://resend.com) over plain `fetch`. To turn it on:

1. Create a Resend account and verify the sending domain you'll use.
2. Generate an API key (**Resend dashboard → API Keys**).
3. Add to `.env.local`:

   ```bash
   RESEND_API_KEY=re_XXXXXXXXXXXX
   ALERTS_FROM_EMAIL=alerts@yourdomain.com
   ```

When `RESEND_API_KEY` is unset the helper logs the alert to the server
console and the route still returns `200 { ok: true, sent: { sent: false,
reason: "no_api_key" } }` so the analyze flow can fire-and-forget without
breaking.

---

## 5. Flip the runtime path (later, when ready)

`src/lib/supabase/queries.ts` mirrors the surface of `store.xxx()` in
`src/lib/storage.ts` (e.g. `createGroup`, `getActivityByShareCode`,
`createReflection`, `listReflections`, …). When you're ready to migrate:

1. Pick a slice (start with reflections — read-only listing is the
   smallest change).
2. In the calling component/route, prefer the Supabase client when
   `getSupabaseClient()` returns non-null; fall back to `store.xxx()`
   otherwise.
3. Migrate slice-by-slice. Both paths can coexist indefinitely.

The localStorage store is intentionally **untouched** by this scaffold so
the current demo continues to work.
