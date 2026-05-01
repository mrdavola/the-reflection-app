# Deep Ocean Redesign — Design Doc

**Date:** 2026-05-01
**Status:** Approved, ready for implementation plan
**Branch:** `redesign-deep-ocean`

---

## Summary

Refleckt is being redesigned from the current "Marginalia" direction (warm ivory paper, ink-on-paper, light theme only) to a **two-surface dark aesthetic**:

- **Student surface** — calm, immersive, minimalistic. Deep navy with audio-reactive water ripples and a glowing center dot. Built around the moment of reflection.
- **Teacher surface** — powerful, dense, scannable. Same deep navy, no ambient ripples. Optimized for the 90 seconds before the bell.

Both surfaces share one design language but two different rhythms. The student gets a *room*. The teacher gets a *cockpit*.

The redesign keeps all 34 routes, all existing functionality, all backend infrastructure (Firebase, AI Gateway, Gemini routes). What changes is exclusively the visual layer plus six new behaviors ported from the reference component (ripples, glowing dot, live transcript, recharge interlude, auto-silence, optional voice TTS).

---

## Decisions locked in

| Decision | Value |
|---|---|
| Surface split | Two — student (calm) + teacher (powerful), both dark |
| Dashboard structure | Layered tabs: Triage (hero) + Insights + Live |
| Reflection behaviors adopted | Ripples, glowing dot, live transcript, recharge, auto-silence, AI follow-ups (personal mode) |
| Voice TTS | Off by default. Toggle in personal mode only. Never in classroom. |
| Visual identity | Deep Ocean ambient + Refleckt typographic DNA (serif Petrona display + marginalia italic + uppercase margin-notes) |
| Theme | Dark only — `next-themes` removed |
| Scope | All 34 routes redesigned in place |
| Rollout | Single branch `redesign-deep-ocean` → preview → review → merge once |
| Build approach | Hybrid: tokens-first single thread, then parallel subagent fan-out per surface family |

---

## Section 1 — Color tokens

All tokens defined in `src/app/globals.css` via `@theme inline`.

```css
/* SURFACES (deep, layered — three shades for hierarchy) */
--color-background    oklch(0.12 0.020 252);   /* deep ink, almost black with a hair of blue */
--color-surface       oklch(0.16 0.022 250);   /* card base, one step up */
--color-card          oklch(0.19 0.024 248);   /* elevated card / hovered surface */
--color-popover       oklch(0.22 0.026 248);   /* modals, dropdowns */

/* INK (warm cream, never pure white) */
--color-foreground         oklch(0.96 0.012 78);   /* body text, warm ivory */
--color-muted-foreground   oklch(0.68 0.020 240);  /* secondary, soft sky-grey */
--color-faint              oklch(0.45 0.024 245);  /* tertiary labels, captions */

/* ACCENT (sky — the glow color) */
--color-primary               oklch(0.78 0.105 230);   /* sky-300 equivalent, the glow */
--color-primary-foreground    oklch(0.12 0.020 252);
--color-ring                  oklch(0.78 0.105 230 / 0.35);

/* EDGES (very low contrast) */
--color-border    oklch(0.30 0.024 248);
--color-input     oklch(0.22 0.026 248);

/* TRIAGE (retuned for dark — same semantic meaning, glow on deep navy) */
--color-triage-sunny     oklch(0.82 0.130 88);             /* warm amber, "doing well" */
--color-triage-sunny-bg  oklch(0.30 0.060 88 / 0.20);
--color-triage-orange    oklch(0.74 0.150 45);             /* sunset coral, "check in" */
--color-triage-orange-bg oklch(0.30 0.080 45 / 0.20);
--color-triage-blue      oklch(0.75 0.110 235);            /* softer sky, "low signal" */
--color-triage-blue-bg   oklch(0.30 0.060 235 / 0.20);
--color-triage-rose      oklch(0.70 0.180 18);             /* alert-only, severe content */
--color-triage-rose-bg   oklch(0.32 0.090 18 / 0.25);

/* MARGINALIA (warmed for dark) */
--color-accent             oklch(0.74 0.110 25);
--color-accent-foreground  oklch(0.12 0.020 252);
```

**Rationale:**
- Three deep navies (12 / 16 / 19 lightness) give real surface hierarchy without going gray.
- Body text at L=0.96 with slight warm chroma preserves the "writing on paper at night" feel.
- Triage colors stay at their original hues but lift in lightness so they read as glowing signals.
- Border at L=0.30 is barely visible — paper folds, not boxes.
- WCAG AA contrast verified for all text-on-surface combinations (foreground L=0.96 on background L=0.12 = 17.5:1).

