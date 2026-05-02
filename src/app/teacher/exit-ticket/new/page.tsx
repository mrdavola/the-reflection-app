"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, Sparkles, Wand2 } from "lucide-react";
import {
  GRADE_OPTIONS,
  resolveTeacherOption,
  SUBJECT_OPTIONS,
} from "@/lib/teacher-options";

export default function NewExitTicketPage() {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState("General Education");
  const [customSubject, setCustomSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("Grade 4");
  const [customGrade, setCustomGrade] = useState("");
  const [lessonContext, setLessonContext] = useState("");
  const [question, setQuestion] = useState("");
  const [rationale, setRationale] = useState("");
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");
  const subject = resolveTeacherOption(
    selectedSubject,
    customSubject,
    "General Education",
  );
  const gradeBand = resolveTeacherOption(selectedGrade, customGrade, "Grade 4");

  async function generateQuestion() {
    setError("");
    setLoadingDraft(true);
    const response = await fetch("/api/exit-ticket/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, gradeBand, lessonContext }),
    });
    const data = await response.json();
    setLoadingDraft(false);

    if (!response.ok) {
      setError(data.error ?? "Could not generate a question.");
      return;
    }

    setQuestion(data.draft.question);
    setRationale(data.draft.rationale);
  }

  async function launchSession() {
    setError("");
    setLaunching(true);
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routineId: "exit-ticket-conversation",
        title: `${subject} Exit Ticket`,
        learningTarget: lessonContext,
        gradeBand,
        exitTicketQuestion: question,
        exitTicketContext: `${gradeBand} ${subject}: ${lessonContext}`,
        exitTicketMaxTurns: 4,
      }),
    });
    const data = await response.json();
    setLaunching(false);

    if (!response.ok) {
      setError(data.error ?? "Could not launch this exit ticket.");
      return;
    }

    router.push(`/teacher/session/${data.session.id}/live`);
  }

  return (
    <main className="min-h-screen bg-[#fdcb40] px-5 py-6 text-black md:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/teacher"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-5 py-3 text-sm font-bold text-black transition hover:-translate-y-0.5"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-bold">
              <Sparkles size={16} className="text-[#006cff]" />
              AI drafts, teacher approves
            </div>
            <h1 className="display-type max-w-3xl text-[4.8rem] font-bold leading-[0.84] md:text-[7.2rem]">
              One question.
              <br />
              Three follow-ups.
              <br />
              Real thinking.
            </h1>
            <p className="mt-8 max-w-2xl text-2xl font-semibold leading-8">
              Describe what you taught. ReflectAI drafts one exit ticket
              question. You approve it before students ever see it.
            </p>
          </div>

          <div className="panel grid gap-5 p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-black uppercase tracking-[0.08em]">
                  Subject
                </span>
                <select
                  value={selectedSubject}
                  onChange={(event) => {
                    setSelectedSubject(event.target.value);
                    setQuestion("");
                    setRationale("");
                  }}
                  className="focus-ring rounded-[24px] border-2 border-black bg-[#fff2b7] px-5 py-4 text-xl font-black"
                >
                  {SUBJECT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black uppercase tracking-[0.08em]">
                  Grade
                </span>
                <select
                  value={selectedGrade}
                  onChange={(event) => {
                    setSelectedGrade(event.target.value);
                    setQuestion("");
                    setRationale("");
                  }}
                  className="focus-ring rounded-[24px] border-2 border-black bg-white px-5 py-4 text-xl font-black"
                >
                  {GRADE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {(selectedSubject === "Other" || selectedGrade === "Other") ? (
              <div className="grid gap-4 md:grid-cols-2">
                {selectedSubject === "Other" ? (
                  <label className="grid gap-2">
                    <span className="text-sm font-black uppercase tracking-[0.08em]">
                      Type subject
                    </span>
                    <input
                      value={customSubject}
                      onChange={(event) => {
                        setCustomSubject(event.target.value);
                        setQuestion("");
                        setRationale("");
                      }}
                      placeholder="Example: Engineering"
                      className="focus-ring rounded-[24px] border-2 border-black bg-[#fff2b7] px-5 py-4 text-xl font-black placeholder:text-black/40"
                    />
                  </label>
                ) : (
                  <div />
                )}
                {selectedGrade === "Other" ? (
                  <label className="grid gap-2">
                    <span className="text-sm font-black uppercase tracking-[0.08em]">
                      Type grade
                    </span>
                    <input
                      value={customGrade}
                      onChange={(event) => {
                        setCustomGrade(event.target.value);
                        setQuestion("");
                        setRationale("");
                      }}
                      placeholder="Example: Grade 2"
                      className="focus-ring rounded-[24px] border-2 border-black bg-white px-5 py-4 text-xl font-black placeholder:text-black/40"
                    />
                  </label>
                ) : null}
              </div>
            ) : null}

            <label className="grid gap-2">
              <span className="text-sm font-black uppercase tracking-[0.08em]">
                What did you teach?
              </span>
              <textarea
                value={lessonContext}
                onChange={(event) => setLessonContext(event.target.value)}
                placeholder="Example: equivalent fractions using number lines and visual models"
                className="focus-ring min-h-36 rounded-[24px] border-2 border-black bg-white px-5 py-4 text-xl font-semibold leading-7 placeholder:text-black/40"
              />
            </label>

            <button
              onClick={generateQuestion}
              disabled={loadingDraft || lessonContext.trim().length < 8}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#006cff] px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Wand2 size={20} />
              {loadingDraft ? "Generating..." : "Generate question"}
            </button>

            <label className="grid gap-2">
              <span className="text-sm font-black uppercase tracking-[0.08em]">
                Approved reflection question
              </span>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Generate a question, then edit it if needed."
                className="focus-ring min-h-40 rounded-[24px] border-2 border-black bg-[#fff2b7] px-5 py-4 text-2xl font-black leading-8 placeholder:text-black/40"
              />
            </label>

            {rationale ? (
              <div className="rounded-[24px] border-2 border-black bg-[#04c6c5] p-5">
                <p className="text-sm font-black uppercase tracking-[0.08em]">
                  Why this works
                </p>
                <p className="mt-2 text-lg font-bold leading-7">{rationale}</p>
              </div>
            ) : null}

            {error ? <p className="font-black text-[#fd4401]">{error}</p> : null}

            <button
              onClick={launchSession}
              disabled={launching || question.trim().length < 12}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#fd4401] px-7 py-5 text-xl font-black text-white transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Check size={22} />
              {launching ? "Launching..." : "Approve and launch"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
