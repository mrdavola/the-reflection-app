import type { FocusId } from "./types";

export interface FocusOption {
  id: FocusId;
  label: string;
  blurb: string;
  emoji: string;
  bestFor: string;
}

export const FOCUS_OPTIONS: FocusOption[] = [
  {
    id: "retrieval",
    label: "Retrieval",
    blurb: "What can you remember and explain?",
    emoji: "🧠",
    bestFor: "After a lesson, exit ticket, study session",
  },
  {
    id: "understanding",
    label: "Understanding",
    blurb: "How well do you grasp the concept?",
    emoji: "💡",
    bestFor: "Mid-unit checks, formative assessment",
  },
  {
    id: "critical-thinking",
    label: "Critical Thinking",
    blurb: "Evidence, reasoning, evaluation.",
    emoji: "🔍",
    bestFor: "Debate, argumentative writing, source evaluation",
  },
  {
    id: "problem-solving",
    label: "Problem Solving",
    blurb: "Working through a challenge step by step.",
    emoji: "🧩",
    bestFor: "Math, coding, project obstacles",
  },
  {
    id: "creative-booster",
    label: "Creative Booster",
    blurb: "Spark new ideas and unexpected connections.",
    emoji: "✨",
    bestFor: "Idea generation, art, design briefs",
  },
  {
    id: "self-authorship",
    label: "Self-Authorship",
    blurb: "Owning your voice, choices, and direction.",
    emoji: "🪞",
    bestFor: "Personal projects, identity work, leadership",
  },
  {
    id: "growth-mindset",
    label: "Growth Mindset",
    blurb: "Effort, persistence, and learning from struggle.",
    emoji: "🌱",
    bestFor: "After tough feedback, setbacks, retakes",
  },
  {
    id: "collaboration",
    label: "Collaboration",
    blurb: "Reflecting on teamwork and contributions.",
    emoji: "🤝",
    bestFor: "Group work, partner projects, team debriefs",
  },
  {
    id: "communication",
    label: "Communication",
    blurb: "Clarity, audience, and how ideas land.",
    emoji: "💬",
    bestFor: "Presentations, writing reviews, peer talk",
  },
  {
    id: "goal-setting",
    label: "Goal Setting",
    blurb: "Naming what you'll do and why it matters.",
    emoji: "🎯",
    bestFor: "Start-of-week, project kickoff, coaching",
  },
  {
    id: "metacognition",
    label: "Metacognition",
    blurb: "Thinking about your thinking.",
    emoji: "🪐",
    bestFor: "Strategy reflection, study habits",
  },
  {
    id: "writing-support",
    label: "Writing Support",
    blurb: "Process, revision, and craft choices.",
    emoji: "✍️",
    bestFor: "Drafting, revising, conferencing",
  },
  {
    id: "research-thinking",
    label: "Research Thinking",
    blurb: "Sources, credibility, and questions.",
    emoji: "📚",
    bestFor: "Research papers, inquiry projects",
  },
  {
    id: "design-thinking",
    label: "Design Thinking",
    blurb: "Empathy, prototyping, iteration.",
    emoji: "🛠️",
    bestFor: "Maker projects, product design, STEAM",
  },
  {
    id: "ethical-reasoning",
    label: "Ethical Reasoning",
    blurb: "Stakeholders, tradeoffs, values.",
    emoji: "⚖️",
    bestFor: "AI ethics, civics, moral dilemmas",
  },
  {
    id: "emotional-awareness",
    label: "Emotional Awareness",
    blurb: "Notice, name, and respond to feelings.",
    emoji: "🫶",
    bestFor: "SEL check-ins, transitions, advisory",
  },
];

export function getFocus(id: FocusId): FocusOption {
  return FOCUS_OPTIONS.find((f) => f.id === id) ?? FOCUS_OPTIONS[0];
}
