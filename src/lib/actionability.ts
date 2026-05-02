import type { DashboardPayload, Reflection } from "./models";

export type TeacherNextMove = {
  title: string;
  action: string;
  detail: string;
  tone: "setup" | "watch" | "teach" | "urgent";
};

export type PriorityCard = {
  id: string;
  kind: "urgent" | "support" | "celebrate" | "peer-match";
  title: string;
  evidence: string;
  action: string;
  studentName: string;
};

export function getTeacherNextMove(dashboard: DashboardPayload): TeacherNextMove {
  const urgentAlert = dashboard.alerts.find((alert) => alert.severity === "red");
  if (urgentAlert) {
    return {
      title: "Review safety alert",
      action: `Open ${urgentAlert.displayName}'s transcript before continuing instruction.`,
      detail: urgentAlert.message,
      tone: "urgent",
    };
  }

  if (dashboard.session.joinedCount === 0) {
    return {
      title: "Project the join code",
      action: `Ask students to go to the join page and enter ${dashboard.session.joinCode}.`,
      detail: "Keep this screen projected until most students are in.",
      tone: "setup",
    };
  }

  const completionRate =
    dashboard.session.doneCount / Math.max(dashboard.session.joinedCount, 1);
  if (completionRate < 0.75) {
    return {
      title: "Let the room finish",
      action: "Give students another minute and watch for short responses.",
      detail: `${dashboard.session.doneCount} of ${dashboard.session.joinedCount} students are complete.`,
      tone: "watch",
    };
  }

  const lowDepth = dashboard.reflections.find(
    (reflection) => reflection.completedAt && getReflectionScore(reflection) <= 2,
  );
  if (lowDepth) {
    return {
      title: "Push one layer deeper",
      action: `Ask: “What makes you say that?” and invite ${lowDepth.displayName} or a similar response to add evidence.`,
      detail: "The class has enough responses for a quick whole-group reasoning move.",
      tone: "teach",
    };
  }

  const strongQuote = findStrongQuote(dashboard.reflections);
  if (strongQuote) {
    return {
      title: "Use a student quote",
      action: `Read ${strongQuote.displayName}'s quote and ask the class what makes it strong.`,
      detail: strongQuote.quote,
      tone: "teach",
    };
  }

  return {
    title: "Generate the class summary",
    action: "Use the summary to choose one misconception and one student quote to discuss.",
    detail: "The dashboard is ready for a closing move.",
    tone: "teach",
  };
}

export function getPriorityCards(dashboard: DashboardPayload): PriorityCard[] {
  const alertCards = dashboard.alerts.map((alert) => ({
    id: alert.id,
    kind: alert.severity === "red" ? "urgent" : "support",
    title: `${alert.displayName}: ${alert.title}`,
    evidence: alert.message,
    action:
      alert.severity === "red"
        ? "Review now before responding to the student."
        : "Check the transcript when students are working independently.",
    studentName: alert.displayName,
  })) satisfies PriorityCard[];

  const completed = dashboard.reflections.filter((reflection) => reflection.completedAt);
  const supportCards = completed
    .filter((reflection) => getReflectionScore(reflection) <= 2)
    .slice(0, 3)
    .map((reflection) => ({
      id: `${reflection.id}-support`,
      kind: "support" as const,
      title: `${reflection.displayName} needs a reasoning nudge`,
      evidence: getBestEvidence(reflection),
      action: "Ask for one example, detail, or piece of evidence.",
      studentName: reflection.displayName,
    }));

  const celebrateCards = completed
    .filter((reflection) => getReflectionScore(reflection) >= 3)
    .slice(0, 3)
    .map((reflection) => ({
      id: `${reflection.id}-celebrate`,
      kind: "celebrate" as const,
      title: `${reflection.displayName} has a shareable quote`,
      evidence: getBestEvidence(reflection),
      action: "Use this as a model for evidence-backed reflection.",
      studentName: reflection.displayName,
    }));

  const peerMatchCards: PriorityCard[] = [];
  const allClusters = dashboard.session.classThinkingMap ? Object.values(dashboard.session.classThinkingMap).flat() : [];
  const similarityCluster = allClusters.find((c) => c.studentIds.length >= 2);
  if (similarityCluster) {
    const student1 = dashboard.participants.find((p) => p.id === similarityCluster.studentIds[0]);
    const student2 = dashboard.participants.find((p) => p.id === similarityCluster.studentIds[1]);
    if (student1 && student2) {
      peerMatchCards.push({
        id: `peer-match-${similarityCluster.label.replace(/\s+/g, '-')}`,
        kind: "peer-match",
        title: `Peer Match: ${student1.displayName} & ${student2.displayName}`,
        evidence: `Both noticed: ${similarityCluster.label}`,
        action: "Have them discuss their shared thoughts for 2 minutes.",
        studentName: student1.displayName,
      });
    }
  }

  return [...alertCards, ...peerMatchCards, ...supportCards, ...celebrateCards].slice(0, 6);
}

function getReflectionScore(reflection: Reflection) {
  if (reflection.overallAnalysis?.overallDepthScore) {
    return reflection.overallAnalysis.overallDepthScore;
  }

  const scores = reflection.steps
    .map((step) => step.rating ?? step.depthScore)
    .filter((score): score is number => typeof score === "number");
  if (scores.length === 0) return 1;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function getBestEvidence(reflection: Reflection) {
  const quote =
    reflection.overallAnalysis?.keyQuotes[0] ??
    reflection.steps.find((step) => step.directQuote)?.directQuote ??
    reflection.steps.find((step) => step.transcription)?.transcription ??
    "No quote captured yet.";

  return quote.length > 150 ? `${quote.slice(0, 147)}...` : quote;
}

function findStrongQuote(reflections: Reflection[]) {
  const reflection = reflections.find(
    (item) => item.completedAt && getReflectionScore(item) >= 3,
  );
  if (!reflection) return null;

  return {
    displayName: reflection.displayName,
    quote: getBestEvidence(reflection),
  };
}
