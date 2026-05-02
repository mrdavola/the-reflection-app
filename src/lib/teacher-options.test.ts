import { describe, expect, it } from "vitest";
import {
  GRADE_OPTIONS,
  SUBJECT_OPTIONS,
  resolveTeacherOption,
} from "./teacher-options";

describe("teacher setup options", () => {
  it("offers K-12 grade and subject choices with an Other option", () => {
    expect(GRADE_OPTIONS).toContain("Kindergarten");
    expect(GRADE_OPTIONS).toContain("Grade 1");
    expect(GRADE_OPTIONS).toContain("Grade 4");
    expect(GRADE_OPTIONS).toContain("Grade 12");
    expect(GRADE_OPTIONS.at(-1)).toBe("Other");
    expect(SUBJECT_OPTIONS).toContain("General Education");
    expect(SUBJECT_OPTIONS.at(-1)).toBe("Other");
  });

  it("uses typed text only when Other is selected", () => {
    expect(resolveTeacherOption("Math", "Science", "General Education")).toBe("Math");
    expect(resolveTeacherOption("Other", "  Environmental studies  ", "General Education")).toBe(
      "Environmental studies",
    );
    expect(resolveTeacherOption("Other", "   ", "General Education")).toBe(
      "General Education",
    );
  });
});
