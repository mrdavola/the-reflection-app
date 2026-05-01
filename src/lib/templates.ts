import type { ActivityPrompt, FocusId, GradeBand } from "./types";

export interface ActivityTemplate {
  id: string;
  title: string;
  category: string;
  gradeBands: GradeBand[];
  focus: FocusId;
  estimatedMinutes: number;
  description: string;
  objective: string;
  prompts: ActivityPrompt[];
}

const p = (text: string): ActivityPrompt => ({
  id: text.slice(0, 16),
  text,
  source: "teacher",
});

export const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  {
    id: "exit-ticket",
    title: "Lesson Exit Ticket",
    category: "Exit Ticket",
    gradeBands: ["3-5", "6-8", "9-12"],
    focus: "retrieval",
    estimatedMinutes: 3,
    description: "A quick 3-minute reflection on what students just learned and where they're still unsure.",
    objective: "Students will recall today's lesson and identify one area that's still unclear.",
    prompts: [
      p("What is one idea from today's lesson you could explain to a classmate?"),
      p("What part is still fuzzy or confusing?"),
      p("What's one question you'd like answered tomorrow?"),
    ],
  },
  {
    id: "project-checkpoint",
    title: "Project Checkpoint",
    category: "Project Reflection",
    gradeBands: ["6-8", "9-12", "higher-ed"],
    focus: "problem-solving",
    estimatedMinutes: 5,
    description: "Mid-project check-in for progress, obstacles, and next steps. Great for daily project work.",
    objective: "Students will reflect on project progress and identify a specific next step.",
    prompts: [
      p("What part of your project is working well right now?"),
      p("What challenge are you facing today?"),
      p("What is one specific thing you will try next?"),
    ],
  },
  {
    id: "collaboration-debrief",
    title: "Collaboration Debrief",
    category: "Collaboration Reflection",
    gradeBands: ["3-5", "6-8", "9-12"],
    focus: "collaboration",
    estimatedMinutes: 4,
    description: "Reflect on group dynamics and contributions after partner or team work.",
    objective: "Students will reflect on how their group worked together and what to refine.",
    prompts: [
      p("How did your group share ideas today?"),
      p("What is one thing you contributed to the group?"),
      p("What is one thing your group could do better next time?"),
    ],
  },
  {
    id: "writing-revision",
    title: "Writing Revision Reflection",
    category: "Writing Reflection",
    gradeBands: ["6-8", "9-12", "higher-ed"],
    focus: "writing-support",
    estimatedMinutes: 6,
    description: "After a draft, students articulate their main idea and revision choices.",
    objective: "Students will reflect on their writing process and the revisions they made.",
    prompts: [
      p("What is the main idea of your writing in one sentence?"),
      p("What is one revision that made your writing stronger?"),
      p("What feedback do you still need to push it further?"),
    ],
  },
  {
    id: "research-process",
    title: "Research Process Reflection",
    category: "Research Reflection",
    gradeBands: ["6-8", "9-12", "higher-ed"],
    focus: "research-thinking",
    estimatedMinutes: 5,
    description: "Source evaluation and information literacy reflection.",
    objective: "Students will reflect on how they gathered and evaluated sources.",
    prompts: [
      p("What source helped you the most so far, and why?"),
      p("How did you decide whether your information was reliable?"),
      p("What question do you still need to investigate?"),
    ],
  },
  {
    id: "creative-process",
    title: "Creative Process Reflection",
    category: "Creative Process",
    gradeBands: ["3-5", "6-8", "9-12"],
    focus: "creative-booster",
    estimatedMinutes: 4,
    description: "For art, music, performance, or design — articulate creative decisions.",
    objective: "Students will reflect on the creative choices behind their work.",
    prompts: [
      p("What did you create, in your own words?"),
      p("What creative choice are you most proud of, and why did you make it?"),
      p("What would you do differently next time?"),
    ],
  },
  {
    id: "sel-checkin",
    title: "SEL Check-In",
    category: "SEL Reflection",
    gradeBands: ["k-2", "3-5", "6-8"],
    focus: "emotional-awareness",
    estimatedMinutes: 2,
    description: "A quick 2-minute social-emotional check-in to track classroom climate.",
    objective: "Students will name one feeling and one thing helping them today.",
    prompts: [
      p("How are you feeling today?"),
      p("What is one thing helping you feel ready to learn?"),
      p("What is one thing you might need help with?"),
    ],
  },
  {
    id: "teacher-lesson-reflection",
    title: "Teacher Lesson Reflection",
    category: "Teacher Reflection",
    gradeBands: ["professional"],
    focus: "metacognition",
    estimatedMinutes: 5,
    description: "For educators — reflect on a lesson and adjust for next time.",
    objective: "Teachers will reflect on a lesson and identify one adjustment.",
    prompts: [
      p("What part of the lesson helped students learn the most?"),
      p("Where did students struggle, and what did you notice?"),
      p("What is one specific adjustment you'll make next time?"),
    ],
  },
  {
    id: "assessment-prep",
    title: "Assessment Preparation Reflection",
    category: "Executive Functioning",
    gradeBands: ["6-8", "9-12"],
    focus: "metacognition",
    estimatedMinutes: 5,
    description: "Help students connect their preparation to outcomes.",
    objective: "Students will reflect on how their preparation affected performance.",
    prompts: [
      p("How did you prepare for this assessment?"),
      p("What helped you most during your preparation?"),
      p("What will you do differently to prepare for the next one?"),
    ],
  },
  {
    id: "stem-design-checkin",
    title: "STEM Design Check-In",
    category: "STEM / Design Thinking",
    gradeBands: ["3-5", "6-8", "9-12"],
    focus: "design-thinking",
    estimatedMinutes: 5,
    description: "After a build or prototype, reflect on design decisions.",
    objective: "Students will explain why they made their design choices and what they'd refine.",
    prompts: [
      p("What did you build, and who is it for?"),
      p("What design choice are you most confident about?"),
      p("What is one thing you'd test or improve next?"),
    ],
  },
  {
    id: "debate-reflection",
    title: "Debate Reflection",
    category: "Debate / Discussion",
    gradeBands: ["6-8", "9-12"],
    focus: "critical-thinking",
    estimatedMinutes: 5,
    description: "After a debate or Socratic seminar, reflect on evidence and reasoning.",
    objective: "Students will reflect on how they used evidence in their argument.",
    prompts: [
      p("What was your strongest piece of evidence?"),
      p("What argument from someone else made you reconsider?"),
      p("What would you change about your argument next time?"),
    ],
  },
  {
    id: "ai-ethics",
    title: "AI Ethics Reflection",
    category: "AI Literacy",
    gradeBands: ["9-12", "higher-ed", "adult", "professional"],
    focus: "ethical-reasoning",
    estimatedMinutes: 6,
    description: "Build AI literacy by reflecting on how AI feedback compares to your own thinking.",
    objective: "Learners will reflect on AI feedback and decide what to keep, push back on, or revise.",
    prompts: [
      p("Where does the AI feedback feel useful — and where does it miss something?"),
      p("What is one thing you'd want a teacher or peer to weigh in on?"),
      p("What is one action you'll take based on your own judgment, not the AI's?"),
    ],
  },
];

export function getTemplate(id: string) {
  return ACTIVITY_TEMPLATES.find((t) => t.id === id);
}
