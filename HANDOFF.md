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

Without this, every AI route returns a heuristic mock response. With it, you get real Gemini 2.5 prompts/feedback/analysis and Whisper transcription.

> The app is wired to **Gemini 2.5 Flash + Pro** through Vercel AI Gateway by default. If you'd rather use Claude, OpenAI, Llama, etc., just edit the model strings in [`src/lib/ai/models.ts`](src/lib/ai/models.ts) — same gateway key works for all of them.

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

### Step 3 — Add Firebase persistence (15 min, optional)

Without this, all data is browser-local. With it, data survives across devices and is ready for real auth.

1. Create a Firebase project at https://console.firebase.google.com (free Spark tier is fine to start)
2. Enable **Authentication** (Email/Password + Google), **Firestore Database** (production mode), and **Cloud Storage** (production mode)
3. **Project settings → General → Your apps → Web (`</>`)** → copy the `firebaseConfig` values
4. Install the SDK and push the six env vars to Vercel:

```bash
cd /Users/md/Refleckt
npm i firebase

# repeat for each var, paste the value from firebaseConfig when prompted
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
# then repeat the six commands with `preview` instead of `production`

git add package.json package-lock.json
git commit -m "Install Firebase SDK"
git push                                                      # auto-deploys
```

5. Deploy security rules (one-time):

```bash
npm i -g firebase-tools
firebase login
firebase use --add                                            # pick your project
firebase deploy --only firestore:rules,storage
```

6. Flip the storage layer to use Firebase when configured. See [`docs/firebase-setup.md`](docs/firebase-setup.md) for the copy-paste edit to `src/lib/storage.ts`.

---

### Step 4 — Email alerts (skip for now)

Severe content alerts (suicide / self-harm mentions) already surface in the educator dashboard with a rose-colored badge — that's the primary surface. Email is a "nice to have" notification on top.

The code path is wired but harmlessly dormant: without `RESEND_API_KEY` set, the alert helper just logs to the server console. Skip it. Revisit if dashboard alerts aren't enough.

When you're ready, see [PUBLISH.md § Phase 6](PUBLISH.md#phase-6--email-alerts-via-resend-optional) for the Resend setup, or wire any SMTP provider via Nodemailer instead.

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
