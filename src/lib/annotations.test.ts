import { describe, expect, it } from "vitest";
import { buildAnnotationTranscript, getAnnotationCue } from "./annotations";

describe("annotation helpers", () => {
  it("turns positioned sticky notes into a routine transcript", () => {
    const transcript = buildAnnotationTranscript("See", [
      { id: "a", x: 25, y: 40, text: "I notice puddles near the garden bed", mode: "text" },
      { id: "b", x: 62, y: 55, text: "There are tools leaning by the fence", mode: "voice" },
    ]);

    expect(transcript).toContain("I see");
    expect(transcript).toContain("puddles near the garden bed");
    expect(transcript).toContain("tools leaning by the fence");
  });

  it("uses Project Zero language for the current step cue", () => {
    expect(getAnnotationCue("Think")).toContain("What makes you say that");
    expect(getAnnotationCue("Wonder")).toContain("question");
  });
});
