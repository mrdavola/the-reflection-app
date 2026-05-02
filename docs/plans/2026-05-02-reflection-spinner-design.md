# Design: ReflectAI Deepening & Spinner Integration

## Overview
This document outlines the design to elevate ReflectAI from a generic tool to the ultimate classroom reflection platform. Based on the HTH Unboxed paper "Reflection: Transform Experience Into Meaning," we will integrate academic, social, and personal experiences into the application.

This will be accomplished through three major feature additions:
1. **The "Quick Spin" Routine:** Integrating an interactive reflection generator into the dashboard.
2. **Deepening the Live Dashboard (Peer Matches):** Upgrading the AI to actively facilitate social connections.
3. **Deepening the Student Experience (Thinking Snapshots):** Providing a visual timeline of student growth.

## 1. The "Quick Spin" Routine
A new third routine on the teacher dashboard that offers an engaging, zero-prep way to launch reflections.

**Flow:**
- Add a "Spin a Reflection" card to `src/app/teacher/page.tsx`.
- Create a new route (e.g., `src/app/teacher/spin/page.tsx`) containing the spinner UI provided in the HTML prototype.
- The UI will allow teachers to select a grade band and category (General, Academic, Social, Growth) and spin for a random prompt.
- Once a prompt is selected, a "Launch this Reflection" button will appear.
- Clicking "Launch" will hit the `POST /api/sessions` endpoint with a new routine type (e.g., `routineId: "quick-spin"`) and the spun question as the primary prompt.
- The teacher is then redirected to the Live Dashboard.

## 2. Deepening the Live Dashboard (Peer Matches)
The dashboard will do more than summarize; it will actively facilitate the "micro-social" experience.

**Implementation:**
- Update `src/lib/actionability.ts` (or the AI analysis prompts in `src/lib/ai/service.ts`) to detect connections between students.
- Introduce a new `kind: "peer-match"` to the Priority Cards array.
- When generating the Class Thinking Map or overall summary, the AI will identify students with complementary or contrasting quotes.
- The UI will render these "Peer Match" cards in the Priority Cards section with actionable advice (e.g., "Have Alex and Jordan discuss their differing views on...").

## 3. Deepening the Student Experience (Thinking Snapshots)
Instead of a generic "Done" screen, students will see a visual representation of their cognitive growth during the session.

**Implementation:**
- Modify the student completion screen (e.g., inside `src/app/student/session/[sessionId]/student-routine.tsx` or a new completion component).
- When `reflection.completedAt` is true, render a "Thinking Snapshot" timeline.
- The timeline will display:
  1. The student's initial thought (first step transcription/quote).
  2. The AI's follow-up question.
  3. The student's final, deepened thought.
- This creates a tangible artifact of personal growth for the student.