---

## Section 2 — Typography

Fonts unchanged from current Marginalia direction:
- `--font-display` Petrona (serif, weight axis only — no `opsz`)
- `--font-sans` Atkinson Hyperlegible
- `--font-mono` SF Mono

### Type scale

| Style | Font | Size | Tracking | Leading |
|---|---|---|---|---|
| H1 hero | Petrona Medium | 56–76px | -0.02em | 1.02 |
| H2 section | Petrona Medium | 32–48px | -0.018em | 1.05 |
| H3 card | Petrona Medium | 20–26px | -0.016em | 1.18 |
| Quote / pull | Petrona Italic | 18–22px | -0.005em | 1.45 |
| Body | Atkinson 400 | 15–17px | -0.005em | 1.55 |
| Label / margin | Atkinson 500 | 10–12px | 0.18–0.30em UPPERCASE | — |
| Mono | SF Mono 400 | 11–13px | tabular-nums | — |

### The four typographic signatures (preserved verbatim, retuned for dark)

1. **`.marginalia`** — italic emphasis, retains the teacher's-underline gradient. Underline color shifts from carmine (light) to sky accent (dark).
2. **`.marginalia--ink`** — alt underline using primary (sky) color.
3. **`.margin-note`** — uppercase tracking-widest tiny label, italic Petrona. Color: `--color-faint` so it whispers.
4. **`.rule-soft`** — soft horizontal pencil-stroke divider; on dark this is `transparent → border (L=0.30) → transparent`.

### Voice rules

- Big serif (Petrona) for everything that matters: titles, prompts, the user's quote, the AI's core insight.
- Italic Petrona specifically for the user's words and the inspirational quote.
- Uppercase tracking-widest sans for everything micro: step labels, status badges, tabular labels.
- Mono for timers, share codes, tabular numbers.

---

## Section 3 — Signature ambient components

Four new components. All live in `src/components/ambient/`. All honor `prefers-reduced-motion: reduce`.

### `<RippleField>`

Three concentric water rings expanding from a center point, staggered 4 seconds apart, fading from `border-sky/50` to nothing over 12 seconds.

- Reuses existing `@keyframes calm-ocean-ripple` from the reference component.
- Pure CSS animation, no JS per frame.
- Props: `intensity` (0–1, scales opacity by audio level), `centered` (bool), `paused` (bool).

### `<GlowingDot>`

A 4px sky-blue dot. Three dynamic properties driven by `audioLevel` (0–100):
- Scale: `1 + audioLevel/30`
- Glow: `box-shadow: 0 0 ${15 + level}px ${level/4}px sky-300/(0.3 + level/100)`
- Color shift: below 20 → sky-200; above 20 → pure white.

Props: `audioLevel` (number), `mode` ("reactive" | "steady" | "breathing").

### `<BreathingCircle>`

A single sky-tinted ring scaling 0.5 → 1.5 over 5 seconds with `<Wind>` icon at center. Used in the recharge interlude.

Props: `duration` (seconds), `label` ("Breathe in…" / "Settle…").

### `<AudioVisualizer>` (existing, refit)

Existing `audio-recorder.tsx` already has Web Audio API + analyser wired. We refit so the bars become the ripple-field intensity input.

### Composition: the recording stage

```tsx
<div className="recording-stage absolute inset-0">
  <RippleField intensity={audioLevel/100} />
  <PromptOverlay text={prompt} />              {/* top, faint serif italic */}
  <GlowingDot audioLevel={audioLevel} />       {/* dead center */}
  <LiveTranscript text={currentTranscript} />  {/* bottom, serif italic */}
  <SilenceCountdown value={silenceCountdown} />
  <RecordingControls minimumReached={time >= 5} onStop={handleStop} />
</div>
```

Rule: everything inside `recording-stage` is `pointer-events: none` except the explicit Stop button.

### Dashboard ambient (different rhythm)

The teacher dashboard does NOT get full ripples. Instead:
- Header has a single `<GlowingDot mode="steady" />` next to the page title.
- Cards get a 1px sky-glow on hover only.
- One `<RippleField intensity={0.05}>` in the corner of the hero summary card — subtle ambient signal without distraction.

---

## Section 4 — Student reflection flow

