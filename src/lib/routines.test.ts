import { describe, expect, it } from "vitest";
import { SEE_THINK_WONDER_ROUTINE, getRoutineStep } from "./routines";

describe("See Think Wonder routine", () => {
  it("ships the MVP routine with three ordered prompts", () => {
    expect(SEE_THINK_WONDER_ROUTINE.steps.map((step) => step.label)).toEqual([
      "See",
      "Think",
      "Wonder",
    ]);
    expect(SEE_THINK_WONDER_ROUTINE.config.voiceMinimumSeconds).toBe(15);
  });

  it("looks up routine steps by one-based step number", () => {
    expect(getRoutineStep(2).label).toBe("Think");
  });
});
