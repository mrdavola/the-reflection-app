# The Reflection App — AI reflection coach for learners and educators

> Reflection is a skill. The Reflection App makes it tractable.

## What this is

- A short, structured reflection loop: pick a focus, answer 2–3 prompts by typing or recording, get back feedback, an understanding score, and one concrete next step.
- A teacher dashboard built for triage — color-coded student cards (sunny, orange, blue), a class-level summary, and recommended teacher moves so you can scan one screen instead of listening to 21 reflections.
- Privacy-first defaults: under-14 students never create accounts, no-login and anonymous modes are first-class, and all demo data lives in your browser's local storage.

## Quick start

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

To populate the app with realistic example data, sign in to `/app` and click **Load demo data** in the empty "Your groups" state.

## Environment

The Reflection App is built to work end-to-end without any environment variables. Without `AI_GATEWAY_API_KEY`, the app uses heuristic fallbacks for prompts, feedback, analysis, and group summaries — you still get a working triage dashboard, scores, and teacher moves.

To enable real LLM-powered feedback, set:

```bash
# .env.local
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
```

The key comes from [Vercel AI Gateway](https://vercel.com/docs/ai-gateway). Once it's set, the same routes route through the gateway instead of the local heuristics, no other code changes required.

## Routes overview

### Public

| Route | What it is |
| --- | --- |
| `/` | Marketing landing page |
| `/privacy` | Privacy summary, district vetting info, data deletion |
| `/r/[shareCode]` | Student-facing share link for an assigned activity |
| `/r/[shareCode]/run` | Walk a student through prompts (no login required) |
| `/r/[shareCode]/done` | Post-reflection feedback view |

### App (authenticated shell)

| Route | What it is |
| --- | --- |
| `/app` | Dashboard — your groups, recent reflections, quick stats |
| `/app/personal` | Start a personal reflection |
| `/app/personal/run` | Walk through a personal reflection |
| `/app/groups/new` | Create a group (class, cohort, or team) |
| `/app/groups/[id]` | Group dashboard with triage cards and class summary |
| `/app/library` | Activity template library |
| `/app/reflections/[id]` | Reflection detail with full analysis |
| `/app/settings` | Display name, theme, danger zone |

## Spec

- Detailed product spec: [`docs/spec-detailed.md`](docs/spec-detailed.md)
- Short summary: [`docs/spec-summary.md`](docs/spec-summary.md)

## Tech

- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind v4 with shadcn-style primitives
- **AI:** Vercel AI SDK v6 with optional AI Gateway
- **Animation:** Framer Motion
- **State:** Local-first via `useSyncExternalStore` over `localStorage`
- **Toasts:** sonner
- **Theme:** next-themes