Two entry points share one component:
- `/app/personal/run` — logged-in personal reflection, AI follow-ups enabled
- `/r/[shareCode]/run` — share-link no-login reflection, curated prompts only

### Six screens

1. **Setup** — Focus + objective picker. Three focus cards on dark surface, sky-glow on hover. Reuses `<FocusSelector>` + `<SentenceStarters>` logic.
2. **Prompt** — The question, before recording. Big serif. Mic button below. Latency mask shows TTS state if voice is on.
3. **Recording** — Full-bleed deep ocean stage. Prompt overlay top (faint), glowing dot center, ripples behind, live transcript bottom, timer + silence countdown, locked-until-5s stop button.
4. **Analyzing** — 3-second minimum hold. Sparkle spinner. "Forming next question" or "Finding clarity" label.
5. **Recharge** — 5-second breathing interlude. Plays once per session, between final recording and insights. `<BreathingCircle>` with cycling label.
6. **Insights** — The Master Educator Layout. User quote (italic) → Core insight (Petrona Medium 38–50px) → Next ripple → Inspirational quote. Bottom actions: "Read transcript" + "Reflect again."

### Recording-screen behaviors (ported from reference component)

- Web Audio API → `analyser.getByteFrequencyData` → smoothed level → drives ripple intensity + dot scale + glow.
- Web Speech Recognition (`continuous: true`, `interimResults: true`) → `currentTranscript` ref → live subtitle + silence reset.
- Auto-restart speech recognition `onend` handler (browsers kill it after long pauses; restart with 50ms delay).
- Silence detection: 250ms tick, if `silentMs > 5000 && transcript.length > 0 && time >= 5` → auto-stop. Countdown UI shows at 2/3/4 seconds of silence.
- Stop button disabled until `time >= 5`.

### Wires into existing infrastructure

- `/api/ai/analyze` returns `{user_quote, core_insight, next_ripple, inspirational_quote}` — schema already exists.
- Reflections save via `personal-flow-store.ts`.
- "Read transcript" → existing `/app/reflections/[id]` (also redesigned).
- "Reflect again" → resets to Screen 1.

---

## Section 5 — Teacher dashboard

`/app` — teacher's home. Three layered tabs. Triage loads first.

### Layout shell

