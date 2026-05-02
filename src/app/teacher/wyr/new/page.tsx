"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Zap } from "lucide-react";

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
    <main className="min-h-screen bg-slate-50 text-slate-900 px-5 py-6 md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/teacher"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 shadow-sm"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            <h1 className="text-xs font-black tracking-[0.4em] uppercase text-slate-400 hidden sm:block">
              Classroom Reasoner
            </h1>
          </div>
        </header>

        <section className="flex-grow flex flex-col items-center justify-center max-w-4xl mx-auto w-full gap-10 mt-16 pb-12">
          {!options ? (
            <div className="w-full bg-white rounded-[3.5rem] p-10 sm:p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] border border-slate-100">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-8 text-center">Quick-Fire Lesson Starter</h2>
              <form onSubmit={generateOptions} className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-500">Grade Level</span>
                    <select value={grade} onChange={e => setGrade(e.target.value)} className="mt-1 w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold">
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-500">Subject</span>
                    <select value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold">
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-bold text-slate-500">What topic are you teaching today?</span>
                  <input required value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Fractions, The Water Cycle, The American Revolution..." className="mt-1 w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold text-lg" />
                </label>

                {error && <p className="font-bold text-red-500">{error}</p>}
                
                <button
                  type="submit"
                  disabled={generating || !topic.trim()}
                  className="mt-4 bg-[#9b51e0] text-white px-8 py-4 rounded-full font-black text-lg shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? "Brainstorming scenarios..." : "Generate Options"}
                  <Sparkles size={20} />
                </button>
              </form>
            </div>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-slate-900">Select a question</h2>
                <button onClick={() => setOptions(null)} className="text-sm font-bold text-slate-500 hover:text-slate-900">Start Over</button>
              </div>
              <div className="grid gap-6">
                {options.map((q, idx) => (
                  <div key={idx} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-6 items-center">
                    <div className="flex-1">
                      <span className="inline-block bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4">{q.vibe}</span>
                      <p className="text-xl font-bold mb-2">Option A: {q.optionA}</p>
                      <p className="text-xl font-bold">Option B: {q.optionB}</p>
                    </div>
                    <button
                      onClick={() => launchSession(q)}
                      disabled={launching}
                      className="whitespace-nowrap bg-slate-900 text-white px-8 py-4 rounded-full font-black shadow-lg hover:bg-[#04c6c5] hover:text-black hover:-translate-y-1 transition-all disabled:opacity-50"
                    >
                      {launching ? "Launching..." : "Present to Class"}
                    </button>
                  </div>
                ))}
              </div>
              {error && <p className="mt-4 font-bold text-red-500 text-center">{error}</p>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
