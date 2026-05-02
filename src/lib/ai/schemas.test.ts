import { describe, expect, it } from "vitest";
import {
  ClassThinkingMapSchema,
  ExitTicketQuestionSchema,
  ExitTicketTurnAnalysisSchema,
  ReflectionAnalysisSchema,
  StepAnalysisSchema,
} from "./schemas";

describe("AI schemas", () => {
  it("accepts a structured step analysis payload", () => {
    const parsed = StepAnalysisSchema.parse({
      depthLevel: "developing",
      depthScore: 2,
      cognitiveMoves: ["noticed detail", "gave a reason"],
      specificEvidence: "The student connected the long line to waiting.",
      followUpQuestion: "What makes you think they are waiting?",
      tone: "engaged",
      safetyNotes: null,
    });

    expect(parsed.depthScore).toBe(2);
  });

  it("rejects depth scores outside the rubric", () => {
    expect(() =>
      ReflectionAnalysisSchema.parse({
        overallDepthScore: 5,
        strongestStep: "Wonder",
        strongestMove: "Asked a testable question.",
        nudge: "Add evidence next time.",
        keyQuotes: [],
        crossCurricularConnections: [],
        mindset: "growth",
        tone: "engaged",
      }),
    ).toThrow();
  });

  it("validates class thinking map clusters by routine step", () => {
    const map = ClassThinkingMapSchema.parse({
      see: [
        {
          label: "People in a line",
          summary: "Several students noticed a queue.",
          studentIds: ["student_1"],
          representativeQuotes: ["I see people standing in a line."],
        },
      ],
      think: [],
      wonder: [],
    });

    expect(map.see[0].label).toBe("People in a line");
  });

  it("validates an exit ticket question draft", () => {
    const draft = ExitTicketQuestionSchema.parse({
      question:
        "What is one idea from today's lesson about fractions that changed how you think, and what makes you say that?",
      rationale:
        "This asks students to name a shift and support it with evidence.",
    });

    expect(draft.question).toContain("what makes you say");
  });

  it("validates an exit ticket turn with a quote, rating, and follow-up", () => {
    const turn = ExitTicketTurnAnalysisSchema.parse({
      directQuote: "I think equivalent fractions are like different names.",
      rating: 3,
      ratingLabel: "deep",
      teacherSummary:
        "The student is making an analogy and beginning to explain equivalence.",
      followUpQuestion:
        "You said fractions can be different names. What example from class makes that clear?",
    });

    expect(turn.rating).toBe(3);
    expect(turn.followUpQuestion).toContain("You said");
  });
});
