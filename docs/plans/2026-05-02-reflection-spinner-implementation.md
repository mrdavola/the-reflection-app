# ReflectAI Deepening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the "Quick Spin" routine, "Peer Matches" on the live dashboard, and "Thinking Snapshots" for students.

**Architecture:** We will add a new `quick-spin` routine ID to our models. A new React component will implement the slot-machine UI to trigger the `/api/sessions` endpoint. The AI service will be updated to output `peer-match` priority cards. The student UI will map completed steps into a timeline snapshot.

**Tech Stack:** Next.js (React), Tailwind CSS, Lucide Icons, Vitest, Zod, Gemini API.

---

### Task 1: Add Quick Spin Routine Launch Card

**Files:**
- Modify: `src/app/teacher/page.tsx`
- Create: `src/app/teacher/page.test.tsx` (if needed)

**Step 1: Write the failing test**

```tsx
// tests/teacher-page.test.tsx
import { render, screen } from "@testing-library/react";
import TeacherPage from "@/app/teacher/page";
import { expect, test, vi } from "vitest";

vi.mock("@/lib/firebase/client", () => ({
  getFirebaseClientServices: () => ({ auth: {} })
}));

test("renders Spin a Reflection launch card", () => {
  render(<TeacherPage />);
  expect(screen.getByText(/Spin a Reflection/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**
Run: `npm run test`
Expected: FAIL (Cannot find "Spin a Reflection")

**Step 3: Write minimal implementation**
Modify `src/app/teacher/page.tsx` to add the LaunchCard for "Spin a Reflection".
```tsx
            <LaunchCard
              href="/teacher/spin/new"
              icon={<Sparkles size={26} />}
              title="Quick Spin"
              kicker="Randomized prompt"
              body="Project a spinner, select a category, and generate a random reflection question to launch."
              color="bg-[#04c6c5] text-black"
            />
```

**Step 4: Run test to verify it passes**
Run: `npm run test`
Expected: PASS

**Step 5: Commit**
```bash
git add src/app/teacher/page.tsx tests/teacher-page.test.tsx
git commit -m "feat: add quick spin launch card to teacher dashboard"
```

---

### Task 2: Create Quick Spin UI and API Hook

**Files:**
- Create: `src/app/teacher/spin/new/page.tsx`
- Modify: `src/app/api/sessions/route.ts` (if validation strict)

**Step 1: Create the Spin Page Component**
Implement the HTML spinner UI natively in React using Tailwind and standard React hooks for state. Upon spinning and selecting a question, the UI should show a "Launch Session" button.

**Step 2: Connect "Launch Session" to API**
```tsx
async function launchSession(question: string) {
  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      routineId: "quick-spin",
      title: "Quick Spin Reflection",
      learningTarget: "General reflection",
      exitTicketQuestion: question,
      config: { voiceMinimumSeconds: 5 },
    }),
  });
  const data = await response.json();
  if (data.session?.id) {
    router.push(`/teacher/session/${data.session.id}/live`);
  }
}
```

**Step 3: Test and Commit**
Manually verify the spinner works and creates a session.
```bash
git add src/app/teacher/spin/new/page.tsx
git commit -m "feat: implement Quick Spin UI and API integration"
```

---

### Task 3: Peer Matches on Live Dashboard

**Files:**
- Modify: `src/lib/actionability.ts`
- Modify: `src/lib/ai/service.ts` or where Priority Cards are defined.

**Step 1: Write the failing test**
Create a test in `tests/actionability.test.ts` to ensure `getPriorityCards` maps `kind: "peer-match"` properly if the session data contains one.

**Step 2: Update Data Models & Service**
Add `"peer-match"` to the acceptable kinds of priority cards in the AI summary schema. Ensure it maps properly to the UI (e.g., green or purple background).

```typescript
export const SafetyAlertsGeminiSchema = { ... } // or similar schema for PriorityCards
// Update the schema to allow "peer-match" and handle it in getPriorityCards
```

**Step 3: Update UI in `live-dashboard.tsx`**
Render `peer-match` cards nicely in `live-dashboard.tsx`.
```tsx
                            card.kind === "urgent"
                              ? "bg-[#fd4401] text-white"
                              : card.kind === "peer-match"
                                ? "bg-[#9b51e0] text-white"
```

**Step 4: Commit**
```bash
git add src/lib/actionability.ts src/app/teacher/session/[sessionId]/live/live-dashboard.tsx
git commit -m "feat: add peer match priority cards to live dashboard"
```

---

### Task 4: Thinking Snapshots for Students

**Files:**
- Modify: `src/app/student/session/[sessionId]/student-routine.tsx`

**Step 1: Write minimal implementation**
Find the "completion" state inside `student-routine.tsx` (usually `isComplete` or `completedAt`).
Add a visual timeline of `steps`.
```tsx
if (reflection.completedAt) {
  return (
    <div className="snapshot-timeline">
      <h2>Your Thinking Snapshot</h2>
      <div className="timeline-item">
        <p>Your first thought: {reflection.steps[0].transcription}</p>
      </div>
      <div className="timeline-item">
        <p>AI Follow-up: {reflection.steps[0].followUpQuestion}</p>
      </div>
      <div className="timeline-item">
        <p>Your final thought: {reflection.steps[reflection.steps.length - 1].transcription}</p>
      </div>
    </div>
  )
}
```

**Step 2: Polish with Tailwind**
Use Lucide icons (e.g., `MessageCircle`, `Sparkles`) and connecting borders to make it look like a timeline.

**Step 3: Commit**
```bash
git add src/app/student/session/[sessionId]/student-routine.tsx
git commit -m "feat: implement Thinking Snapshots for completed student reflections"
```
