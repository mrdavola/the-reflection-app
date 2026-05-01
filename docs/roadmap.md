# The Reflection App — Roadmap

This document records what is built, what's deferred, and what's still ahead.
Updated after the Phase 1 → Phase 3 build pass.

---

## ✅ Shipped (in this codebase, today)

### Foundations
- Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript
- shadcn-style component primitives (Button, Card, Input, Textarea, Select, Dialog, DropdownMenu, Switch, RadioGroup, Tabs, Progress, Separator, Badge, Label)
- Inter + Fraunces typography, custom triage palette (sunny / orange / blue / rose)
- Theme toggle (light / dark / system) via `next-themes`
- localStorage persistence with `BroadcastChannel` cross-tab sync
- AI SDK v6 wired through Vercel AI Gateway with `provider/model` strings
- Heuristic fallbacks: every AI route works without `AI_GATEWAY_API_KEY`

### Educator surfaces
- Group create / edit / settings / delete with grade-band, access type, language, recording mode, greeting toggle
- Activity setup builder: objective (text + audio), focus selector, prompt mode (all-AI / first-teacher-then-AI / all-teacher), prompt editor (add/remove/reorder), timing, minimum-speaking, language, recording mode, feedback/score visibility, modeling-mode toggle, **rubric builder**, pre-reflection workspace steps
- Activity Library — 12 templates with filters and group-picker
- Group dashboard with **activity filter dropdown**, color-coded triage cards, per-participant **trend sparklines**
- Class summary card (purple, two-paragraph + recommended teacher moves) regenerable per filter
- Individual reflection detail with full transcript, audio playback, **audio download**, copy/export, delete
- Per-participant **portfolio page** with aggregate stats and printable PDF view
- Manage participants, share invite link, copy share-code

### Learner / participant surfaces
- Personal reflection flow (objective → focus → AI prompts → recharge → analysis)
- Student share-link flow (`/r/[shareCode]`) with no-login / name-only / anonymous branches
- Greeting screen (toggleable per group, grade-band-keyed copy)
- 15-second minimum speaking enforcement
- AudioRecorder with auto-transcription via Whisper (Gateway)
- **Sentence starters** (grade-band-keyed, English + Spanish)
- **Modeling mode** (weak vs. strong reflection examples before recording)
- AnalysisCard with score, level, color, zone, mindset, tone, motivation, hidden lesson, possible bias, **cross-curricular connections**, **student quotes ("In their own words")**, rubric results, content alerts, suggested teacher follow-up
- Recharge step (breath / takeaway / stretch / one sentence) localized

### Personal growth
- Streaks (current, longest, last-7-days mini calendar)
- Growth chart (last 30 reflections, level over time)
- `/app/growth` dedicated dashboard

### M2 hardware ports
- **Live co-teacher sidebar** (`/app/live`) — browser SpeechRecognition + 30-second polling for AI coaching nudges
- **Lesson tools** — summarize / generate exit-ticket / translate-to-Spanish endpoints
- **Workshop mode** (`/app/workshops`) — facilitator console with join-code + status toggle
- **Collaborative board** (`/w/[joinCode]/board`) — Padlet-style sticky-note grid with cross-tab sync, 5 colors, facilitator moderation

### Infrastructure scaffolds (ready, not wired)
- **Supabase scaffold**: schema.sql, browser + server clients, query layer mirroring `store.xxx()`, ambient typings so it compiles before install
- **Email alerts**: Resend integration + `/api/alerts/safety` endpoint (logs to console without `RESEND_API_KEY`)
- **Spanish (i18n)**: `STRINGS` dictionary, `t()` helper, all student-facing strings localized; AI prompts/feedback/group-summary route in Spanish when `language` is set

### Privacy + safety
- Privacy / district-vetting page with whitelist domains + delete-data flow
- Content safety scanner (severe / moderate / profanity tiers) with "may need adult review" framing
- Under-14 no-account default; access-type radio respected throughout

### Verification
- `npx tsc --noEmit` clean
- `next build` produces 34 routes (12 static + 22 dynamic)
- Dev server smoke-tested across all major routes
- AI endpoints return well-formed responses (mock fallback verified, Spanish branch verified)

---

## 🚧 Phase 4 — future work

These items intentionally weren't built in this pass. Each is a real next step:

