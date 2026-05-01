# Handoff — what's done, what's left for you

## ✅ Done (live right now)

### GitHub
- **Repo:** https://github.com/mrdavola/the-reflection-app
- **Visibility:** Public
- All code committed on `main` with co-authorship credit
- `.gitignore` updated so the internal spec scratch (`mirror-talk-remix-spec.md`, `Untitled document (6).md`) stays local

### Vercel
- **Production URL:** https://the-reflection-app.vercel.app  ← share this
- **Project:** `mds-projects-ebc8e5c5/the-reflection-app`
- **GitHub auto-deploy:** wired. Every push to `main` triggers a production build. Every PR gets a preview URL automatically.
- **Build:** 34 routes, all green
- **Smoke test:** `/`, `/app`, `/app/library`, `/app/personal`, `/app/groups/new`, `/app/live`, `/app/workshops`, `/app/growth`, `/privacy` — all return 200
- **AI routes:** working with the heuristic fallback (responses include `"source": "mock"`)

You can stop here and the app is publicly usable. The remaining steps make it production-grade and put it on `thereflectionapp.com`.

---

## 🟡 Things only you can do

These all need your accounts / payment / DNS — I can't do them for you.

### Step 1 — Buy `thereflectionapp.com` (5 min)

You confirmed it's available. Easiest path keeps everything inside Vercel:

```bash
cd /Users/md/Refleckt
vercel domains buy thereflectionapp.com
```

Vercel asks for billing info, charges you (~$15/year for `.com`), and auto-configures DNS.

Then point the domain at the deployment:

```bash
vercel domains add thereflectionapp.com
vercel alias set the-reflection-app.vercel.app thereflectionapp.com
```

Confirm:

```bash
vercel inspect thereflectionapp.com
```

If you'd rather buy from Namecheap / Cloudflare / Google Domains, see [PUBLISH.md § Phase 3.3](PUBLISH.md#33--if-you-bought-elsewhere) for the DNS records.

---

### Step 2 — Get a real AI key (5 min, recommended)

Without this, every AI route returns a heuristic mock response. With it, you get real Claude prompts/feedback/analysis and Whisper transcription.

1. Open https://vercel.com/dashboard/ai-gateway
2. Click **Create API Key** → name it `the-reflection-app-prod` → copy the `vgw_…` value
3. Add it to your project:

```bash
cd /Users/md/Refleckt
echo "<paste-the-vgw-key>" | vercel env add AI_GATEWAY_API_KEY production
echo "<paste-the-vgw-key>" | vercel env add AI_GATEWAY_API_KEY preview
vercel --prod   # redeploy so the env var attaches
```

Verify the AI route now returns `"source": "ai"`:

```bash
curl -sS -X POST -H "content-type: application/json" \
  -d '{"objective":"test","focus":"retrieval","count":2}' \
  https://the-reflection-app.vercel.app/api/ai/prompts | grep source
```

---

### Step 3 — Add Supabase persistence (15 min, optional)

Without this, all data is browser-local. With it, data survives across devices and is ready for real auth.

1. Create a Supabase project at https://supabase.com/dashboard (free tier is fine to start)
2. **SQL Editor** → paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**
3. **Settings → API** → copy the **Project URL** and **anon public key**
4. Install SDKs and add env vars:

```bash
cd /Users/md/Refleckt
npm i @supabase/ssr @supabase/supabase-js

vercel env add NEXT_PUBLIC_SUPABASE_URL production           # paste project URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production      # paste anon key
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview

git add package.json package-lock.json
git commit -m "Install Supabase SDKs"
git push                                                      # auto-deploys
```

5. Wire the storage layer to use Supabase when configured. See [`docs/supabase-setup.md`](docs/supabase-setup.md) for the copy-paste edit to `src/lib/storage.ts`.

---

### Step 4 — Email alerts via Resend (5 min, optional)

Sends an email to the educator when a student writes something the safety scanner flags as severe (suicide, self-harm, etc.). Without this, alerts only show on the dashboard.

1. Sign up at https://resend.com
2. **Domains → Add domain** → `thereflectionapp.com` → add the TXT/DKIM records to your registrar (or to Vercel DNS if you bought through Vercel)
3. Wait for verification (5–30 min)
4. **API Keys → Create API Key** → name it `the-reflection-app-prod` → copy the `re_…` value
5. Add to Vercel:

```bash
cd /Users/md/Refleckt
vercel env add RESEND_API_KEY production               # paste re_… key
vercel env add ALERTS_FROM_EMAIL production            # enter alerts@thereflectionapp.com
vercel env add RESEND_API_KEY preview
vercel env add ALERTS_FROM_EMAIL preview
```

6. Wire the alerts into the analyze route. See [PUBLISH.md § Phase 6.4](PUBLISH.md#64--wire-alerts-in-the-analyze-route) for the exact 10-line patch.

---

## 🔄 Daily workflow now

```bash
cd /Users/md/Refleckt

# make changes
npm run dev                           # http://localhost:3000

# ship them
git add -A
git commit -m "what changed"
git push                              # auto-deploys to production

# preview without shipping
git checkout -b try-something
git push -u origin try-something
gh pr create                          # Vercel comments a preview URL on the PR
```

---

## 🔗 Bookmarks

- Live site: https://the-reflection-app.vercel.app
- GitHub: https://github.com/mrdavola/the-reflection-app
- Vercel project dashboard: https://vercel.com/mds-projects-ebc8e5c5/the-reflection-app
- Vercel AI Gateway: https://vercel.com/dashboard/ai-gateway
- Full publish guide (deeper dive): [PUBLISH.md](PUBLISH.md)
- Roadmap (what's next after launch): [docs/roadmap.md](docs/roadmap.md)

---

## Quick verification — is it actually live?

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://the-reflection-app.vercel.app/
# expect: 200
```

Or just open the URL in your browser. The fastest way to feel the whole product:
**Library → "Project Checkpoint" → Use Template → record a 15-second answer.**
