import type { AnnotationNote, RoutineStepLabel } from "./types";

export function getAnnotationCue(label: RoutineStepLabel) {
  if (label === "See") {
    return "What detail are you noticing here? Describe exactly what you see.";
  }

  if (label === "Think") {
    return "What do you think is going on here? What makes you say that?";
  }

  if (label === "Wonder") {
    return "What question does this part make you wonder?";
  }

  return "Add a sticky note about this part of the image.";
}

export function buildAnnotationTranscript(
  label: RoutineStepLabel,
  annotations: AnnotationNote[],
) {
  const notes = annotations
    .map((annotation) => annotation.text.trim())
    .filter(Boolean);

  const prefix =
    label === "See"
      ? "I see"
      : label === "Think"
        ? "I think"
        : label === "Wonder"
          ? "I wonder"
          : "I noticed";

  return `${prefix}: ${notes.join("; ")}`;
}

export function hasUsableAnnotations(annotations: AnnotationNote[]) {
  return annotations.some((annotation) => annotation.text.trim().length > 0);
}
