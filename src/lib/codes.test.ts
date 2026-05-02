import { describe, expect, it } from "vitest";
import { generateJoinCode, isValidJoinCode } from "./codes";

describe("join codes", () => {
  it("generates speakable uppercase codes without ambiguous characters", () => {
    const code = generateJoinCode();

    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/);
    expect(code).not.toMatch(/[IO01]/);
  });

  it("validates normalized teacher-entered codes", () => {
    expect(isValidJoinCode(" ab-c23 ")).toBe(true);
    expect(isValidJoinCode("I0O1")).toBe(false);
  });
});
