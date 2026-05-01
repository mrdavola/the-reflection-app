// Domain types for The Reflection App — derived from spec sections 32 & 38–40.

export type GradeBand =
  | "k-2"
  | "3-5"
  | "6-8"
  | "9-12"
  | "higher-ed"
  | "adult"
  | "professional";

export type FocusId =
  | "retrieval"
  | "understanding"
  | "critical-thinking"
  | "problem-solving"
  | "creative-booster"
  | "self-authorship"
  | "growth-mindset"
  | "collaboration"
  | "communication"
  | "goal-setting"
  | "metacognition"
  | "writing-support"
  | "research-thinking"
  | "design-thinking"
  | "ethical-reasoning"
  | "emotional-awareness";

export type AccessType =
  | "full"
  | "limited"
  | "name-only"
  | "anonymous";

export type RecordingMode = "audio-only" | "audio-or-text" | "text-only" | "audio-video";

export type ActivityStatus = "draft" | "assigned" | "archived";

export type InputType = "audio" | "text";

export type ScoreColor = "sunny" | "orange" | "blue" | "rose";

export type Zone = "below" | "ideal" | "above" | "high" | "unclear";

export type Mindset =
  | "growth"
  | "neutral"
  | "fixed"
  | "curious"
  | "confident"
  | "uncertain"
  | "frustrated"
  | "overwhelmed"
  | "reflective";

export type Tone =
  | "constructive"
  | "neutral"
  | "motivated"
  | "excited"
  | "hesitant"
  | "frustrated"
  | "low-energy"
  | "confident"
  | "unclear";

export interface User {
  id: string;
  name: string;
  email?: string;
  role: "educator" | "personal";
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  gradeBand: GradeBand;
  accessType: AccessType;
  language: string;
  recordingMode: RecordingMode;
  greetingEnabled: boolean;
  createdAt: string;
  participantIds: string[];
  managerIds: string[];
}

export interface Participant {
  id: string;
  groupId: string;
  name: string;
  email?: string;
  anonymous: boolean;
  createdAt: string;
}

export interface ActivityPrompt {
  id: string;
  text: string;
  source: "ai" | "teacher";
  /** when an adaptive activity, this prompt is generated dynamically per student */
  adaptive?: boolean;
}

export interface WorkspaceStep {
  id: string;
  text: string;
}

export interface RubricCriterion {
  id: string;
  label: string; // e.g. "Uses evidence"
  description?: string; // optional 1-line description
}

export interface Rubric {
  enabled: boolean;
  criteria: RubricCriterion[]; // typically 3–6
}

export interface Activity {
  id: string;
  groupId: string;
  title: string;
  objective: string;
  focus: FocusId;
  language: string;
  prompts: ActivityPrompt[];
  promptMode: "all-ai" | "all-teacher" | "first-teacher-then-ai";
  timingPerPromptSeconds: number; // 0 = no limit
  minimumSpeakingSeconds: number; // 0 = no minimum
  recordingMode: RecordingMode;
  workspaceEnabled: boolean;
  workspaceSteps: WorkspaceStep[];
  feedbackVisibility: "show" | "hide" | "summary";
  scoreVisibility: "show" | "hide";
  status: ActivityStatus;
  shareCode: string;
  createdAt: string;
  assignedAt?: string;
  rubric?: Rubric;
  /** When true, students see a brief "weak vs strong" model before reflecting. */
  modelingEnabled?: boolean;
}

export interface PromptResponse {
  promptId: string;
  promptText: string;
  inputType: InputType;
  text: string;
  audioBlobUrl?: string;
  durationSeconds?: number;
  createdAt: string;
}

export interface ReflectionAnalysis {
  summary: string;
  feedback: string;
  strengthsNoticed: string[];
  suggestedNextStep: string;
  understandingScore: number;        // 0-100
  understandingLabel: "Emerging" | "Developing" | "Proficient" | "Advanced";
  reflectionLevel: 1 | 2 | 3 | 4;
  scoreColor: ScoreColor;
  zone: Zone;
  mindset: Mindset;
  mindsetSummary: string;
  tone: Tone;
  toneSummary: string;
  keyCognitiveSkills: string[];
  hiddenLesson: string;
  possibleCognitiveBias: { label: string; explanation: string };
  crossCurricularConnections: string[];
  studentQuotes: string[];
  teacherFollowUp: string;
  motivationSignal: "high" | "moderate" | "low" | "unclear";
  contentAlerts: { type: string; severity: "low" | "med" | "high"; excerpt: string }[];
  rubricResults?: { criterionId: string; level: 1 | 2 | 3 | 4; evidence: string }[];
}

export interface Reflection {
  id: string;
  activityId: string | null;          // null for personal reflections
  groupId: string | null;
  participantId: string | null;
  participantName: string;
  ownerUserId: string;
  objective: string;
  focus: FocusId;
  responses: PromptResponse[];
  analysis?: ReflectionAnalysis;
  createdAt: string;
  completedAt?: string;
  // student-facing controls
  feedbackVisibility: "show" | "hide" | "summary";
  scoreVisibility: "show" | "hide";
}

export interface GroupSummary {
  id: string;
  groupId: string;
  activityId: string | null;
  reflectionCount: number;
  understandingParagraph: string;
  teacherMovesParagraph: string;
  recommendedTeacherMoves: string[];
  commonStrengths: string[];
  commonStruggles: string[];
  studentsNeedingFollowUp: string[];
  studentsReadyForExtension: string[];
  generatedAt: string;
}

// ---------- Workshop / collaborative board (facilitator mode) ----------

export interface Workshop {
  id: string;
  title: string;
  joinCode: string;            // 6-char uppercase
  facilitatorUserId: string;
  boardId: string;             // FK to Board
  createdAt: string;
  status: "draft" | "live" | "ended";
}

export interface BoardNote {
  id: string;
  authorName: string;
  text: string;
  color: "yellow" | "blue" | "green" | "pink" | "purple";
  createdAt: string;
}

export interface Board {
  id: string;
  workshopId: string | null;
  title: string;
  prompt: string;              // the question shown above the board
  notes: BoardNote[];
  createdAt: string;
}
