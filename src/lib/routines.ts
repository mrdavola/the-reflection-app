import type { RoutineStep, SessionConfig } from "./types";

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  aiFollowupsEnabled: true,
  voiceMinimumSeconds: 5,
  responseMode: "choice",
  showTranscription: true,
  studentResultsVisibility: "full",
};

export const SEE_THINK_WONDER_ROUTINE = {
  id: "see-think-wonder",
  name: "See Think Wonder",
  description:
    "Students observe carefully, explain what they think, and name authentic questions.",
  bestForTags: ["observation", "curiosity", "stimulus"],
  config: DEFAULT_SESSION_CONFIG,
  steps: [
    {
      stepNumber: 1,
      label: "See",
      prompt: "What do you see?",
      studentCue: "Describe details you can point to. Try not to explain them yet.",
      followUpGuidance:
        "Probe for specificity, concrete details, and overlooked parts of the stimulus.",
    },
    {
      stepNumber: 2,
      label: "Think",
      prompt: "What do you think about that?",
      studentCue: "Explain what those details make you think and why.",
      followUpGuidance:
        "Push for reasoning, evidence, and a clear link between observation and interpretation.",
    },
    {
      stepNumber: 3,
      label: "Wonder",
      prompt: "What does it make you wonder?",
      studentCue: "Ask a question that could help you learn more.",
      followUpGuidance:
        "Celebrate curiosity and push toward investigable, meaningful questions.",
    },
  ] satisfies RoutineStep[],
};

export function getRoutineStep(stepNumber: number) {
  const step = SEE_THINK_WONDER_ROUTINE.steps.find(
    (item) => item.stepNumber === stepNumber,
  );

  if (!step) {
    throw new Error(`Unknown See Think Wonder step: ${stepNumber}`);
  }

  return step;
}
