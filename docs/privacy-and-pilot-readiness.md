# ReflectAI Privacy and Pilot Readiness

ReflectAI is designed for a small grades 3-5 production pilot where the teacher controls the activity and student identity is name-only.

## Data Collected in MVP

- Student display name entered for one classroom session.
- Audio recording when a student chooses voice response.
- Transcript, thinking-depth analysis, student feedback, and teacher-facing safety alerts.
- Session metadata: routine, learning target, stimulus, join code, completion counts, class thinking map, and class summary.

## Retention Defaults

- Audio is retained for 30 days for teacher review and transcription verification.
- Transcripts, analysis, class summaries, and teacher notes remain until the teacher or school requests deletion.
- `npm run retention:audio` deletes Firebase Storage objects under `reflection-audio/` when their `audioExpiresAt` metadata is older than the current time.

## Pilot Guardrails

- Student-facing feedback is always encouraging and neutral; safety alerts are teacher-facing only.
- Demo data must remain synthetic and must not be mixed with pilot student data.
- Real school pilots should use a reviewed privacy policy, terms, school data agreement, and family notice/consent language.
- COPPA and FERPA implementation choices should be reviewed by counsel before district-wide use.

## Teacher Onboarding Script

1. Launch a See Think Wonder session from `/teacher/new`.
2. Project the QR code or share the join link.
3. Students enter first name only.
4. Students speak or type each step.
5. Review the live dashboard for class patterns, priority cards, and next instructional moves.
6. Use safety alerts as review prompts, not automatic discipline decisions.
