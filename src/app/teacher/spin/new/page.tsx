"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Brain, ChevronDown, Quote, RefreshCcw, Sparkles, Users } from "lucide-react";

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
  { id: 'k1', label: 'Grades K-1', color: 'bg-emerald-500' },
  { id: '25', label: 'Grades 2-5', color: 'bg-amber-500' },
  { id: '68', label: 'Grades 6-8', color: 'bg-blue-500' },
  { id: '912', label: 'Grades 9-12', color: 'bg-purple-500' }
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

  const activeGradeData = GRADES.find(g => g.id === grade)!;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 relative overflow-hidden flex flex-col px-5 py-6 md:px-8">
      {/* Background Decor */}
      <div className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] bg-blue-100/50 rounded-full blur-[100px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[40vw] h-[40vw] bg-indigo-100/50 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/teacher"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/60 backdrop-blur-md px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-white shadow-sm"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h1 className="text-xs font-black tracking-[0.4em] uppercase text-slate-400 hidden sm:block">
              Reflection Generator
            </h1>
          </div>
          
          <div className="relative">
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as keyof typeof QUESTION_BANK)}
              className="appearance-none bg-white/60 backdrop-blur-md border border-slate-200 pl-6 pr-12 py-3 rounded-full text-sm font-bold text-slate-600 cursor-pointer hover:bg-white transition-all focus:outline-none focus:ring-4 focus:ring-indigo-100 shadow-sm"
            >
              {GRADES.map(g => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </header>

        <section className="flex-grow flex flex-col items-center justify-center max-w-4xl mx-auto w-full gap-10 mt-16 pb-12">
          {/* Category Selection */}
          <div className="flex flex-wrap justify-center gap-3 z-10">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id as typeof category)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 -translate-y-1" 
                      : "bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Question Card */}
          <div className="w-full bg-white rounded-[3.5rem] p-12 sm:p-24 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] relative overflow-hidden border border-slate-100 text-center min-h-[300px] flex items-center justify-center">
            {/* Subtle Decorative Icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 text-slate-50 pointer-events-none">
              <Quote className="w-64 h-64" />
            </div>
            
            <div className={`relative z-10 transition-all duration-500 ease-out ${isSpinning ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100'}`}>
              <div className="mb-8">
                <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors duration-300 ${activeGradeData.color}`}>
                  {activeGradeData.label}
                </span>
              </div>
              
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
                {question}
              </h2>
            </div>
          </div>

          {error && <p className="font-black text-[#fd4401]">{error}</p>}

          {/* Actions */}
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={spin}
                disabled={isSpinning}
                className="group bg-slate-900 text-white px-8 py-5 rounded-full font-black text-lg shadow-2xl hover:bg-indigo-600 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
              >
                <RefreshCcw className={`w-5 h-5 transition-transform duration-700 ${isSpinning ? 'animate-spin' : ''}`} />
                Spin Again
              </button>
              
              {hasSpun && !isSpinning && (
                <button
                  onClick={launchSession}
                  disabled={launching}
                  className="group bg-[#04c6c5] text-black px-8 py-5 rounded-full font-black text-lg shadow-2xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                >
                  <Sparkles className="w-5 h-5" />
                  {launching ? "Launching..." : "Launch this Reflection"}
                </button>
              )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2">
              Press Space to spin
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
