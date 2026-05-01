# Publish Guide — The Reflection App

Step-by-step from "this code on my Mac" to "live at thereflectionapp.com".
Everything you need is below. Copy-paste the commands. Each numbered step
is a clean stop point.

---

## What you'll do

| Phase | What you get | Time | Required? |
|---|---|---|---|
| 1. Push to GitHub | A repo at `github.com/mrdavola/the-reflection-app` | 3 min | yes |
| 2. Deploy to Vercel | A live URL like `the-reflection-app.vercel.app` | 5 min | yes |
| 3. Add your domain | Live at `thereflectionapp.com` | 10 min + DNS wait | recommended |
| 4. Real AI | Claude / Whisper instead of mock fallbacks | 5 min | recommended |
| 5. Persistence | Supabase: data survives across devices | 15 min | optional |
| 6. Email alerts | Real emails when a student writes something serious | 5 min | optional |

You can stop after Phase 2 and have a working public site. The remaining phases
make it production-ready.

---

## Phase 1 — Push to GitHub

You're sitting in `/Users/md/Refleckt`. The `gh` CLI is already logged in as
`mrdavola`.

### 1.1 — Decide what NOT to ship publicly

Two big spec files live at the repo root. They're already copied (cleaned-up)
into `docs/`. Don't ship the root copies — they're internal scratch.

```bash
cd /Users/md/Refleckt

# Add the root-level spec dupes to .gitignore
cat >> .gitignore << 'EOF'

# Internal spec scratch — clean copies live in docs/
/mirror-talk-remix-spec.md
/Untitled document*.md
EOF
```

### 1.2 — Commit everything

```bash
cd /Users/md/Refleckt
git add -A
git status --short    # eyeball it; should NOT include the spec files above
git commit -m "Initial build — full app, Phases 1–3"
```

### 1.3 — Create the GitHub repo and push

```bash
cd /Users/md/Refleckt
gh repo create the-reflection-app \
  --public \
  --source=. \
  --description "AI reflection coach for learners and educators" \
  --push
```

That single command:
- creates `github.com/mrdavola/the-reflection-app`
- adds it as your `origin` remote
- pushes `main`

Verify:
```bash
gh repo view --web    # opens it in your browser
```

> **If you want it private instead**, swap `--public` for `--private`. Vercel
> works fine with private repos.

---

## Phase 2 — Deploy to Vercel

The `vercel` CLI is installed. We'll use it.

### 2.1 — Log in to Vercel

```bash
vercel login
```

Pick "Continue with GitHub" — same account as your `gh` login.

### 2.2 — Link the project

```bash
cd /Users/md/Refleckt
vercel link
```

Answer the prompts:
- **Set up and deploy?** → `y`
- **Which scope?** → your personal account (or a team if you have one)
- **Link to existing project?** → `n`
- **Project name?** → `the-reflection-app` (default is fine)
- **In which directory is your code located?** → `./` (just press enter)

Vercel detects Next.js automatically. No build config needed.

### 2.3 — Deploy

```bash
vercel --prod
```

When it finishes (~2 minutes), it prints a URL like
`https://the-reflection-app-xxxx.vercel.app`. Open it. The whole app runs —
heuristic AI fallbacks kick in because no env vars are set yet.

### 2.4 — Connect to GitHub for auto-deploys

```bash
vercel git connect
```

Now every `git push` to `main` auto-deploys to production, and every PR gets a
preview URL.

---

## Phase 3 — Add your custom domain

You said `thereflectionapp.com` is available. Buy it, then point it at Vercel.

### 3.1 — Buy the domain

Easiest: **buy it through Vercel** so DNS is automatic.

```bash
vercel domains buy thereflectionapp.com
```

Or buy from Namecheap / Cloudflare / Google Domains and use Phase 3.3 below.

### 3.2 — If you bought through Vercel

```bash
cd /Users/md/Refleckt
vercel domains add thereflectionapp.com
vercel alias set the-reflection-app-xxxx.vercel.app thereflectionapp.com
```

(Replace `the-reflection-app-xxxx.vercel.app` with the deploy URL from Phase 2.3.)

Done. The site is live at https://thereflectionapp.com within 1–2 minutes.

### 3.3 — If you bought elsewhere

