"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Brain, Check, RefreshCcw, Sparkles, Users } from "lucide-react";

const QUESTION_BANK = {
  "k1": {
    general: [
      "What was the most fun part?", 
      "What was hard for you today?", 
      "Who helped you today?",
      "What made you smile today?",
      "What color describes your day?",
      "What are you excited for tomorrow?"
    ],
    academic: [
      "What did you make today?", 
      "What is one thing you learned?", 
      "Was this easy or hard?",
      "Show me something you wrote or drew.",
      "Did you listen well today?",
      "What book did you enjoy?"
    ],
    social: [
      "Did you share with a friend?", 
      "Who was kind to you today?", 
      "How did you help someone?",
      "Did you say 'thank you' to anyone?",
      "Who did you play with at recess?",
      "Did you use kind words today?"
    ],
    growth: [
      "Did you try your best?", 
      "What do you want to try again?", 
      "How did you feel when it was hard?",
      "Did you keep trying when you got stuck?",
      "Are you proud of your work?",
      "What made your brain grow today?"
    ]
  },
  "25": {
    general: [
      "What is one thing you did really well?", 
      "What part was confusing at first?", 
      "What would you change next time?",
      "Describe your day in one word.",
      "What was the most boring part?",
      "What are you looking forward to tomorrow?"
    ],
    academic: [
      "What new word did you learn today?", 
      "What resources helped you the most?", 
      "Did you meet your goal?",
      "What strategy did you use to solve a problem?",
      "How do you know you learned the lesson?",
      "What distracted you the most today?"
    ],
    social: [
      "How did you help a classmate?", 
      "What did you learn from someone else?", 
      "Were you a good listener today?",
      "Did you include everyone in your group?",
      "How were you a leader today?",
      "Did you have to apologize for anything?"
    ],
    growth: [
      "What was your favorite mistake?", 
      "What did you do when you got stuck?", 
      "How much effort did you put in (1-10)?",
      "What was a 'hard' thing that is now 'easy'?",
      "Did you ask for help when you needed it?",
      "What specific goal are you working on?"
    ]
  },
  "68": {
    general: [
      "How does this connect to what we learned before?", 
      "What surprised you the most?", 
      "What questions do you still have?",
      "What energy did you bring to class today?",
      "What felt like a waste of time today?",
      "What inspired you today?"
    ],
    academic: [
      "Identify one area where you need more practice.", 
      "How would you explain this to a younger student?", 
      "What specific evidence supports your idea?",
      "Connect today's lesson to real life.",
      "What was the main argument or theme?",
      "How did you organize your notes today?"
    ],
    social: [
      "What role did you play in your group today?", 
      "How did you handle a difference of opinion?", 
      "Whose perspective helped you today?",
      "Did you judge someone or something too quickly?",
      "How did you support a peer's idea?",
      "Was your communication clear and respectful?"
    ],
    growth: [
      "When did you feel frustrated, and how did you handle it?", 
      "What creates the biggest distraction for you?", 
      "What advice would you give your 'past self' for this task?",
      "Did you take a risk today?",
      "How did you handle pressure or deadlines?",
      "What habit do you need to break to improve?"
    ]
  },
  "912": {
    general: [
      "How has your thinking on this topic changed?", 
      "How can you apply this skill in a different context?", 
      "What part of the process did you undervalue?",
      "What perspective did you challenge today?",
      "What is a major 'takeaway' for your future?",
      "Analyze your productivity levels today."
    ],
    academic: [
      "Assess your time management: efficient or distracted?", 
      "How did personal bias affect your work?", 
      "What information is still missing?",
      "Critique the source material or method.",
      "What determines the validity of this idea?",
      "Synthesize two separate things you learned today."
    ],
    social: [
      "How did you contribute to the learning of others?", 
      "Evaluate the collaborative dynamics of your team.", 
      "How did you lead or support others today?",
      "How did you network or build a relationship?",
      "Did you advocate for yourself effectively?",
      "How did you navigate a conflict or disagreement?"
    ],
    growth: [
      "What was the 'tipping point' where this made sense?", 
      "In what ways did you challenge your own comfort zone?", 
      "If you were the teacher, how would you grade your effort?",
      "Where is your 'growth edge' right now?",
      "How are you balancing stress and work?",
      "Define what success looked like for this task."
    ]
  }
};

const GRADES = [
  { id: 'k1', label: 'Grades K-1' },
  { id: '25', label: 'Grades 2-5' },
  { id: '68', label: 'Grades 6-8' },
  { id: '912', label: 'Grades 9-12' }
];