### Backend / production-readiness
- [ ] **Run Supabase migration**: `npm i @supabase/ssr @supabase/supabase-js`, run `supabase/schema.sql`, set env vars, flip `@/lib/storage` to delegate to `@/lib/supabase/queries` when env is present
- [ ] **Audio blob upload** to Supabase Storage so recordings survive refresh and multi-device
- [ ] **Wire safety alerts**: have `analyze/route.ts` POST to `/api/alerts/safety` when severity is `high`
- [ ] **Real auth**: Supabase Auth with Google + magic link; only educators sign in, students stay on share-link path
- [ ] **Co-manager invites**: settings flow that emails an invite link, joinee gets read+write to a shared group
- [ ] **Rate-limiting** on the AI routes (Upstash or in-memory)
- [ ] **Vercel deployment**: connect to GitHub, configure preview/production envs, custom domain `thereflectionapp.com`
- [ ] **CI**: GitHub Actions running `npm run build` + `npx tsc --noEmit` on PRs

### Quality / accuracy
- [ ] **Eval harness** — golden set of ~100 reflections with hand-labeled triage levels; CI runs analyze prompt changes against it; track score-color and rubric-level agreement
- [ ] **Live co-teacher cost cap** — meter `/api/ai/coach` usage per session; warn at 50 calls/hour
- [ ] **Transcription fallback** — when Whisper fails, fall back to browser `SpeechRecognition` accumulator
- [ ] **AnalysisCard visibility modes** — when `feedbackVisibility === "summary"`, render a reduced view (currently the activity flag is set but the analysis-card respects only the score/teacher props)

### Accessibility
- [ ] **WCAG 2.2 AA pass** — keyboard-only path through every screen, focus rings, `aria-live` for the recorder timer, semantic landmark roles, color-contrast audit on triage tokens
- [ ] **Screen-reader pass** on the recording flow specifically — `aria-label` on the record button, announce state changes
- [ ] **Reduced-motion** support — respect `prefers-reduced-motion` for framer-motion transitions

### Pedagogy / new product surfaces
- [ ] **Educator prompt bank** — save and reuse custom first-prompts across activities and groups
- [ ] **AI-generated discussion starters** from class analytics (small new endpoint)
- [ ] **Approaches-to-learning pre/post tracker** — same questions at quarter start + end, side-by-side comparison
- [ ] **Small-group reflection mode** — one device, multiple voices; AI synthesizes a combined reflection
- [ ] **Performance recording integration** — record 30s of a presentation, then immediately reflect on it
- [ ] **Parent view** — limited per-student dashboard with educator approval
- [ ] **Sentence-starter scaffolds** in the AudioRecorder itself (currently shown above; could become a slide-in tray)

### Integrations
- [ ] **Google Classroom** — auto-import rosters, post assignments, grade pass-back
- [ ] **Padlet / LMS export** — currently only copy-link; add direct post integrations
- [ ] **Native mobile** (Expo) — same routes, native MediaRecorder
- [ ] **Offline mode** for recording when wifi flakes; queue uploads on reconnect

### Languages beyond Spanish
- [ ] **French / Mandarin / Arabic / Haitian Creole / Italian / Korean / Portuguese / Japanese** — add to `STRINGS` dictionary, no other code change needed (the AI routes already pass `language` through)
- [ ] **Auto-detect language** of the learner's first response and offer to switch the rest of the flow

### Pricing + ops
- [ ] **Stripe** integration with free-tier analysis cap (e.g. 50 analyses/month free)
- [ ] **Org / district licensing** — multi-group billing, admin dashboard, SSO
- [ ] **Usage analytics** — cost per analysis, per group, per district
- [ ] **Sub-processor list** + DPA template for districts

### Research mode (long-tail)
- [ ] **Cohort-level mindset/tone trends** — anonymized aggregates teachers can opt into
- [ ] **Intervention efficacy** — measure whether teacher-move recommendations correlate with student-level improvements over time
- [ ] **Public research API** with rate limits and ToS

---

## Decisions still open (Phase 0 brainstorm carryovers)

- [ ] Buy `thereflectionapp.com` (user confirmed it's available)
- [ ] Whether students 14+ ever get accounts, or whether all student access is always share-link only
- [ ] Whether to make audio blob upload mandatory for districts (privacy implications) or opt-in
- [ ] Pricing model — freemium vs. district-only B2B vs. mixed

---

*Last updated: built-out completed end-to-end with Phases 1, 2, and 3. The codebase is feature-complete for an MVP launch with mocked AI; flipping the env vars unlocks production-grade Claude / Whisper / Resend integration.*
