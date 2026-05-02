// Heuristic fallbacks used when AI_GATEWAY_API_KEY isn't configured.
// They give the demo enough behavior to feel real without needing live LLM calls.

import { scanForAlerts } from "./safety";
import type { ReflectionAnalysis, Rubric, ScoreColor } from "../types";

function isEs(language?: string): boolean {
  if (!language) return false;
  return language === "Spanish" || language.toLowerCase().startsWith("es");
}

// Small canned-phrase dictionary so mock output reads naturally in Spanish.
const ES = {
  defaultSubject: "lo que estás trabajando",
  prompt_clear: (s: string) => `Mirando ${s}, ¿qué te parece más claro ahora mismo?`,
  prompt_effort: (s: string) =>
    `¿Qué parte de ${s.toLowerCase()} te está costando más, y por qué?`,
  prompt_friend:
    "Si un amigo intentara esto por primera vez, ¿qué consejo le darías?",
  prompt_pattern:
    "¿Qué patrón, sorpresa o conexión has notado hasta ahora?",
  prompt_next:
    "¿Cuál es un próximo paso concreto que puedas intentar en las próximas 24 horas?",
  prompt_focus: (f: string) =>
    `¿En qué parte podría ${f} llevar tu pensamiento un poco más lejos?`,

  feedback_seed:
    "Aquí hay una verdadera semilla de idea. Intenta decir más sobre *por qué* esto te importa, o describe un momento que te haya hecho pensar así. Incluso un ejemplo específico le dará más fuerza a tu reflexión. Próximo paso: elige una pregunta y vuelve a grabar añadiendo un detalle concreto.",
  feedback_open: "Buen trabajo al pausar para pensar en esto.",
  feedback_specific:
    "Mencionaste algo específico en tu primera respuesta — ese tipo de detalle es lo que hace útil una reflexión.",
  feedback_surface:
    "Empiezas a ver lo que está funcionando — busca un ejemplo específico la próxima vez.",
  feedback_concrete:
    "Un área para seguir creciendo: nombra *lo que harás después* de manera concreta (cuándo, dónde, con quién).",
  feedback_close:
    "Próximo paso: toma una observación de aquí y conviértela en una sola frase que puedas poner en práctica mañana.",

  summary_default:
    "El alumno compartió una breve reflexión. Hay espacio para añadir detalles más específicos la próxima vez.",
  strength_growth: "Nombrar lo que intentarás a continuación",
  strength_pause: "Pausar para reflexionar sobre la experiencia",
  strength_evidence: "Apoyar tu pensamiento con detalles",
  strength_words: "Poner tu pensamiento en palabras",
  strength_collab: "Reconocer el papel de los demás",
  strength_own: "Asumir tu propia perspectiva",
  next_step_growth:
    "Elige uno de tus próximos pasos y define exactamente cuándo y dónde lo intentarás.",
  next_step_specific:
    "Elige un momento específico de tu trabajo y explica *por qué* destacó.",
  mindset_growth: "Muestra una postura de crecimiento — usando el esfuerzo como información.",
  mindset_struggle: "Surge algo de incertidumbre — vale la pena un seguimiento.",
  mindset_steady: "Postura constante y reflexiva.",
  tone_constructive: "Constructiva y orientada hacia adelante.",
  tone_hesitant: "Un poco vacilante — se beneficiaría de aliento.",
  tone_neutral: "Neutral y observadora.",
  hidden_growth:
    "Tratar el esfuerzo y la revisión como parte del aprendizaje, no como un fracaso.",
  hidden_evidence: "Conectar las afirmaciones con la evidencia.",
  hidden_articulate: "Bajar el ritmo para articular lo que notaste.",
  bias_none: "No se detecta sesgo importante",
  bias_none_explain: "El razonamiento se basa en evidencia específica.",
  bias_avail: "Posible sesgo de disponibilidad",
  bias_avail_explain:
    "La reflexión se apoya en un solo ejemplo. Considera reunir más antes de sacar conclusiones.",
  followup_struggle:
    "Considera una breve conversación 1:1 para aclarar la fuente de la dificultad.",
  followup_default:
    "Anima al alumno a articular un próximo paso concreto con una fecha límite.",
  evidence_missing:
    "No hay suficiente detalle en la respuesta para citar evidencia todavía.",
};

