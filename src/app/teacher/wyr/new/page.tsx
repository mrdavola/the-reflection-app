"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { AccountMenu } from "../../account-menu";

const GRADES = ["K-2", "3-5", "6-8", "9-12"];
const SUBJECTS = ["Math", "ELA", "Science", "Social Studies", "SEL"];

type WyrQuestion = { vibe: string; optionA: string; optionB: string; };

export default function WyrSetupPage() {
  const router = useRouter();
  const [grade, setGrade] = useState(GRADES[0]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [topic, setTopic] = useState("");
  
  const [generating, setGenerating] = useState(false);
  const [options, setOptions] = useState<WyrQuestion[] | null>(null);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");

  async function generateOptions(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError("");
    setOptions(null);

    try {
      const response = await fetch("/api/wyr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeLevel: grade, subject, topic }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to generate.");
      setOptions(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function launchSession(question: WyrQuestion) {
    setLaunching(true);
    setError("");

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routineId: "would-you-rather",
          title: "Would You Rather",
          gradeBand: grade,
          learningTarget: `A ${question.vibe} "Would you rather" about ${topic}`,
          wyrOptions: { optionA: question.optionA, optionB: question.optionB },
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not launch this reflection.");

      router.push(`/teacher/session/${data.session.id}/live`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Launch failed.");
      setLaunching(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fdcb40] px-5 py-6 text-black md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/teacher"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-5 py-3 text-sm font-bold text-black transition hover:-translate-y-0.5"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          <AccountMenu
            onSignOut={async () => {
              const { getFirebaseClientServices } = await import("@/lib/firebase/client");
              const { signOut } = await import("firebase/auth");
              const { auth } = getFirebaseClientServices();
              if (auth) {
                await signOut(auth);
              }
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/teacher");
            }}
          />
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h1 className="display-type max-w-3xl text-[4.8rem] font-bold leading-[0.84] md:text-[7.2rem]">
              Would you
              <br />
              rather?
            </h1>
            <p className="mt-8 max-w-2xl text-2xl font-semibold leading-8">
              Describe what you&apos;re teaching. ReflectAI generates three
              curriculum-aligned scenarios. Pick one and launch it.
            </p>
          </div>

          {!options ? (
            <div className="panel grid gap-5 p-6 md:p-8">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-black uppercase tracking-[0.08em]">
                    Grade level
                  </span>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="focus-ring rounded-[24px] border-2 border-black bg-[#fff2b7] px-5 py-4 text-xl font-black"
                  >
                    {GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-black uppercase tracking-[0.08em]">
                    Subject
                  </span>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="focus-ring rounded-[24px] border-2 border-black bg-white px-5 py-4 text-xl font-black"
                  >
                    {SUBJECTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-black uppercase tracking-[0.08em]">
                  What topic are you teaching?
                </span>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Example: equivalent fractions, the water cycle, the American Revolution..."
                  className="focus-ring min-h-36 rounded-[24px] border-2 border-black bg-white px-5 py-4 text-xl font-semibold leading-7 placeholder:text-black/40"
                />
              </label>

              {error ? <p className="font-black text-[#fd4401]">{error}</p> : null}

              <button
                onClick={generateOptions}
                disabled={generating || !topic.trim()}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#9b51e0] px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                <Sparkles size={20} />
                {generating ? "Brainstorming scenarios..." : "Generate scenarios"}
              </button>
            </div>
          ) : (
            <div className="grid gap-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-[0.08em]">
                  Pick a scenario to launch
                </p>
                <button
                  onClick={() => setOptions(null)}
                  className="focus-ring rounded-full border-2 border-black bg-white px-5 py-2 text-sm font-bold transition hover:-translate-y-0.5"
                >
                  Start over
                </button>
              </div>

              {options.map((q, idx) => (
                <div
                  key={idx}
                  className="panel grid gap-4 p-6 md:p-8"
                >
                  <div className="rounded-[24px] border-2 border-black bg-[#9b51e0] px-4 py-2 text-sm font-black uppercase tracking-[0.08em] text-white w-fit">
                    {q.vibe}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[24px] border-2 border-black bg-[#fff2b7] p-5">
                      <p className="text-sm font-black uppercase tracking-[0.08em] text-black/50">Option A</p>
                      <p className="display-type mt-2 text-2xl font-bold leading-tight">{q.optionA}</p>
                    </div>
                    <div className="rounded-[24px] border-2 border-black bg-white p-5">
                      <p className="text-sm font-black uppercase tracking-[0.08em] text-black/50">Option B</p>
                      <p className="display-type mt-2 text-2xl font-bold leading-tight">{q.optionB}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => launchSession(q)}
                    disabled={launching}
                    className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#fd4401] px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <Check size={20} />
                    {launching ? "Launching..." : "Launch this scenario"}
                  </button>
                </div>
              ))}

              {error ? <p className="font-black text-[#fd4401]">{error}</p> : null}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