const CATEGORIES = [
  { id: 'general', label: 'General', icon: Sparkles },
  { id: 'academic', label: 'Academic', icon: BookOpen },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'growth', label: 'Growth', icon: Brain }
];

export default function SpinPage() {
  const router = useRouter();
  const [grade, setGrade] = useState<keyof typeof QUESTION_BANK>("25");
  const [category, setCategory] = useState<"general" | "academic" | "social" | "growth">("general");
  const [question, setQuestion] = useState("Loading...");
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setHasSpun(true);
    setError("");

    setTimeout(() => {
      const pool = QUESTION_BANK[grade][category];
      const newQuestion = pool[Math.floor(Math.random() * pool.length)];
      setQuestion(newQuestion);
      setIsSpinning(false);
    }, 400);
  };

  useEffect(() => {
    spin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, category]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.key === ' ') && !isSpinning && document.activeElement?.tagName !== 'BUTTON') {
        e.preventDefault();
        spin();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSpinning]);

  async function launchSession() {
    setLaunching(true);
    setError("");
    const gradeLabel = GRADES.find(g => g.id === grade)?.label || "Grade";
    
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routineId: "quick-spin",
        title: "Quick Spin Reflection",
        gradeBand: gradeLabel,
        learningTarget: `A ${category} reflection for ${gradeLabel}`,
        exitTicketQuestion: question,
        exitTicketContext: `The teacher spun a random question from the ${category} category for ${gradeLabel}.`,
        exitTicketMaxTurns: 2,
        config: {
          voiceMinimumSeconds: 5,
        },
      }),
    });
    
    const data = await response.json();
    setLaunching(false);

    if (!response.ok) {
      setError(data.error ?? "Could not launch this reflection.");
      return;
    }

    router.push(`/teacher/session/${data.session.id}/live`);
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
          <button
            onClick={async () => {
              const { getFirebaseClientServices } = await import("@/lib/firebase/client");
              const { signOut } = await import("firebase/auth");
              const { auth } = getFirebaseClientServices();
              if (auth) {
                await signOut(auth);
              }
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/teacher");
            }}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-5 py-2 text-sm font-bold text-black transition hover:-translate-y-0.5"
          >
            Sign out
          </button>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h1 className="display-type max-w-3xl text-[4.8rem] font-bold leading-[0.84] md:text-[7.2rem]">
              Spin.
              <br />
              Reflect.
              <br />
              Discuss.
            </h1>
            <p className="mt-8 max-w-2xl text-2xl font-semibold leading-8">
              Pick a grade band and category, spin for a random question,
              then launch it to your class in one tap.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-black uppercase tracking-[0.08em]">
                  Grade band
                </span>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as keyof typeof QUESTION_BANK)}
                  className="focus-ring rounded-[24px] border-2 border-black bg-white px-5 py-4 text-xl font-black"
                >
                  {GRADES.map(g => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isActive = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id as typeof category)}
                    className={`focus-ring inline-flex items-center gap-2 rounded-full border-2 border-black px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 ${
                      isActive
                        ? "bg-[#006cff] text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    <Icon size={16} />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-6 text-sm font-black uppercase tracking-[0.08em] text-black/50">
              Press Space to spin
            </p>
          </div>

          <div className="panel grid gap-5 p-6 md:p-8">
            <div className="rounded-[24px] border-2 border-black bg-[#fff2b7] p-8 text-center min-h-[280px] flex flex-col items-center justify-center">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-black/50 mb-4">
                {GRADES.find(g => g.id === grade)?.label} · {category}
              </p>
              <div className={`transition-all duration-500 ease-out ${isSpinning ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100'}`}>
                <h2 className="display-type text-4xl sm:text-5xl font-bold leading-[0.9]">
                  {question}
                </h2>
              </div>
            </div>

            {error ? <p className="font-black text-[#fd4401]">{error}</p> : null}

            <div className="grid gap-3 md:grid-cols-2">
              <button
                onClick={spin}
                disabled={isSpinning}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#006cff] px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                <RefreshCcw size={20} className={isSpinning ? 'animate-spin' : ''} />
                Spin again
              </button>

              {hasSpun && !isSpinning ? (
                <button
                  onClick={launchSession}
                  disabled={launching}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#fd4401] px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <Check size={20} />
                  {launching ? "Launching..." : "Launch this question"}
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
