import OpenAI from "openai";
import type { ImagesResponse } from "openai/resources/images";
import { zodTextFormat } from "openai/helpers/zod";
import {
  ExitTicketQuestionGeminiSchema,
  ExitTicketTurnGeminiSchema,
  generateGeminiStructured,
  ReflectionAnalysisGeminiSchema,
  StepAnalysisGeminiSchema,
} from "./gemini";
import {
  ExitTicketQuestionSchema,
  ExitTicketTurnAnalysisSchema,
  ReflectionAnalysisSchema,
  StepAnalysisSchema,
  type ExitTicketQuestion,
  type ExitTicketTurnAnalysis,
  type ReflectionAnalysis,
  type StepAnalysis,
} from "./schemas";
import type { Reflection, Session } from "@/lib/models";
import { getRoutineStep } from "@/lib/routines";
import { classifyTranscriptSafety } from "@/lib/safety";
import type { RoutineStepLabel, SafetyAlert } from "@/lib/types";
import { hasGeminiEnv, hasOpenAIEnv } from "@/lib/server/env";

const ANALYSIS_MODEL = process.env.OPENAI_ANALYSIS_MODEL ?? "gpt-5.4-mini";
const TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIPTION_MODEL ?? "gpt-4o-transcribe";
const MODERATION_MODEL = process.env.OPENAI_MODERATION_MODEL ?? "omni-moderation-latest";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1.5";
const GEMINI_ANALYSIS_MODEL = process.env.GEMINI_ANALYSIS_MODEL ?? "gemini-flash-latest";