export function mockPrompts(opts: {
  objective: string;
  focus: string;
  count: number;
  language?: string;
  /** Prior Q/A pairs so follow-ups can avoid repetition and reference what was just said. */
  prior?: { promptText: string; text: string }[];
}): string[] {
  const { objective, focus, count, prior } = opts;
  const es = isEs(opts.language);
  const lastAnswer = prior?.[prior.length - 1]?.text ?? "";
  const stem = pickStem(lastAnswer);

  if (es) {
    const subject =
      objective.length > 12 ? objective.replace(/\.$/, "") : ES.defaultSubject;
    const stemPrompts = stem
      ? [
          `Cuando dijiste “${stem}”, ¿qué hay debajo de eso para ti?`,
          `Mencionaste “${stem}” — ¿qué cambia si lo miras desde otro ángulo?`,
        ]
      : [];
    const candidates = [
      ...stemPrompts,
      ES.prompt_clear(subject),
      ES.prompt_effort(subject),
      ES.prompt_friend,
      ES.prompt_pattern,
      ES.prompt_next,
      ES.prompt_focus(focus.replace(/-/g, " ")),
    ];
    return pickUnique(candidates, prior, count);
  }

  const subject = objective.length > 12 ? objective.replace(/\.$/, "") : "what you're working on";
  const stemPrompts = stem
    ? [
        `When you said “${stem}” — what's underneath that for you?`,
        `You mentioned “${stem}.” What would change if that turned out to be only half the story?`,
      ]
    : [];
  const candidates = [
    ...stemPrompts,
    `Looking at ${subject}, what feels most clear to you right now?`,
    `What part of ${subject.toLowerCase()} is taking the most effort, and why?`,
    `If a friend tried this for the first time, what is one piece of advice you'd give them?`,
    `What pattern, surprise, or connection have you noticed so far?`,
    `What's one specific next step you can try in the next 24 hours?`,
    `Where could ${focus.replace(/-/g, " ")} push your thinking a little further?`,
  ];
  return pickUnique(candidates, prior, count);
}

/**
 * Pull a short, substantive snippet from the most recent answer so the next
 * mock prompt feels like it was actually listening. Skips conversational
 * filler and openings; falls back to null when nothing usable is found.
 */
function pickStem(text: string): string | null {
  if (!text) return null;
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/^(hey|hi|hello|um+|uh+|so|like|i mean|you know)[\s,]*/i, "")
    .trim();
  if (!cleaned) return null;
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/[.!?]+$/, "").trim())
    .filter(Boolean);
  for (const s of sentences) {
    const words = s.split(/\s+/);
    if (words.length >= 4 && words.length <= 14) return s;
  }
  // No sentence hits the sweet spot — clip the opening of the longest one.
  const longest = sentences.sort((a, b) => b.length - a.length)[0] ?? cleaned;
  const words = longest.split(/\s+/).slice(0, 12);
  return words.join(" ");
}

/**
 * Returns up to `count` candidates not already present in `prior`.
 * Falls back to the candidate list when everything would otherwise be filtered.
 */