```
┌──────────────────────────────────────────────────────────────────────┐
│  ◌  REFLECT      Period 4 · Mr Davola ▾    21 students   [⚙]  [↗]   │
├──────────────────────────────────────────────────────────────────────┤
│  Most students named a specific moment.                              │  ← AI class summary
│  Two need a check-in.                                                │     (Petrona Medium)
│  One sentence on what to do tomorrow.                                │  ← teacher move
│                                                                       │
│  ┌─ TRIAGE ───┬─ INSIGHTS ─┬─ LIVE · 0 active ─┐                     │
│  └────────────┴─────────────┴────────────────────┘                    │
│  [tab content]                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Triage tab (hero)

Default view. 21 students as a vertical list, default-sorted by "Needs attention" (orange + rose float to top).

Each row contains:
- Status dot (sunny / orange / blue / rose)
- Name (mono tabular for alignment)
- Level (1–4)
- One verbatim student quote (serif italic)
- One AI-generated teacher-move sentence
- Hover affordances: `[Open]` + `[Mark seen]`

Rose-bg rows are pinned to top regardless of sort (safety alerts).

View toggle: Cards (default) / Compact (3× density) / Heatmap (21-cell grid).

### Insights tab

For weekly/monthly review:
- Class average level chart (existing `<GrowthChart>` re-skinned)
- Recurring themes block (new — extends `/api/ai/group-summary` with `themes` key)
- Focus area heatmap (students × days, colored by triage)

### Live tab

Active when an activity is running (`groups[id].activeActivityId` set). Tab badge becomes `LIVE · {n} active` in sky-300.

Real-time list of student status (Recording / Done / Stuck / Alert) via Firestore `onSnapshot`. Streaming transcript samples at bottom (very faint serif italic, scrolling).

`/app/live` redirects to `/app?tab=live`.

### Preserved from current dashboard

- `<TriageCard>` (refit dark, retuned colors)
- `<GroupSummaryCard>` (extended with AI summary at top)
- `<GrowthChart>`, `<TrendSparkline>` (reskinned)
- `<StreakCard>` (moved into Insights tab)
- Print styles unchanged

### New

- Tab structure
- Live tab itself
- Recurring themes block
- View toggle on Triage
- Default-sort-by-attention

---

## Section 6 — Internal pages + marketing home

### Marketing home (`/`)

Layout shape unchanged. Hero / How it feels / Educators / Closing / Footer. Surface flips to deep navy. Sample stack and dashboard sample reskinned dark. Faint `<RippleField intensity={0.04}>` in upper right.

### `/app/library`

Grid of template cards on dark. Each: title (Petrona 20px), description, focus tag, "Use template" ghost CTA. Hover → 1px sky-glow border.

### `/app/workshops` and `/app/workshops/[id]`

List view: same card pattern. Detail view: serif H1, session list as numbered ledger. Add-session button → ghost CTA.

### `/app/groups/*`

- **Group list:** Cards with mini 3-dot triage strip per group.
- **Group detail:** Sub-tabs Activities / Participants / Settings. Cards / Compact / Heatmap toggle on Activities + Participants.
- **Participant detail:** Full-bleed serif name H1. Streak card, growth chart, reflection timeline, voice-quote sidebar (serif italic).
- **Activity setup/share:** Setup is a configuration form. Share is a moment — deep navy, big serif join code, QR in sky-300, instructions.

### `/app/growth`

Hero is `<GrowthChart>` (dark + retuned triage). Trend sparklines per focus area. Insights cards from `/api/ai/coach`. No structural change.

### `/app/live`

Folded into dashboard Live tab. Route becomes redirect.

### `/app/settings`

Three sections:
- **Voice persona** — four Gemini voice cards (Aoede / Puck / Charon / Kore) with preview play. Master "Read prompts aloud" toggle, off by default.
- **Privacy & data** — Firestore export, delete account, no-login default for under-14.
- **About** — version, privacy link, contact.

### `/app/reflections/[id]`

Vertical document layout. Title from focus. Q/A blocks per question (serif italic for user text). Insight block (same as Screen 6 of flow). Audio playback + download.

### `/r/[shareCode]`, `/r/[shareCode]/run`, `/r/[shareCode]/done`

- Intro screen — Screen 1 shape with "Joining: Period 4 · Mr Davola" label.
- Run — identical to personal reflection stage.
- Done — calm thank-you with "Reflect again later" CTA.

### `/w/[joinCode]/board`

Collaborative board, dark refit. Sticky notes use the four triage backgrounds at 0.20 opacity for surface so they read as glowing post-its.

### `/privacy`

Long-form static text. Petrona for headings, Atkinson body, `.rule-soft` dividers, `.prose-measure` for line length.

### Print styles

Stay light. Printing intentionally inverts to paper.

---

## What's preserved

- All API routes (`/api/ai/*`, `/api/alerts/*`)
- All data shapes (Firestore schema, `lib/types.ts`)
- Storage layer (`lib/storage.ts`, `lib/personal-flow-store.ts`, `lib/api-client.ts`)
- `lib/streaks.ts`, `lib/focus-catalog.ts`, `lib/grade-bands.ts`, `lib/templates.ts`
- All existing animation keyframes (retuned, not removed)
- Print styles
- Firebase + Vercel + AI Gateway wiring

## What gets cut

- `next-themes` and all light-theme code paths
- `/app/live` standalone page (folded into dashboard Live tab)
- Current marketing-home `<DashboardSample>` (replaced with dark Triage mini)
- `next.config.ts` theme-related config (if any)

## What gets added

- `src/components/ambient/ripple-field.tsx`
- `src/components/ambient/glowing-dot.tsx`
- `src/components/ambient/breathing-circle.tsx`
- `src/components/dashboard/triage-tab.tsx`
- `src/components/dashboard/insights-tab.tsx`
- `src/components/dashboard/live-tab.tsx`
- `src/components/dashboard/dashboard-shell.tsx`
- `src/components/reflection/reflection-stage.tsx` (replaces current personal flow)
- `src/components/reflection/recharge-screen.tsx`
- `src/components/reflection/insights-layout.tsx`
- `src/components/reflection/voice-persona-settings.tsx`
- `src/lib/use-audio-level.ts` (extracted from current audio-recorder)
- `src/lib/use-tts.ts` (Gemini TTS wrapper)
- `src/lib/use-speech-recognition.ts` (extended with auto-restart + silence detection)

---

## Build approach (Approach 3 — Hybrid)

### Phase 0 — Foundation (single thread)
1. Rewrite `src/app/globals.css` with dark Deep Ocean tokens.
2. Build `/app/_design-probe` page showing: serif H1 with marginalia italic, all 4 retuned triage chips, ripple animation, glowing dot, all CTA button variants. This is the visual contract every subagent works against.

### Phase 1 — Primitives (single thread)
Update shadcn UI primitives to use new tokens: Button, Card, Dialog, Tabs, Badge, Input, Switch, RadioGroup, Tooltip, Separator, Progress, DropdownMenu, Label.

### Phase 2 — Parallel subagent fan-out
Five subagents dispatched in one message, each owning one surface family:
- **Agent A:** Student reflection flow + new audio-recorder + recharge + insights + voice TTS
- **Agent B:** Marketing home + landing routes
- **Agent C:** Teacher dashboard (Triage / Insights / Live tabs)
- **Agent D:** Groups & workshops
- **Agent E:** Library, growth, settings, reflections detail, privacy

Each agent receives:
- The visual contract from Phase 0 (probe page screenshots + token reference)
- Their assigned routes
- Constraints: WCAG AA contrast, `prefers-reduced-motion` support, no light-theme conditionals
- Instructions to consume but not redefine tokens

### Phase 3 — Reconcile (single thread)
Visual diff sweep, fix inconsistencies, run `npm run build`, smoke-test all routes via Vercel preview.

### Phase 4 — Verification
- Hit every route on the preview URL, confirm 200s
- Walk the student flow end-to-end (personal mode + share-link mode)
- Walk the teacher flow (Triage → drill into student → back, Insights → review chart, Live → start activity → see live)
- Test reduced-motion via DevTools emulation
- Test on mobile viewport (375px) and desktop (1440px)

---

## Constraints and risks

### Performance
- `<RippleField>` and `<GlowingDot>` are CSS-driven; no per-frame JS. Web Audio API analyser runs at 60fps but writes to a single state ref, not React state.
- Voice TTS is opt-in. When active, prompt audio is generated on demand (one Gateway call per prompt). Audio is cached in browser memory only.

### Accessibility
- Dark theme contrast: foreground L=0.96 on background L=0.12 ≈ 17.5:1 (WCAG AAA).
- All four triage colors verified at AA contrast (4.5:1) on `--color-card` (L=0.19).
- `prefers-reduced-motion` collapses ripples to static, breathing to fade, transitions to 0.01ms.
- Mic button has explicit `aria-label`. Live transcript announces via `aria-live="polite"`.
- Speech recognition is progressive enhancement — works without it, degrades to typed input.

### Browser support
- Web Speech Recognition: Chrome, Edge, Safari (Tech Preview). Falls back to typed input on Firefox.
- Web Audio API: universal modern browser support.
- Gemini TTS: server-side via existing AI Gateway route.

### Data
- No schema changes. All redesigned views read from existing Firestore collections.
- Voice persona setting stored in `users/{uid}/settings.voicePersona` (new field, optional).

### Cost
- Voice TTS off by default protects against runaway Gateway spend in classroom mode.
- AI follow-ups limited to 2 per session (3 total prompts: 1 curated + 2 AI follow-ups).

---

## Acceptance criteria

The redesign is "done" when:

- [ ] All 34 routes render on the preview URL with no console errors
- [ ] `npm run build` succeeds with zero warnings
- [ ] Student reflection flow completes end-to-end: setup → prompt → record → analyze → recharge → insights → save
- [ ] Teacher dashboard loads with Triage as default tab; tabs switch without reload
- [ ] Live tab updates in real-time when an activity starts in another browser
- [ ] Voice TTS toggle works in settings; off-by-default verified
- [ ] WCAG AA contrast verified on all text-on-surface combos via automated check
- [ ] `prefers-reduced-motion` honored — confirmed via DevTools emulation
- [ ] Mobile (375px) and desktop (1440px) layouts both work
- [ ] No light-theme code paths remain (`next-themes` fully removed)
- [ ] Print styles still produce a paper layout when `window.print()` is called

---

## Out of scope

- New AI behavior beyond what's already in `/api/ai/*`
- New Firestore collections
- Mobile-app shell (PWA install prompt deferred)
- Additional voice TTS voices beyond the four already in the reference (Aoede, Puck, Charon, Kore)
- Real-time collaborative reflection (deferred — current `/w/[joinCode]/board` stays one-way)
- A/B testing infrastructure for the redesign

---

## Next step

Hand off to the `writing-plans` skill to break this into a step-by-step implementation plan with phase boundaries, subagent prompts, and verification steps.
