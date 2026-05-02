export const SUBJECT_OPTIONS = [
  "General Education",
  "Math",
  "ELA",
  "Science",
  "Social Studies",
  "Art",
  "Music",
  "Physical Education",
  "SEL",
  "Other",
] as const;

export const GRADE_OPTIONS = [
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "Other",
] as const;

export function resolveTeacherOption(
  selected: string,
  customValue: string,
  fallback: string,
) {
  if (selected !== "Other") return selected;
  return customValue.trim() || fallback;
}