function getClient() {
  if (!hasOpenAIEnv()) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getGeminiApiKey() {
  if (!hasGeminiEnv()) return null;
  return process.env.GEMINI_API_KEY ?? null;
}

export async function transcribeAudio(file: File) {
  const client = getClient();

  if (!client) {
    return "I see important details, I think they connect to the lesson, and I wonder what evidence would help us learn more.";
  }

  const transcription = await client.audio.transcriptions.create({
    file,
    model: TRANSCRIPTION_MODEL,
  });

  return transcription.text;
}

export async function moderateTranscript(transcript: string) {
  const heuristic = classifyTranscriptSafety(transcript);
  const alerts: SafetyAlert[] = heuristic ? [heuristic] : [];
  const client = getClient();

  if (!client) return alerts;

  const result = await client.moderations.create({
    model: MODERATION_MODEL,
    input: transcript,
  });
  const flagged = result.results[0]?.flagged;

  if (flagged && !alerts.some((alert) => alert.severity === "red")) {
    alerts.push({
      severity: "red",
      category: "personal_safety",
      title: "OpenAI moderation flag",
      message: "Review the transcript and recording before taking action.",
    });
  }

  return alerts;
}

export async function analyzeStep(input: {
  session: Session;
  label: RoutineStepLabel;
  transcript: string;
}) {
  const step = getRoutineStep(labelToNumber(input.label));
  const geminiApiKey = getGeminiApiKey();

  if (geminiApiKey) {
    try {
      return await generateGeminiStructured({
        apiKey: geminiApiKey,
        model: GEMINI_ANALYSIS_MODEL,
        system:
          "You analyze grades 3-5 student reflection. Be warm, specific, rubric-aligned, and never shame the student.",
        prompt: [
          "Routine: See Think Wonder",
          `Step: ${step.label}`,
          `Step prompt: ${step.prompt}`,
          `Learning target: ${input.session.learningTarget || "Not provided"}`,
          `Student transcript: ${input.transcript}`,
          "Score thinking depth from 1 surface to 4 transfer. Generate at most one follow-up question that stays inside this routine step.",
          "Use an integer depthScore from 1 to 4.",
        ].join("\n"),
        schema: StepAnalysisGeminiSchema,
        parse: StepAnalysisSchema.parse,
      });
    } catch (error) {
      console.warn("Gemini step analysis failed, falling back.", error);
    }
  }

  const client = getClient();

  if (!client) {
    return heuristicStepAnalysis(input.transcript, input.label);
  }

  const response = await client.responses.parse({
    model: ANALYSIS_MODEL,
    input: [
      {
        role: "system",
        content:
          "You analyze grades 3-5 student reflection. Be warm, specific, rubric-aligned, and never shame the student.",
      },
      {
        role: "user",
        content: [
          `Routine: See Think Wonder`,
          `Step: ${step.label}`,
          `Step prompt: ${step.prompt}`,
          `Learning target: ${input.session.learningTarget || "Not provided"}`,
          `Student transcript: ${input.transcript}`,
          "Score thinking depth from 1 surface to 4 transfer. Generate at most one follow-up question that stays inside this routine step.",
        ].join("\n"),
      },
    ],
    text: {
      format: zodTextFormat(StepAnalysisSchema, "step_analysis"),
    },
  });

  return response.output_parsed ?? heuristicStepAnalysis(input.transcript, input.label);
}

export async function analyzeCompletedReflection(reflection: Reflection) {
  const geminiApiKey = getGeminiApiKey();

  if (geminiApiKey) {
    try {
      return await generateGeminiStructured({
        apiKey: geminiApiKey,
        model: GEMINI_ANALYSIS_MODEL,
        system:
          "You create concise student-facing feedback for grades 3-5 reflection. Feedback must be specific, encouraging, and include exactly one nudge.",
        prompt: `Analyze this completed reflection:\n${reflection.steps
          .map((step) => `${step.label}: ${step.transcription}`)
          .join("\n")}\n\nUse integer overallDepthScore from 1 to 4.`,
        schema: ReflectionAnalysisGeminiSchema,
        parse: ReflectionAnalysisSchema.parse,
      });
    } catch (error) {
      console.warn("Gemini reflection analysis failed, falling back.", error);
    }
  }

  const client = getClient();

  if (!client) {
    return heuristicReflectionAnalysis(reflection);
  }

  const response = await client.responses.parse({
    model: ANALYSIS_MODEL,
    input: [
      {
        role: "system",
        content:
          "You create concise student-facing feedback for grades 3-5 reflection. Feedback must be specific, encouraging, and include exactly one nudge.",
      },
      {
        role: "user",
        content: `Analyze this completed See Think Wonder reflection:\n${reflection.steps
          .map((step) => `${step.label}: ${step.transcription}`)
          .join("\n")}`,
      },
    ],
    text: {
      format: zodTextFormat(ReflectionAnalysisSchema, "reflection_analysis"),
    },
  });

  return response.output_parsed ?? heuristicReflectionAnalysis(reflection);
}

export async function generateSessionSummary(input: {
  session: Session;
  reflections: Reflection[];
}) {
  const client = getClient();
  const completed = input.reflections.filter((reflection) => reflection.completedAt);

  if (!client) {
    return heuristicClassSummary(completed);
  }

  const response = await client.responses.create({
    model: ANALYSIS_MODEL,
    input: [
      {
        role: "system",
        content:
          "Summarize class thinking for a teacher. Paragraph 1: what students are thinking. Paragraph 2: what the teacher should do next.",
      },
      {
        role: "user",
        content: [
          `Learning target: ${input.session.learningTarget || "Not provided"}`,
          `Thinking map: ${JSON.stringify(input.session.classThinkingMap)}`,
          `Student responses: ${completed
            .map((reflection) =>
              `${reflection.displayName}: ${reflection.steps
                .map((step) => `${step.label}: ${step.transcription}`)
                .join(" | ")}`,
            )
            .join("\n")}`,
        ].join("\n\n"),
      },
    ],
  });

  return response.output_text || heuristicClassSummary(completed);
}

export async function generateStimulusImage(input: {
  prompt: string;
  learningTarget?: string;
}) {
  const client = getClient();
  const prompt = [
    "Create a classroom-safe image for a grades 3-5 See Think Wonder routine.",
    "The image should be visually rich enough for observation, interpretation, and curiosity.",
    "No readable text, no logos, no copyrighted characters, no frightening content.",
    input.learningTarget ? `Learning target: ${input.learningTarget}` : null,
    `Teacher description: ${input.prompt}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (!client) {
    return {
      dataUrl: fallbackStimulusDataUrl(input.prompt),
      revisedPrompt: prompt,
      model: "local-fallback",
    };
  }

  const response = await client.images.generate({
    model: IMAGE_MODEL,
    prompt,
    size: "1536x1024",
    quality: "medium",
    n: 1,
  } as Parameters<typeof client.images.generate>[0]);

  const imageResponse = response as ImagesResponse;
  const image = imageResponse.data?.[0];
  if (!image?.b64_json) {
    throw new Error("OpenAI did not return image data.");
  }

  return {
    dataUrl: `data:image/png;base64,${image.b64_json}`,
    revisedPrompt: image.revised_prompt ?? prompt,
    model: IMAGE_MODEL,
  };
}

export async function generateExitTicketQuestion(input: {
  subject: string;
  gradeBand: string;
  lessonContext: string;
}): Promise<ExitTicketQuestion> {
  const geminiApiKey = getGeminiApiKey();

  if (geminiApiKey) {
    try {
      return await generateGeminiStructured({
        apiKey: geminiApiKey,
        model: GEMINI_ANALYSIS_MODEL,
        system:
          "You write one reflection-forward exit ticket question for a teacher. It must be open-ended, grade-appropriate, and invite evidence or reasoning.",
        prompt: [
          `Subject: ${input.subject}`,
          `Grade: ${input.gradeBand}`,
          `What was taught: ${input.lessonContext}`,
          "Return one question only, plus a short teacher-facing rationale.",
        ].join("\n"),
        schema: ExitTicketQuestionGeminiSchema,
        parse: ExitTicketQuestionSchema.parse,
      });
    } catch (error) {
      console.warn("Gemini exit ticket question failed, falling back.", error);
    }
  }

  const client = getClient();

  if (!client) {
    return heuristicExitTicketQuestion(input);
  }

  const response = await client.responses.parse({
    model: ANALYSIS_MODEL,
    input: [
      {
        role: "system",
        content:
          "You write one reflection-forward exit ticket question for a teacher. It must be open-ended, grade-appropriate, and invite evidence or reasoning.",
      },
      {
        role: "user",
        content: [
          `Subject: ${input.subject}`,
          `Grade: ${input.gradeBand}`,
          `What was taught: ${input.lessonContext}`,
          "Return one question only, plus a short teacher-facing rationale.",
        ].join("\n"),
      },
    ],
    text: {
      format: zodTextFormat(ExitTicketQuestionSchema, "exit_ticket_question"),
    },
  });

  return response.output_parsed ?? heuristicExitTicketQuestion(input);
}

export async function analyzeExitTicketTurn(input: {
  session: Session;
  reflection: Reflection;
  prompt: string;
  response: string;
  turnIndex: number;
  maxTurns: number;
}): Promise<ExitTicketTurnAnalysis> {
  const previous = input.reflection.steps
    .map((step) => `${step.prompt ?? step.label}: ${step.transcription}`)
    .join("\n");
  const geminiApiKey = getGeminiApiKey();

  if (geminiApiKey) {
    try {
      return await generateGeminiStructured({
        apiKey: geminiApiKey,
        model: GEMINI_ANALYSIS_MODEL,
        system:
          "You analyze one student reflection turn for a grades 3-5 teacher. Always quote the student's exact words, rate depth from 1 surface to 4 transfer, and generate one specific follow-up unless this is the final turn.",
        prompt: [
          `Exit ticket question: ${input.session.exitTicketQuestion}`,
          `Lesson context: ${input.session.exitTicketContext || input.session.learningTarget}`,
          `Current prompt: ${input.prompt}`,
          `Student response: ${input.response}`,
          `Previous conversation:\n${previous || "None"}`,
          `Turn ${input.turnIndex + 1} of ${input.maxTurns}.`,
          "Use an integer rating from 1 to 4.",
          input.turnIndex >= input.maxTurns - 1
            ? "This is the final turn. Set followUpQuestion to null."
            : "Write the next follow-up question. It must include a direct quote from the student's current response.",
        ].join("\n\n"),
        schema: ExitTicketTurnGeminiSchema,
        parse: ExitTicketTurnAnalysisSchema.parse,
      });
    } catch (error) {
      console.warn("Gemini exit ticket turn failed, falling back.", error);
    }
  }

  const client = getClient();

  if (!client) {
    return heuristicExitTicketTurn(input);
  }

  const response = await client.responses.parse({
    model: ANALYSIS_MODEL,
    input: [
      {
        role: "system",
        content:
          "You analyze one student reflection turn for a grades 3-5 teacher. Always quote the student's exact words, rate depth from 1 surface to 4 transfer, and generate one specific follow-up unless this is the final turn.",
      },
      {
        role: "user",
        content: [
          `Exit ticket question: ${input.session.exitTicketQuestion}`,
          `Lesson context: ${input.session.exitTicketContext || input.session.learningTarget}`,
          `Current prompt: ${input.prompt}`,
          `Student response: ${input.response}`,
          `Previous conversation:\n${previous || "None"}`,
          `Turn ${input.turnIndex + 1} of ${input.maxTurns}.`,
          input.turnIndex >= input.maxTurns - 1
            ? "This is the final turn. Set followUpQuestion to null."
            : "Write the next follow-up question. It must include a direct quote from the student's current response.",
        ].join("\n\n"),
      },
    ],
    text: {
      format: zodTextFormat(ExitTicketTurnAnalysisSchema, "exit_ticket_turn_analysis"),
    },
  });

  return response.output_parsed ?? heuristicExitTicketTurn(input);
}

function heuristicStepAnalysis(transcript: string, label: RoutineStepLabel): StepAnalysis {
  const words = transcript.split(/\s+/).filter(Boolean).length;
  const hasReasoning = /\b(because|so|since|that makes me think|evidence|maybe|might)\b/i.test(
    transcript,
  );
  const hasQuestion = /\?|wonder|why|how|what if|could/i.test(transcript);
  const depthScore = Math.min(4, Math.max(1, (words > 18 ? 2 : 1) + (hasReasoning ? 1 : 0) + (hasQuestion ? 1 : 0)));
  const depthLevel = (["surface", "developing", "deep", "transfer"] as const)[
    depthScore - 1
  ];

  return StepAnalysisSchema.parse({
    depthLevel,
    depthScore,
    cognitiveMoves: [
      label === "See" ? "observed details" : null,
      hasReasoning ? "explained reasoning" : null,
      hasQuestion ? "asked a question" : null,
    ].filter(Boolean),
    specificEvidence:
      transcript.length > 120 ? `${transcript.slice(0, 117)}...` : transcript,
    followUpQuestion: buildFollowUp(label, transcript),
    tone: "engaged",
    safetyNotes: null,
  });
}

function fallbackStimulusDataUrl(prompt: string) {
  const safePrompt = escapeXml(prompt.trim() || "Classroom observation scene");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">
  <rect width="1536" height="1024" fill="#fdcb40"/>
  <rect x="96" y="88" width="1344" height="848" rx="48" fill="#fff6ed" stroke="#000" stroke-width="8"/>
  <circle cx="342" cy="300" r="118" fill="#04c6c5" stroke="#000" stroke-width="8"/>
  <rect x="524" y="214" width="606" height="190" rx="46" fill="#fff" stroke="#000" stroke-width="8"/>
  <path d="M280 678 C430 502, 650 508, 812 660 S1134 808, 1278 620" fill="none" stroke="#006cff" stroke-width="24" stroke-linecap="round"/>
  <rect x="246" y="702" width="300" height="116" rx="34" fill="#f780d4" stroke="#000" stroke-width="8"/>
  <rect x="660" y="706" width="246" height="116" rx="34" fill="#00b351" stroke="#000" stroke-width="8"/>
  <rect x="1012" y="690" width="278" height="132" rx="34" fill="#fd4401" stroke="#000" stroke-width="8"/>
  <text x="768" y="512" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#000">AI image preview</text>
  <text x="768" y="584" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#000">${safePrompt.slice(0, 70)}</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function heuristicExitTicketQuestion(input: {
  subject: string;
  gradeBand: string;
  lessonContext: string;
}): ExitTicketQuestion {
  const subject = input.subject.trim() || "today's lesson";
  const context = input.lessonContext.trim() || `what you learned in ${subject}`;

  return ExitTicketQuestionSchema.parse({
    question: `What is one idea from ${context} that feels important to you now, and what makes you say that?`,
    rationale:
      "This asks students to name a meaningful idea and support it with reasoning or evidence.",
  });
}

function heuristicExitTicketTurn(input: {
  response: string;
  turnIndex: number;
  maxTurns: number;
}): ExitTicketTurnAnalysis {
  const words = input.response.split(/\s+/).filter(Boolean).length;
  const hasReasoning = /\b(because|so|since|evidence|example|when|if|means)\b/i.test(
    input.response,
  );
  const hasTransfer = /\b(another|outside|real life|reminds me|different subject|next time)\b/i.test(
    input.response,
  );
  const rating = Math.min(4, Math.max(1, (words > 12 ? 2 : 1) + (hasReasoning ? 1 : 0) + (hasTransfer ? 1 : 0)));
  const ratingLabel = (["surface", "developing", "deep", "transfer"] as const)[rating - 1];
  const quote = extractQuote(input.response);

  return ExitTicketTurnAnalysisSchema.parse({
    directQuote: quote,
    rating,
    ratingLabel,
    teacherSummary:
      rating >= 3
        ? "The student is explaining their thinking with evidence or a meaningful connection."
        : "The student has started a reflection but needs a more specific reason or example.",
    followUpQuestion:
      input.turnIndex >= input.maxTurns - 1
        ? null
        : `You said “${quote}”; what is one example or detail from class that supports that?`,
  });
}

function heuristicReflectionAnalysis(reflection: Reflection): ReflectionAnalysis {
  const highestStep =
    reflection.steps
      .slice()
      .sort((a, b) => (b.depthScore ?? 1) - (a.depthScore ?? 1))[0] ?? reflection.steps[0];
  const average =
    reflection.steps.reduce((sum, step) => sum + (step.depthScore ?? 1), 0) /
    Math.max(reflection.steps.length, 1);

  return ReflectionAnalysisSchema.parse({
    overallDepthScore: Math.round(average),
    strongestStep: highestStep?.label ?? "Wonder",
    strongestMove: `Your ${highestStep?.label ?? "Wonder"} response used a specific idea from your thinking.`,
    nudge: "Next time, add one exact detail as evidence for your idea.",
    keyQuotes: reflection.steps
      .map((step) => step.transcription)
      .filter(Boolean)
      .slice(0, 2),
    crossCurricularConnections: detectConnections(reflection),
    mindset: "growth",
    tone: reflection.contentAlerts.some((alert) => alert.severity === "red")
      ? "concerned"
      : "engaged",
  });
}

function heuristicClassSummary(reflections: Reflection[]) {
  if (reflections.length === 0) {
    return "No completed reflections yet. Once students finish, ReflectAI will summarize class patterns and suggest next instructional moves.";
  }

  return `Students are producing visible thinking across ${reflections.length} completed reflections. The strongest pattern is that students are naming observable details and beginning to explain what those details might mean.\n\nNext, ask two or three students to share one claim and the exact detail that supports it. Then use “What makes you say that?” as a whole-class bridge before moving into writing.`;
}

function buildFollowUp(label: RoutineStepLabel, transcript: string) {
  if (label === "See") return "What is one smaller detail you noticed that others might miss?";
  if (label === "Think") return "What detail from what you saw makes you think that?";
  if (transcript.length < 40) return "What makes that question important to investigate?";
  return "Where could you look for evidence to explore that question?";
}

function extractQuote(response: string) {
  const trimmed = response.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 90) return trimmed;

  const sentence = trimmed.split(/[.!?]/).find((item) => item.trim().length > 0);
  return (sentence && sentence.length <= 90 ? sentence : trimmed.slice(0, 87)).trim() + "...";
}

function detectConnections(reflection: Reflection) {
  const text = reflection.steps.map((step) => step.transcription).join(" ").toLowerCase();
  return [
    /map|place|country|city|history/.test(text) ? "Social studies" : null,
    /weather|water|plant|animal|data/.test(text) ? "Science" : null,
    /number|pattern|graph|measure/.test(text) ? "Math" : null,
  ].filter(Boolean) as string[];
}

function labelToNumber(label: RoutineStepLabel) {
  return label === "See" ? 1 : label === "Think" ? 2 : 3;
}
