import { describe, expect, it } from "vitest";
import { classifyTranscriptSafety } from "./safety";

describe("safety classification", () => {
  it("creates red alerts for personal safety language", () => {
    const alert = classifyTranscriptSafety("I do not feel safe at home today.");

    expect(alert?.severity).toBe("red");
    expect(alert?.category).toBe("personal_safety");
  });

  it("creates amber alerts for profanity without escalating to crisis", () => {
    const alert = classifyTranscriptSafety("This problem is damn confusing.");

    expect(alert?.severity).toBe("amber");
    expect(alert?.category).toBe("profanity");
  });

  it("does not flag benign academic content about historical violence", () => {
    const alert = classifyTranscriptSafety(
      "The article describes violence during the American Revolution.",
    );

    expect(alert).toBeNull();
  });
});