Add the domain to Vercel:

```bash
cd /Users/md/Refleckt
vercel domains add thereflectionapp.com
```

It prints DNS records. Log into your registrar (Namecheap, Cloudflare, etc.)
and add them as instructed. Typically:

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

DNS propagates in 5–60 minutes. Vercel auto-provisions an SSL cert. Verify:

```bash
vercel inspect thereflectionapp.com
```

### 3.4 — Update the metadata URL in code

```bash
cd /Users/md/Refleckt
# Open src/app/layout.tsx and confirm metadataBase is set to:
#   new URL("https://thereflectionapp.com")
# It already is, but worth a glance.
```

---

## Phase 4 — Real AI (recommended)

Without this, the app uses heuristic fallbacks (still works, but the AI nudges
are pre-canned). This phase gives you actual Claude prompts/feedback/analysis
plus Whisper transcription.

### 4.1 — Get a Vercel AI Gateway API key

1. Go to https://vercel.com/dashboard/ai-gateway
2. Click **Create API Key** (name it `the-reflection-app-prod`)
3. Copy the key — it starts with `vgw_…`

### 4.2 — Add it to Vercel

```bash
cd /Users/md/Refleckt
vercel env add AI_GATEWAY_API_KEY production
# Paste the vgw_… key when prompted
vercel env add AI_GATEWAY_API_KEY preview
# Paste it again (preview deployments need it too)
```

### 4.3 — Redeploy so the env var takes effect

```bash
vercel --prod
```

Now `/api/ai/prompts`, `/api/ai/analyze`, `/api/ai/group-summary`,
`/api/ai/transcribe`, `/api/ai/coach`, and `/api/ai/lesson-tools` all hit real
Claude / Whisper. The `source` field in the response goes from `"mock"` to
`"ai"`.

### 4.4 — (Optional) Test it locally with the same key

```bash
cd /Users/md/Refleckt
echo "AI_GATEWAY_API_KEY=vgw_…" > .env.local      # paste your key here
npm run dev
```

`.env.local` is git-ignored — never commit it.

---

## Phase 5 — Real persistence with Supabase (optional)

Today the app stores data in your browser. If you want data to survive across
devices and lay groundwork for real auth, do this.

### 5.1 — Create a Supabase project

1. Go to https://supabase.com/dashboard
2. **New project** → name it `the-reflection-app`, pick a region close to your
   users, set a strong DB password (save it somewhere)
3. Wait ~2 minutes for it to provision

### 5.2 — Run the schema

1. In your Supabase project, open **SQL Editor**
2. Open `/Users/md/Refleckt/supabase/schema.sql` locally and copy-paste the
   whole file in
3. Click **Run**. You should see "Success. No rows returned."

### 5.3 — Get your project URL + anon key

In Supabase: **Settings → API**. Copy:
- **Project URL** (looks like `https://abcdefg.supabase.co`)
- **anon / public key** (long `eyJ…` string)

### 5.4 — Install the SDKs and add env vars

```bash
cd /Users/md/Refleckt
npm i @supabase/ssr @supabase/supabase-js

vercel env add NEXT_PUBLIC_SUPABASE_URL production
# paste the project URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# paste the anon key
# repeat both for "preview"
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
```

### 5.5 — Flip the storage layer

The Supabase wrappers are already written at `src/lib/supabase/queries.ts`.
They mirror `store.xxx()` exactly. To switch over, edit `src/lib/storage.ts`:
inside each mutation, check `isSupabaseConfigured()` and delegate to the
Supabase wrapper when true. (See `docs/supabase-setup.md` for a copy-paste
example.)

### 5.6 — Commit and push

```bash
cd /Users/md/Refleckt
git add -A
git commit -m "Wire Supabase persistence"
git push
```

Vercel auto-deploys. Done.

---

## Phase 6 — Email alerts via Resend (optional)

Severe content alerts (suicide / self-harm mentions) email the educator. Without
this, alerts only show on the dashboard.

### 6.1 — Sign up + add domain

1. https://resend.com → sign up
2. **Domains → Add domain** → `thereflectionapp.com`
3. Resend gives you DNS records (TXT + DKIM). Add them to your registrar (or to
   Vercel DNS if you bought the domain through Vercel)
