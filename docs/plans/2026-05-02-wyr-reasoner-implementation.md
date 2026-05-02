# Would You Rather Classroom Reasoner Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the "Would You Rather" generative routine, including the AI setup, student voting flow, and live dashboard scoreboard.

**Architecture:** A new `/api/wyr/generate` endpoint will hit Gemini to generate 3 WYR options. The teacher selects one, launching a `would-you-rather` session with `wyrOptions` saved to the database. Students vote (saved as step 1) and explain (saved as step 2). The dashboard aggregates the votes into a scoreboard.

**Tech Stack:** Next.js (React), Tailwind CSS, Vercel AI SDK (`generateObject`), Zod.

---

### Task 1: Update Models and Session Validation

**Files:**
- Modify: `src/lib/models.ts`
- Modify: `src/app/api/sessions/route.ts`
- Modify: `src/lib/routines.ts`

**Step 1: Write the failing test**

```typescript
// tests/wyr-models.test.ts
import { expect, test } from "vitest";

test("requires wyrOptions when routineId is would-you-rather", async () => {
  const response = await fetch("http://localhost:3000/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ routineId: "would-you-rather" }),
  });
  expect(response.status).toBe(400); // Fails validation without options
});
```
*(Skip running test if mock setup is too complex, proceed to type additions)*

**Step 2: Update Types**
In `src/lib/models.ts`:
Add `"would-you-rather"` to `routineId`.
Add `wyrOptions?: { optionA: string; optionB: string };` to `Session`.

In `src/app/api/sessions/route.ts`:
Update `CreateSessionSchema`:
```typescript
  routineId: z.enum(["see-think-wonder", "exit-ticket-conversation", "quick-spin", "would-you-rather"]).optional(),
  wyrOptions: z.object({ optionA: z.string(), optionB: z.string() }).optional(),
```

**Step 3: Define the Routine**
In `src/lib/routines.ts`, add the new routine steps:
```typescript
export const WOULD_YOU_RATHER_ROUTINE = {
  id: "would-you-rather",
  steps: [
    { stepNumber: 1, label: "Choice", prompt: "Make your choice", studentCue: "", followUpGuidance: "" },
    { stepNumber: 2, label: "Reasoning", prompt: "Why did you choose that?", studentCue: "Explain your reasoning.", followUpGuidance: "Push for a specific example." }
  ]
};
```

**Step 4: Commit**
```bash
git add src/lib/models.ts src/app/api/sessions/route.ts src/lib/routines.ts
git commit -m "feat: add would-you-rather to models and session validation"
```

---

### Task 2: AI Generation API and Teacher Dashboard Card

**Files:**
- Modify: `src/app/teacher/page.tsx`
- Create: `src/app/api/wyr/generate/route.ts`

**Step 1: Create Generation API**
Create `src/app/api/wyr/generate/route.ts`. Use `generateObject` from `@ai-sdk/google` (already configured in `src/lib/ai/gemini.ts` probably) or use a raw fetch to the Gemini REST API to output JSON.
Schema:
```typescript
const WyrResponseSchema = z.object({
  questions: z.array(z.object({
    vibe: z.string(),
    optionA: z.string(),
    optionB: z.string()
  }))
});
```

**Step 2: Add Launch Card**
In `src/app/teacher/page.tsx`:
```tsx
<LaunchCard
  href="/teacher/wyr/new"
  icon={<Zap size={26} />}
  title="Would You Rather"
  kicker="AI Lesson Starter"
  body="Generate a quick, curriculum-aligned scenario to spark debate."
  color="bg-[#9b51e0] text-white"
/>
```

**Step 3: Commit**
```bash
git add src/app/teacher/page.tsx src/app/api/wyr/generate/route.ts
git commit -m "feat: add WYR launch card and generation API"
```

---

### Task 3: Teacher Setup & Selection UI

**Files:**
- Create: `src/app/teacher/wyr/new/page.tsx`

**Step 1: Build the Setup Component**
Implement the input form for Grade, Subject, and Topic.
On submit, call `/api/wyr/generate`.

**Step 2: Build the Selection View**
Once generated, display the 3 options. Add a "Present to Class" button.
OnClick: Call `POST /api/sessions` with `routineId: "would-you-rather"` and the selected `wyrOptions`. Redirect to Live Dashboard.

**Step 3: Commit**
```bash
git add src/app/teacher/wyr/new/page.tsx
git commit -m "feat: implement WYR generation and setup UI"
```

---

### Task 4: Student Voting Experience

**Files:**
- Modify: `src/app/student/session/[sessionId]/student-routine.tsx`

**Step 1: Handle WYR View**
Inside `StudentRoutine`, check if `studentSession.session.routineId === "would-you-rather"`.
If `stepIndex === 0`, show the split screen Vote UI (Option A vs Option B).
When the user clicks A or B, call `submitRoutineText("Option A: " + optionText)` and advance to step 2.

**Step 2: Handle Reasoning View**
For `stepIndex === 1`, render the normal voice/text recorder, changing the prompt to "You chose [Option A]. Explain your reasoning."

**Step 3: Commit**
```bash
git add src/app/student/session/[sessionId]/student-routine.tsx
git commit -m "feat: implement student voting UI for WYR routine"
```

---

### Task 5: Live Dashboard Scoreboard

**Files:**
- Modify: `src/app/teacher/session/[sessionId]/live/live-dashboard.tsx`

**Step 1: Calculate Votes**
Filter the `reflections` to find votes from Step 1.
Count votes for Option A and Option B. Calculate percentages.

**Step 2: Render Split-Screen Scoreboard**
If `session.routineId === "would-you-rather"`, replace the standard `Learning Target` header with a massive split-screen UI showing Option A (with % and count) on the left, and Option B (with % and count) on the right. Below this, render the standard Class Thinking Map.

**Step 3: Commit**
```bash
git add src/app/teacher/session/[sessionId]/live/live-dashboard.tsx
git commit -m "feat: implement WYR scoreboard on live dashboard"
```
