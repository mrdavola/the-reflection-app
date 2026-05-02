import { describe, expect, it } from "vitest";
import { buildThinkingMap } from "./thinking-map";

describe("thinking map aggregation", () => {
  it("clusters responses by routine step using recurring keywords", () => {
    const map = buildThinkingMap([
      {
        studentId: "maya",
        steps: [
          { label: "See", transcription: "I see people standing in a line." },
          { label: "Think", transcription: "I think they are waiting." },
          { label: "Wonder", transcription: "I wonder where the line goes." },
        ],
      },
      {
        studentId: "jordan",
        steps: [
          { label: "See", transcription: "There are many people in a line." },
          { label: "Think", transcription: "They might be waiting for food." },
          { label: "Wonder", transcription: "Why are they waiting so long?" },
        ],
      },
    ]);

    expect(map.see[0].studentIds).toEqual(["maya", "jordan"]);
    expect(map.think[0].label.toLowerCase()).toContain("waiting");
  });

  it("ignores non See Think Wonder steps", () => {
    const map = buildThinkingMap([
      {
        studentId: "maya",
        steps: [
          {
            label: "Exit Ticket",
            transcription: "I understand the main idea because I can explain it.",
          },
        ],
      },
    ]);

    expect(map).toEqual({ see: [], think: [], wonder: [] });
  });
});
