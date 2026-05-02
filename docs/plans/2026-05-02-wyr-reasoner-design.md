# Design: "Would You Rather" Classroom Reasoner

## Overview
Based on the provided specification, we are building a new "Would You Rather" (WYR) routine for ReflectAI. This feature acts as a quick-fire lesson starter where teachers generate AI-crafted WYR questions, and students vote and reflect on their reasoning.

## 1. Teacher Setup & AI Generation
- **Entry:** A new "Would You Rather" launch card on the Teacher Dashboard.
- **Form:** `src/app/teacher/wyr/new/page.tsx`. Collects Grade Level, Subject, and Topic.
- **AI Generation:** A new API endpoint (`/api/wyr/generate`) calls Gemini with the provided system prompt. It returns 3 options strictly formatted as JSON (Silly, Balanced, Analytical).
- **Selection:** The teacher views the 3 generated options. Clicking "Present to Class" on an option creates a ReflectAI session with `routineId: "would-you-rather"`.

## 2. The Student Experience
- **Entry:** The student scans the join code and lands on the routine.
- **Step 1 (Voting):** The UI presents a massive split-screen showing Option A and Option B. The student taps their choice.
- **Step 2 (Reasoning):** The student is prompted to explain their choice ("You chose [Option A]. Explain your reasoning."). They use the standard ReflectAI voice/text recorder to submit their thought.

## 3. The Live Dashboard
- **Scoreboard:** The top of the live dashboard (`src/app/teacher/session/[sessionId]/live/live-dashboard.tsx`) is modified for WYR sessions. It displays a real-time, full-width split-screen scoreboard showing the vote count/percentage for Option A vs. Option B.
- **Thinking Map:** Below the scoreboard, the standard AI clustering summarizes the students' explanations, allowing the teacher to see the "why" behind the votes.

## 4. Data Models & API
- **Models:** Add `"would-you-rather"` to the `routineId` enum.
- **Session state:** We need to store `optionA` and `optionB` in the `Session` object (likely inside `config` or as new optional fields).
- **Reflection state:** We need to capture the student's vote (A or B) in their reflection. We will store this as the first `step` of their reflection.
