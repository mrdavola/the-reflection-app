"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { store } from "@/lib/storage";
import { mockAnalysis } from "@/lib/ai/mock";
import { getTemplate } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import type {
  Activity,
  ActivityPrompt,
  PromptResponse,
  Reflection,
} from "@/lib/types";

interface DemoStudent {
  name: string;
  responses: string[];
}

const DEMO_STUDENTS: DemoStudent[] = [
  {
    // sunny / level 4 — long, growth-oriented, evidence-based, planning
    name: "Aaliyah Chen",
    responses: [
      "The peer-reviewed article from the university library helped me the most because it had data tables I could compare against the news source I started with. For example, the article showed that the survey sample size was 2,400 students across 14 schools, while the news article never said where its numbers came from. That contrast made me realize my first source was thinner than I thought.",
      "I decided my information was reliable when I could trace it back to a primary source — like an actual study, an interview, or a dataset — rather than a summary of a summary. I learned that the publication date matters too, because three of the sources I almost used were from before the policy change in 2022, which would have made my argument out of date.",
      "I still need to investigate whether the trend I'm seeing in my main source holds up in the other regions in the dataset. My next step is to filter the data by region tomorrow morning and see if my claim still works. If it does, I'll keep going; if not, I'll narrow my thesis to one region. I want to keep going on this because I learned a lot.",
    ],
  },
  {
    // orange / level 2 — short, struggle signals, surface-level
    name: "Marcus Johnson",
    responses: [
      "A website I found. I'm not really sure though.",
      "I got confused. Some parts were hard to follow.",
      "I'm stuck on what to do next. It feels overwhelming.",
    ],
  },
  {
    // blue / level 1 — very short, low engagement
    name: "Priya Patel",
    responses: [
      "Wikipedia.",
      "It looked fine.",
      "I don't know.",
    ],
  },
];

export function SeedDemoData() {
  const [loading, setLoading] = useState(false);

  function handleSeed() {
    setLoading(true);
    try {
      const owner = store.ensureUser();

      // 1) Create the group
      const group = store.createGroup({
        name: "Grade 8 Research Writing",
        ownerId: owner.id,
        gradeBand: "6-8",
        accessType: "name-only",
        language: "en",
        recordingMode: "audio-or-text",
        greetingEnabled: true,
      });

      // 2) Create the activity from the research-process template
      const template = getTemplate("research-process");
      if (!template) throw new Error("Template not found");

      const prompts: ActivityPrompt[] = template.prompts.map((p, i) => ({
        id: `${template.id}-${i}`,
        text: p.text,
        source: p.source,
      }));

      const activityInput: Omit<Activity, "id" | "createdAt" | "shareCode"> = {
        groupId: group.id,
        title: template.title,
        objective: template.objective,
        focus: template.focus,
        language: "en",
        prompts,
        promptMode: "all-teacher",
        timingPerPromptSeconds: 0,
        minimumSpeakingSeconds: 15,
        recordingMode: "audio-or-text",
        workspaceEnabled: false,
        workspaceSteps: [],
        feedbackVisibility: "show",
        scoreVisibility: "show",
        status: "assigned",
        assignedAt: new Date().toISOString(),
      };
      const activity = store.createActivity(activityInput);

      // 3) Create participants and reflections
      for (const demo of DEMO_STUDENTS) {
        const participant = store.ensureParticipant(group.id, demo.name, false);

        const responses: PromptResponse[] = demo.responses.map((text, i) => ({
          promptId: prompts[i]?.id ?? `${template.id}-${i}`,
          promptText: prompts[i]?.text ?? "",
          inputType: "text",
          text,
          createdAt: new Date().toISOString(),
        }));

        const analysis = mockAnalysis({
          objective: activity.objective,
          responses: responses.map((r) => ({
            promptText: r.promptText,
            text: r.text,
          })),
          gradeBand: group.gradeBand,
        });

        const reflection: Omit<Reflection, "id" | "createdAt"> = {
          activityId: activity.id,
          groupId: group.id,
          participantId: participant.id,
          participantName: participant.name,
          ownerUserId: owner.id,
          objective: activity.objective,
          focus: activity.focus,
          responses,
          analysis,
          feedbackVisibility: activity.feedbackVisibility,
          scoreVisibility: activity.scoreVisibility,
          completedAt: new Date().toISOString(),
        };
        store.createReflection(reflection);
      }

      toast.success("Demo data created");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't seed demo data. Try again?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="soft" size="sm" onClick={handleSeed} disabled={loading}>
      <Sparkles className="h-4 w-4" />
      {loading ? "Loading demo data…" : "Load demo data"}
    </Button>
  );
}
