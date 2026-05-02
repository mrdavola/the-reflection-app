# ReflectAI MVP Implementation Notes

## Current Runtime Modes

- Without credentials, the app runs locally using an in-memory pilot store and deterministic AI heuristics.
- With `OPENAI_API_KEY`, transcription, moderation, step analysis, reflection feedback, and summaries use OpenAI APIs.
- Firebase client/admin configuration is present for deployment wiring; the local pilot store keeps development friction low.

## Key Routes

- `/teacher` lists sessions and seeds demo data.
- `/teacher/new` launches a See Think Wonder session.
- `/teacher/session/[sessionId]/live` shows the live class dashboard.
- `/join/[joinCode]` lets students enter a first name and join.
- `/student/session/[sessionId]` runs the student reflection flow.
- `/student/reflection/[reflectionId]/snapshot` shows student feedback.

## Next Production Hardening Step

Replace the in-memory store in `src/lib/server/store.ts` with a Firestore-backed implementation of the same operations before deploying to multiple server instances.