function pickUnique(
  candidates: string[],
  prior: { promptText: string }[] | undefined,
  count: number,
): string[] {
  if (!prior || prior.length === 0) return candidates.slice(0, count);
  const used = new Set(prior.map((p) => normalize(p.promptText)));
  const fresh = candidates.filter((c) => !used.has(normalize(c)));
  if (fresh.length >= count) return fresh.slice(0, count);
  // Top up with originals if we filtered too aggressively.
  const topUp = candidates.filter((c) => !fresh.includes(c)).slice(0, count - fresh.length);
  return [...fresh, ...topUp];
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function mockFeedback(opts: {
  objective: string;
  responses: { promptText: string; text: string }[];
  language?: string;
}): string {
  const wordCount = opts.responses.reduce((n, r) => n + r.text.split(/\s+/).filter(Boolean).length, 0);
  const es = isEs(opts.language);
  if (wordCount < 25) {
    return es
      ? ES.feedback_seed
      : "There's a real seed of an idea here. Try saying more about *why* this matters to you, or describe a moment that made you think this way. Even one specific example will give your reflection more traction. Next step: pick one prompt and re-record with one concrete detail.";
  }
  const firstAnswer = opts.responses[0]?.text ?? "";
  if (es) {
    return [
      ES.feedback_open,
      firstAnswer.length > 30 ? ES.feedback_specific : ES.feedback_surface,
      ES.feedback_concrete,
      ES.feedback_close,
    ].join(" ");
  }
  return [
    `Nice work pausing to think about this.`,
    firstAnswer.length > 30
      ? `You named something specific in your first response — that's the kind of detail that makes reflection useful.`
      : `You're starting to surface what's working — push for one specific example next time.`,
    `One area to keep stretching: name *what you'll do next* in concrete terms (when, where, with whom).`,
    `Next step: pick one observation here and turn it into a single sentence you can act on tomorrow.`,
  ].join(" ");
}

export function mockAnalysis(opts: {
  objective: string;
  responses: { promptText: string; text: string }[];
  gradeBand: string;
  rubric?: Rubric;
  language?: string;
}): ReflectionAnalysis {
  const es = isEs(opts.language);
  const fullText = opts.responses.map((r) => r.text).join(" ");
  const words = fullText.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const has = (...ks: string[]) => ks.some((k) => fullText.toLowerCase().includes(k));

  const growthSignal = has("learned", "tried", "next time", "keep going", "improve");
  const struggleSignal = has("hard", "stuck", "confused", "frustrating", "overwhelm");
  const collabSignal = has("we", "team", "group", "partner", "together");
  const evidenceSignal = has("because", "evidence", "shows", "for example", "data", "source");

  const understandingScore = Math.max(
    20,
    Math.min(96, 38 + Math.round(wc * 0.7) + (evidenceSignal ? 12 : 0) - (struggleSignal && wc < 80 ? 8 : 0)),
  );

  const reflectionLevel: 1 | 2 | 3 | 4 =
    understandingScore >= 80 ? 4 : understandingScore >= 65 ? 3 : understandingScore >= 45 ? 2 : 1;
  const scoreColor: ScoreColor =
    reflectionLevel === 4 ? "sunny" : reflectionLevel === 3 ? "sunny" : reflectionLevel === 2 ? "orange" : "blue";

  const understandingLabel =
    understandingScore >= 80
      ? "Advanced"
      : understandingScore >= 60
        ? "Proficient"
        : understandingScore >= 40
          ? "Developing"
          : "Emerging";

  const mindset: ReflectionAnalysis["mindset"] = struggleSignal
    ? "uncertain"
    : growthSignal
      ? "growth"
      : "reflective";

  const tone: ReflectionAnalysis["tone"] = struggleSignal
    ? "hesitant"
    : growthSignal
      ? "constructive"
      : "neutral";

  const skills: string[] = [];
  if (evidenceSignal) skills.push("information literacy");
  if (collabSignal) skills.push("collaboration");
  if (growthSignal) skills.push("metacognition");
  skills.push("reflection");
  if (has("plan", "next step", "tomorrow")) skills.push("planning");

  // Heuristic studentQuotes: pick sentences with high-information words.
  const HIGH_INFO_WORDS = [
    "because",
    "learned",
    "noticed",
    "realized",
    "tried",
    "next time",
    "evidence",
    "for example",
    "shows",
    "data",
    "pattern",
    "connection",
    "surprised",
    "challenge",
    "improve",
  ];
  const sentences = fullText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12 && s.length <= 220);
  const scored = sentences
    .map((s) => {
      const lower = s.toLowerCase();
      const score = HIGH_INFO_WORDS.reduce((n, k) => (lower.includes(k) ? n + 1 : n), 0);
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const seenQuotes = new Set<string>();
  const studentQuotes: string[] = [];
  for (const { s } of scored) {
    const trimmed = s.replace(/^["']|["']$/g, "").trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    if (wordCount > 24) continue;
    if (seenQuotes.has(trimmed.toLowerCase())) continue;
    seenQuotes.add(trimmed.toLowerCase());
    studentQuotes.push(trimmed);
    if (studentQuotes.length >= 3) break;
  }
  if (studentQuotes.length === 0 && sentences.length > 0) {
    const fallback = sentences[0].replace(/^["']|["']$/g, "").trim();
    const wordCount = fallback.split(/\s+/).filter(Boolean).length;
    if (wordCount <= 24) studentQuotes.push(fallback);
  }

  // Cross-curricular: only when the response touches multiple subject domains.
  const SUBJECTS: { id: string; keywords: string[] }[] = [
    { id: "math", keywords: ["math", "equation", "fraction", "algebra", "geometry", "graph", "data"] },
    { id: "science", keywords: ["science", "experiment", "hypothesis", "lab", "biology", "chemistry", "physics", "ecosystem"] },
    { id: "ela", keywords: ["essay", "writing", "story", "novel", "poem", "metaphor", "author", "reading"] },
    { id: "history", keywords: ["history", "historical", "war", "civilization", "century", "revolution", "society"] },
    { id: "art", keywords: ["art", "drawing", "paint", "design", "sketch", "color", "composition"] },
    { id: "music", keywords: ["music", "rhythm", "melody", "instrument", "song", "tempo"] },
    { id: "tech", keywords: ["code", "coding", "computer", "program", "app", "robot", "algorithm"] },
  ];
  const hitSubjects = SUBJECTS.filter((s) => s.keywords.some((k) => fullText.toLowerCase().includes(k))).map(
    (s) => s.id,
  );
  const SUBJECT_LABEL: Record<string, string> = {
    math: "Math",
    science: "Science",
    ela: "English / Language Arts",
    history: "History",
    art: "Visual Art",
    music: "Music",
    tech: "Computer Science",
  };
  const crossCurricularConnections: string[] = [];
  if (hitSubjects.length >= 2) {
    const [a, b] = hitSubjects;
    crossCurricularConnections.push(`${SUBJECT_LABEL[a]} ↔ ${SUBJECT_LABEL[b]}`);
    if (hitSubjects.length >= 3) {
      crossCurricularConnections.push(`${SUBJECT_LABEL[a]} ↔ ${SUBJECT_LABEL[hitSubjects[2]]}`);
    }
  }

  // Synthesize rubric results when a rubric was provided.
  let rubricResults: ReflectionAnalysis["rubricResults"];
  if (opts.rubric?.enabled && opts.rubric.criteria.length > 0) {
    rubricResults = opts.rubric.criteria.map((c) => {
      const label = c.label.toLowerCase();
      // Bias the level by criterion-specific signals layered onto the global
      // reflectionLevel so different criteria get plausibly different levels.
      let level = reflectionLevel as 1 | 2 | 3 | 4;
      const bumps =
        (label.includes("evidence") && evidenceSignal ? 1 : 0) +
        (label.includes("reason") && evidenceSignal ? 1 : 0) +
        (label.includes("next") && (growthSignal || has("plan", "tomorrow")) ? 1 : 0) +
        (label.includes("collab") && collabSignal ? 1 : 0) +
        (label.includes("growth") && growthSignal ? 1 : 0);
      const dings = label.includes("evidence") && !evidenceSignal ? 1 : 0;
      level = Math.max(1, Math.min(4, level + bumps - dings)) as 1 | 2 | 3 | 4;

      // Pick an evidence snippet: prefer a quote we already extracted, else
      // first informative sentence, else fall back to the opening text.
      let evidence = studentQuotes[0] ?? sentences[0] ?? opts.responses[0]?.text ?? "";
      evidence = evidence.replace(/\s+/g, " ").trim();
      if (evidence.length > 180) evidence = evidence.slice(0, 177) + "…";
      if (!evidence) {
        evidence = es
          ? ES.evidence_missing
          : "Not enough detail in the response to cite evidence yet.";
      }

      return { criterionId: c.id, level, evidence };
    });
  }

  return {
    summary:
      opts.responses[0]?.text?.slice(0, 200) ||
      (es
        ? ES.summary_default
        : "The learner shared a brief reflection. There is room to add more specific detail next time."),
    feedback: mockFeedback({
      objective: opts.objective,
      responses: opts.responses,
      language: opts.language,
    }),
    strengthsNoticed: es
      ? [
          growthSignal ? ES.strength_growth : ES.strength_pause,
          evidenceSignal ? ES.strength_evidence : ES.strength_words,
          collabSignal ? ES.strength_collab : ES.strength_own,
        ]
      : [
          growthSignal ? "Naming what you'll try next" : "Pausing to reflect on the experience",
          evidenceSignal ? "Backing up your thinking with detail" : "Putting your thinking into words",
          collabSignal ? "Acknowledging the role of others" : "Owning your own perspective",
        ],
    suggestedNextStep: es
      ? growthSignal
        ? ES.next_step_growth
        : ES.next_step_specific
      : growthSignal
        ? "Pick one of your next steps and define exactly when and where you'll try it."
        : "Pick one specific moment from your work and explain *why* it stood out.",
    understandingScore,
    understandingLabel,
    reflectionLevel,
    scoreColor,
    zone: reflectionLevel >= 3 ? (reflectionLevel === 4 ? "high" : "ideal") : reflectionLevel === 2 ? "below" : "below",
    mindset,
    mindsetSummary: es
      ? growthSignal
        ? ES.mindset_growth
        : struggleSignal
          ? ES.mindset_struggle
          : ES.mindset_steady
      : growthSignal
        ? "Shows a growth-oriented stance — using struggle as data."
        : struggleSignal
          ? "Some uncertainty surfacing — worth a check-in."
          : "Steady, reflective stance.",
    tone,
    toneSummary: es
      ? tone === "constructive"
        ? ES.tone_constructive
        : tone === "hesitant"
          ? ES.tone_hesitant
          : ES.tone_neutral
      : tone === "constructive"
        ? "Constructive and forward-looking."
        : tone === "hesitant"
          ? "Slightly hesitant — would benefit from encouragement."
          : "Neutral and observant.",
    keyCognitiveSkills: skills.slice(0, 5),
    hiddenLesson: es
      ? growthSignal
        ? ES.hidden_growth
        : evidenceSignal
          ? ES.hidden_evidence
          : ES.hidden_articulate
      : growthSignal
        ? "Treating effort and revision as part of the learning, not a failure mode."
        : evidenceSignal
          ? "Connecting claims back to evidence."
          : "Slowing down to articulate what you noticed.",
    possibleCognitiveBias: evidenceSignal
      ? {
          label: "No major bias detected",
          explanation: es ? ES.bias_none_explain : "Reasoning is grounded in specific evidence.",
        }
      : {
          label: "Possible availability bias",
          explanation: es
            ? ES.bias_avail_explain
            : "The reflection leans on a single example. Consider gathering more before drawing conclusions.",
        },
    crossCurricularConnections,
    studentQuotes,
    teacherFollowUp: es
      ? struggleSignal
        ? ES.followup_struggle
        : ES.followup_default
      : struggleSignal
        ? "Consider a quick 1:1 check-in to clarify the source of difficulty."
        : "Push the learner to articulate one specific next move with a deadline.",
    motivationSignal: struggleSignal ? "low" : growthSignal ? "high" : "moderate",
    contentAlerts: scanForAlerts(fullText),
    rubricResults,
  };
}

export function mockGroupSummary(opts: {
  groupName: string;
  reflections: { participantName: string; analysis?: ReflectionAnalysis | null }[];
}) {
  const total = opts.reflections.length;
  if (total === 0) {
    return {
      understandingParagraph:
        "No reflections have been submitted yet. Once students submit, you'll see a group-level summary here.",
      teacherMovesParagraph:
        "Share the reflection link with your students to get started. The dashboard will populate as they submit.",
      recommendedTeacherMoves: [
        "Share the activity link in your LMS or with a QR code on the board.",
        "Model a 30-second example reflection so students hear what 'good enough' sounds like.",
      ],
      commonStrengths: [],
      commonStruggles: [],
      studentsNeedingFollowUp: [],
      studentsReadyForExtension: [],
    };
  }
  const followUps = opts.reflections
    .filter((r) => r.analysis && (r.analysis.reflectionLevel <= 2 || r.analysis.motivationSignal === "low"))
    .map((r) => r.participantName);
  const extension = opts.reflections
    .filter((r) => r.analysis && r.analysis.reflectionLevel === 4)
    .map((r) => r.participantName);
  return {
    understandingParagraph: `${total} reflection${total === 1 ? "" : "s"} have been submitted in ${opts.groupName}. Most students are putting their thinking into words and naming at least one observation; depth varies. A handful went deep on specific evidence and next steps, which suggests they're ready for extension; others stayed at surface descriptions and would benefit from a model.`,
    teacherMovesParagraph:
      "Open tomorrow with a 3-minute model of a strong reflection alongside a weak one, then ask the class to name what changed. Pull the students flagged for follow-up for a quick check-in. For students ready for extension, hand them the prompt of writing the strongest counter-argument to their own first answer.",
    recommendedTeacherMoves: [
      "Model one weak vs. one strong sample reflection at the start of class.",
      "Pull flagged students for a 2-minute check-in during independent work.",
      "Add sentence stems for next time: 'I noticed…', 'Next time I will…'",
      "For extension: ask top reflectors to argue against their own first answer.",
    ],
    commonStrengths: ["Naming at least one observation", "Connecting effort to outcome"],
    commonStruggles: ["Specifying a concrete next step", "Backing claims with evidence"],
    studentsNeedingFollowUp: followUps.slice(0, 8),
    studentsReadyForExtension: extension.slice(0, 8),
  };
}
