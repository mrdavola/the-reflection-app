import type { GradeBand } from "./types";

export const GRADE_BANDS: { id: GradeBand; label: string; range: string; description: string }[] = [
  { id: "k-2", label: "K–2", range: "Ages 5–8", description: "Simple oral reflection, sentence stems, no scores by default." },
  { id: "3-5", label: "3–5", range: "Ages 8–11", description: "Short answers with light scaffolding and gentle prompts." },
  { id: "6-8", label: "Middle School", range: "Ages 11–14", description: "Full reflection with mindset/tone analysis, optional scores." },
  { id: "9-12", label: "High School", range: "Ages 14–18", description: "Evidence-based reflection with full analysis enabled." },
  { id: "higher-ed", label: "Higher Education", range: "College", description: "Academic depth, rubric alignment, portfolio-ready." },
  { id: "adult", label: "Adult Learners", range: "Lifelong learning", description: "Workplace and life learning, full analysis." },
  { id: "professional", label: "Professional Learning", range: "PD / coaching", description: "Coaching cycles, teacher PD, leadership reflection." },
];

export function getGradeBand(id: GradeBand) {
  return GRADE_BANDS.find((g) => g.id === id) ?? GRADE_BANDS[3];
}