4. Wait for verification (5–30 min)

### 6.2 — Get an API key

Resend dashboard → **API Keys → Create API Key** → name it
`the-reflection-app-prod` → copy it.

### 6.3 — Add env vars

```bash
cd /Users/md/Refleckt
vercel env add RESEND_API_KEY production
# paste the re_… key
vercel env add ALERTS_FROM_EMAIL production
# enter: alerts@thereflectionapp.com
# repeat both for preview
```

### 6.4 — Wire alerts in the analyze route

Open `src/app/api/ai/analyze/route.ts`. After the `mergeAlerts(...)` call, add:

```ts
// Fire emails for severe alerts
const severe = analysis.contentAlerts.filter((a) => a.severity === "high");
if (severe.length > 0) {
  fetch(`${req.headers.get("origin")}/api/alerts/safety`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      educatorEmail: "you@yourdomain.com",  // pull from group/owner record
      severity: "high",
      excerpt: severe[0].excerpt,
      studentName: input.responses[0]?.text?.slice(0, 60) ?? "Anonymous",
      activityTitle: input.objective,
    }),
  }).catch((e) => console.error("[alerts]", e));
}
```

When you wire Supabase auth (Phase 5 follow-up), pull `educatorEmail` from the
group's owner row instead of hardcoding it.

### 6.5 — Commit and push

```bash
git add -A && git commit -m "Wire Resend safety alerts" && git push
```

---

## Daily workflow after launch

```bash
# make changes locally
npm run dev                # test at http://localhost:3000

# when happy:
git add -A
git commit -m "what changed"
git push                   # auto-deploys to production

# preview a change without shipping:
git checkout -b try-X
# make changes
git push -u origin try-X
gh pr create               # Vercel comments a preview URL on the PR
```

---

## Verification checklist

After each phase, run these to make sure nothing broke:

```bash
cd /Users/md/Refleckt
npx tsc --noEmit           # types pass
npm run build              # production build passes
npm run dev                # local dev server boots
```

In production, check:

- [ ] Visit `https://thereflectionapp.com` — landing page renders
- [ ] `/app/library` — all 12 templates show
- [ ] `/app/personal` → record a 15-second reflection → analysis renders
- [ ] `/app/groups/new` → create a group → assign a template → copy the
      `/r/[shareCode]` link → open in incognito → submit a reflection → confirm
      it shows in the educator dashboard
- [ ] `/app/live` — mic prompt shows, transcript captures, suggestions appear
- [ ] `/app/workshops/new` → create a workshop → join from a phone via the
      `/w/[joinCode]` URL → drop a sticky note → confirm cross-tab sync

---

## Troubleshooting

**Vercel build fails with "Cannot find module @supabase/ssr"**
You added Supabase env vars without `npm install`. Run `npm i @supabase/ssr
@supabase/supabase-js`, commit `package.json` + `package-lock.json`, push.

**Microphone doesn't work in production**
Browsers require HTTPS for getUserMedia. Vercel gives you HTTPS automatically,
so this only happens on `http://localhost`. If you're testing locally, use
Chrome (it allows mic on `http://localhost`).

**AI calls return `source: "mock"` even after Phase 4**
You added the env var but didn't redeploy. Run `vercel --prod` again. Env vars
only attach at build/deploy time.

**Spec docs accidentally committed to GitHub**
```bash
git rm --cached "Untitled document (6).md" mirror-talk-remix-spec.md
git commit -m "Remove internal spec scratch from public repo"
git push
```

**DNS still not pointing after 2 hours**
Use https://dnschecker.org to confirm propagation. If your registrar shows the
records but `dig thereflectionapp.com` returns nothing, add `vercel-dns.com`
nameservers to your registrar (instructions: `vercel domains inspect
thereflectionapp.com`).

**I want to roll back a bad deploy**
```bash
vercel ls                  # find a previous deployment URL
vercel alias set <previous-url> thereflectionapp.com
```

Or in the Vercel dashboard: **Deployments → ⋯ → Promote to Production**.

---

## What's next

Once it's live, see [`docs/roadmap.md`](docs/roadmap.md) for the rest of the
work — auth, audio uploads, accessibility audit, native mobile, more languages,
pricing.
