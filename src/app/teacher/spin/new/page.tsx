"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Brain, Check, RefreshCcw, Sparkles, Users } from "lucide-react";
import { AccountMenu } from "../../account-menu";

const QUESTION_BANK = {
  "k1": {
    general: [
      "What was the most fun part?",
      "What was hard for you today?",
      "Who helped you today?",
      "What made you smile today?",
      "What color describes your day?",
      "What are you excited for tomorrow?",
      "What is something new you tried?",
      "What do you wish you had more time to do?",
      "What was the best thing that happened today?",
      "Did anything surprise you today?",
      "What is one thing you want to remember?",
      "What made you feel proud today?",
      "Did you have fun? What made it fun?",
      "What is something you saw today that you liked?",
      "If you could do today over, what would you do differently?",
      "What made you feel safe today?",
      "Did you feel happy or sad today? Why?",
      "What is something you want to share with your family?",
      "What is something you got to choose today?",
      "Did you like being at school today? Why?",
      "What do you wish your teacher knew about today?",
      "What would make tomorrow even better?",
      "What is your favorite part of the school day?",
      "Did anything feel hard or scary today?",
      "What is one thing you are looking forward to?"
    ],
    academic: [
      "What did you make today?",
      "What is one thing you learned?",
      "Was this easy or hard? Why?",
      "Show me something you wrote or drew.",
      "Did you listen well today?",
      "What book or story did you enjoy?",
      "What number feels hard for you right now?",
      "What letter or sound did you practice?",
      "What did your teacher teach you today?",
      "Can you draw what you learned?",
      "What did you read today?",
      "What math did you do today?",
      "Did you write any words today? Which ones?",
      "What do you still want to know more about?",
      "What tools did you use to learn today?",
      "What was the most interesting thing you saw or heard?",
      "Can you teach me something from today?",
      "What question are you still wondering about?",
      "What feels easier now than before?",
      "What did you figure out on your own today?",
      "What did your hands make or build today?",
      "What words did you hear a lot today?",
      "Did you learn something that surprised you?",
      "What do you want to practice again?",
      "What is something you want to get better at?"
    ],
    social: [
      "Did you share with a friend?",
      "Who was kind to you today?",
      "How did you help someone?",
      "Did you say 'thank you' to anyone?",
      "Who did you play with at recess?",
      "Did you use kind words today?",
      "Did someone make you feel happy? What did they do?",
      "Did you make a new friend today?",
      "Were you kind to everyone today?",
      "Did anyone feel left out today?",
      "What is something kind you did without being asked?",
      "Did you listen when a friend was talking?",
      "Did you and a friend disagree about something? What happened?",
      "Who in your class do you want to get to know better?",
      "How did you show you cared about someone today?",
      "Did you say sorry to anyone today?",
      "Who would you like to play with more?",
      "Did you take turns today?",
      "What is something nice you noticed about a classmate?",
      "Did you feel part of the group today?",
      "Did anyone help you today without you asking?",
      "Did you make someone feel better today?",
      "How do you think a friend felt today?",
      "How did you show respect today?",
      "Who made your day better?"
    ],
    growth: [
      "Did you try your best?",
      "What do you want to try again?",
      "How did you feel when it was hard?",
      "Did you keep trying when you got stuck?",
      "Are you proud of your work?",
      "What made your brain grow today?",
      "What is something you couldn't do before that you can do now?",
      "Did you give up or keep going?",
      "What would you do differently next time?",
      "Was there a moment you felt really brave?",
      "Did you ask for help today? Was that easy or hard?",
      "What is something you are getting better at?",
      "Did you make a mistake? What did you learn from it?",
      "What does 'trying your best' look like for you?",
      "What is something you want to practice more?",
      "Was there something you wanted to quit? Did you?",
      "Did you do something that was new for you?",
      "What is getting easier and easier for you?",
      "What do you want your teacher to help you with?",
      "Did you surprise yourself today?",
      "What is something you worked really hard on?",
      "What made you feel brave today?",
      "How did you take care of yourself today?",
      "What is something you are proud of?",
      "What do you want to get better at?"
    ]
  },
  "25": {
    general: [
      "What is one thing you did really well?",
      "What part was confusing at first?",
      "What would you change next time?",
      "Describe your day in one word.",
      "What was the most boring part?",
      "What are you looking forward to tomorrow?",
      "What is one thing you want to remember from today?",
      "What made today different from yesterday?",
      "What question kept coming back to you today?",
      "What do you wish had been explained differently?",
      "What moment are you most proud of today?",
      "Did anything go better than you expected?",
      "What took more energy than you thought it would?",
      "What is something you'd tell a friend about today?",
      "If you gave today a grade, what would it be and why?",
      "What question are you leaving with today?",
      "What was something unexpected that happened?",
      "What helped you focus today?",
      "What was your biggest win today?",
      "What were you most curious about today?",
      "What would you highlight from today if you could only pick one thing?",
      "What do you wish you'd done differently?",
      "Did anything happen today that you want to think more about?",
      "What made today feel worth showing up for?",
      "What is something you learned that you didn't expect to?"
    ],
    academic: [
      "What new word did you learn today?",
      "What resources helped you the most?",
      "Did you meet your goal?",
      "What strategy did you use to solve a problem?",
      "How do you know you understood the lesson?",
      "What distracted you from your work today?",
      "What question do you still have about what we learned?",
      "How did you organize your ideas?",
      "What connection did you make between today and something you already knew?",
      "What is something you'd like to practice more?",
      "What was the most important thing the teacher said today?",
      "If you had to teach today's lesson, where would you start?",
      "Did you take notes? Were they helpful?",
      "What evidence did you use to support your thinking?",
      "Was there a moment where everything 'clicked'? When?",
      "What concept feels clearest to you right now?",
      "What topic from today connects to another subject?",
      "What step in your work felt most important?",
      "What is a question you would ask the teacher right now?",
      "Did anything in the lesson click for you? What was it?",
      "What was the most important word or phrase from today?",
      "What would you add to your notes if you could?",
      "What is something you learned that changes how you think?",
      "What part of the lesson would you explain to a parent?",
      "What is something you worked out in your head today?"
    ],
    social: [
      "How did you help a classmate?",
      "What did you learn from someone else today?",
      "Were you a good listener today?",
      "Did you include everyone in your group?",
      "How were you a leader today?",
      "Did you have to apologize for anything?",
      "Who did you work well with today?",
      "Was there a moment you disagreed with someone? How did you handle it?",
      "Did anyone surprise you with something kind?",
      "How did you make someone feel included?",
      "What did you learn about a classmate today?",
      "Did you give feedback to a partner today? What did you say?",
      "How did your group share the work?",
      "Who in your class deserves a compliment today?",
      "Did you feel heard by your group? Why or why not?",
      "How did you make your group feel welcome?",
      "When did you feel like part of a team today?",
      "Did you share credit with a classmate today?",
      "What did you notice about how someone else was feeling?",
      "How did you make the classroom a better place today?",
      "Was there a moment you held back? What would you say now?",
      "Did you stand up for someone or something today?",
      "Did you notice when a friend was struggling? What did you do?",
      "What is one way you made someone feel good today?",
      "How did you work through a problem with someone else?"
    ],
    growth: [
      "What was your favorite mistake today?",
      "What did you do when you got stuck?",
      "How much effort did you put in on a scale of 1-10?",
      "What was a 'hard' thing that is now 'easier'?",
      "Did you ask for help when you needed it?",
      "What specific goal are you working on?",
      "What is one habit you want to improve?",
      "Did you notice when you wanted to give up? What kept you going?",
      "What does 'progress' look like for you right now?",
      "What is something you used to avoid that you're now getting better at?",
      "What did you do to get ready to learn today?",
      "When did you feel most confident today?",
      "What risk did you take today?",
      "What is something you are proud you didn't give up on?",
      "What advice would you give a younger student about learning?",
      "Where do you still feel uncertain?",
      "What is one thing you're proud you figured out on your own?",
      "Did you push yourself today or coast? How do you feel about that?",
      "What feedback did you receive and what will you do with it?",
      "What would make you even more confident in this skill?",
      "When did you notice yourself getting better at something?",
      "What distractions did you overcome today?",
      "What is one small next step you can take tomorrow?",
      "What is something you did today that your past self would be proud of?",
      "What does your best look like — and did you show it today?"
    ]
  },
  "68": {
    general: [
      "How does this connect to what we learned before?",
      "What surprised you the most today?",
      "What questions do you still have?",
      "What energy did you bring to class today?",
      "What felt like a waste of time today?",
      "What inspired you today?",
      "What is the most important thing that happened in class?",
      "What moment made you stop and think?",
      "What would you change about how today's class was run?",
      "What did you understand well? What is still fuzzy?",
      "If someone missed class today, what would you tell them?",
      "What do you think the teacher most wanted you to learn?",
      "Was today's work too easy, just right, or too hard?",
      "What connection did you make between class and the real world?",
      "What would you put on a 'highlight reel' of today?",
      "What question lingered with you all class?",
      "Was today what you expected? What surprised you?",
      "What made today feel worth showing up for?",
      "What is one thing you'll still be thinking about tonight?",
      "What would you tell a student who just transferred into this class?",
      "What part of today would you cut if you were the teacher?",
      "What is the most honest thing you could say about today?",
      "What do you understand now that you didn't when class started?",
      "If today had a theme, what would it be?",
      "What is something today revealed about how you think?"
    ],
    academic: [
      "Identify one area where you need more practice.",
      "How would you explain today's lesson to a younger student?",
      "What specific evidence supports your idea?",
      "Connect today's lesson to something happening in the real world.",
      "What was the main argument, theme, or big idea?",
      "How did you organize your notes or thinking today?",
      "What method or strategy did you use, and was it effective?",
      "What would you research further if you had more time?",
      "What vocabulary do you still need to understand better?",
      "What assumption did you make that turned out to be wrong?",
      "How did you check your own understanding during the lesson?",
      "What is the difference between what you thought you knew and what you now know?",
      "What question would you put on a quiz about today's topic?",
      "What was the hardest part of the task intellectually?",
      "How did you use feedback to improve your work?",
      "What is the simplest way you could explain today's big idea?",
      "What is the most complex part of today that still confuses you?",
      "What strategy did you use that you'd use again?",
      "What knowledge from outside school helped you today?",
      "What did the teacher not say that you think was important?",
      "What is something you need to review before the next class?",
      "What did you notice about your learning process today?",
      "If today's lesson were a chapter title, what would it be?",
      "What would a test on today's material look like?",
      "What is something you learned that shifts how you see this topic?"
    ],
    social: [
      "What role did you play in your group today?",
      "How did you handle a difference of opinion?",
      "Whose perspective helped shift your thinking?",
      "Did you judge someone or something too quickly today?",
      "How did you support a peer's idea?",
      "Was your communication clear and respectful?",
      "What would your group say about your contribution today?",
      "Did anyone dominate or get left out in your group?",
      "How did your group make decisions together?",
      "What would you do differently as a group member next time?",
      "Did you speak up when you disagreed? Should you have?",
      "How did you help the group stay on track?",
      "Who in the class thinks differently from you? What can you learn from them?",
      "Did you build on someone else's idea today?",
      "What does 'being a good collaborator' mean to you after today?",
      "How did you handle a moment when you felt unheard?",
      "Did you take more space or give more space in your group?",
      "Did you take credit you deserved? Why or why not?",
      "What would you do differently as a team member?",
      "How did you respond when something felt unfair?",
      "What did you learn about how someone communicates differently than you?",
      "How did your group's tone affect the work?",
      "Did you feel safe being wrong today? Why or why not?",
      "What made collaboration easier or harder today?",
      "Who did you learn the most from today, and what did you learn?"
    ],
    growth: [
      "When did you feel frustrated today, and how did you handle it?",
      "What creates the biggest distraction for you in class?",
      "What advice would you give your 'past self' for this task?",
      "Did you take any risks today academically or socially?",
      "How did you handle pressure or time constraints?",
      "What habit do you need to break to do better?",
      "When did you feel most 'in the zone' today?",
      "What did you do today that you didn't think you could do?",
      "How did you recover when something didn't go as planned?",
      "What mindset shift would help you most right now?",
      "What does your best effort actually look like vs. what you showed today?",
      "What is your biggest obstacle to learning in this class?",
      "How do you typically respond to feedback, and is that helpful?",
      "What goal feels out of reach but worth working toward?",
      "What would you attempt if you knew you couldn't fail?",
      "What is one belief about your abilities that today tested?",
      "When did you feel like giving up? What made you keep going?",
      "What is a pattern in your work that you keep noticing?",
      "What would it take for you to feel truly confident in this area?",
      "What small thing made a big difference today?",
      "What did you do today that was outside your comfort zone?",
      "How do you talk to yourself when things get hard?",
      "What is one thing you could stop doing that would make you a better learner?",
      "What does progress look like for you right now?",
      "What is something you are proud you pushed through today?"
    ]
  },
  "912": {
    general: [
      "How has your thinking on this topic changed?",
      "How can you apply this skill in a different context?",
      "What part of the process did you undervalue?",
      "What perspective did you challenge today?",
      "What is a major takeaway that matters for your future?",
      "Analyze your productivity levels today honestly.",
      "What do you know now that you wish you'd known at the start?",
      "What unresolved tension or question are you sitting with?",
      "What would you do differently if you could redo this unit?",
      "How did today's work connect to something outside of school?",
      "What assumption did you walk in with that you need to revisit?",
      "If today's class were a headline, what would it say?",
      "What is the cost of not mastering what was taught today?",
      "What would a skeptic say about the ideas discussed today?",
      "How are you different as a thinker than you were at the start of this unit?",
      "What are the implications of today's content beyond this class?",
      "What was the most intellectually honest thing said today?",
      "What question would you bring to a panel of experts on this topic?",
      "How did today's class change — or not change — what you believe?",
      "What is the most counterintuitive thing from today?",
      "What part of today will still matter to you in five years?",
      "What trade-offs were visible in today's topic or process?",
      "What did today reveal about how you engage with difficult ideas?",
      "What is something today complicated that you thought you understood?",
      "If you had to write a one-sentence reflection, what would it say?"
    ],
    academic: [
      "Assess your time management honestly: efficient or distracted?",
      "How did personal bias affect your work or interpretation?",
      "What information is still missing from your understanding?",
      "Critique the source material, methodology, or argument.",
      "What determines the validity or reliability of this idea?",
      "Synthesize two separate concepts from today's learning.",
      "What counterargument challenges your current thinking most?",
      "How does today's content fit into the larger discipline or field?",
      "What evidence would change your mind on this topic?",
      "What is the strongest and weakest part of your current work?",
      "How would you redesign this assignment to make it more meaningful?",
      "What did you produce today, and does it reflect your best thinking?",
      "What questions remain open that you think are worth exploring further?",
      "How has your understanding of this topic evolved over the unit?",
      "What real-world decision or problem does this learning help you solve?",
      "What is the most important assumption underlying today's argument or method?",
      "What would a peer reviewer say about your work today?",
      "How has your framework for understanding this topic shifted?",
      "What question would move this conversation — or this field — forward?",
      "What limitations does the method or framework taught today have?",
      "How does what you learned today connect to a broader theory or principle?",
      "What is the most elegant or surprising idea you encountered today?",
      "What does it mean to truly master this content?",
      "How might someone from a different background interpret today's material?",
      "What secondary sources or perspectives are missing from today's lesson?"
    ],
    social: [
      "How did you contribute to the learning of others today?",
      "Evaluate the collaborative dynamics of your team honestly.",
      "How did you lead or create space for others today?",
      "How did you build or strengthen a relationship today?",
      "Did you advocate for yourself effectively when it mattered?",
      "How did you navigate a conflict or disagreement productively?",
      "What is something you held back from saying? Should you have said it?",
      "Did you assume positive intent in others today? Was that warranted?",
      "How did your words or actions affect the group's energy?",
      "Who challenged you most today, and what can you learn from them?",
      "What power dynamics were present in your group, and how did they affect the work?",
      "Did you listen to understand or listen to respond?",
      "What would you want your group members to know about how you work best?",
      "How did your identity or background shape how you engaged today?",
      "What does 'psychological safety' feel like, and did your group have it today?",
      "How did today challenge you to think beyond your own experience?",
      "Who was the most intellectually generous person in the room today?",
      "What was left unsaid in today's discussion that should have been said?",
      "How did you balance confidence and humility in your contributions?",
      "What would have made the conversation in class richer?",
      "When did you notice yourself closing down instead of opening up?",
      "What does accountability look like in your class or group?",
      "How did your group handle uncertainty or disagreement productively?",
      "What assumptions about others were revealed in today's discussion?",
      "What does the way your group worked today say about your class culture?"
    ],
    growth: [
      "What was the 'tipping point' where this started making sense?",
      "In what ways did you challenge your own comfort zone?",
      "If you were grading your effort today, what would the grade be and why?",
      "Where is your current 'growth edge' in this class?",
      "How are you managing stress and work without burning out?",
      "Define what success looked like for you on this task.",
      "What is the gap between your current performance and your potential?",
      "What fear or resistance showed up for you today, and how did you handle it?",
      "What are you avoiding that you know you need to face?",
      "How do you typically respond when something is harder than expected?",
      "What feedback have you received that you haven't fully acted on yet?",
      "When is the last time you were truly intellectually uncomfortable? What came from it?",
      "What belief about yourself as a learner might be holding you back?",
      "What does it look like when you are operating at your best?",
      "What is one concrete thing you will do differently tomorrow?",
      "What is the relationship between your effort and your results in this class?",
      "What is the most honest thing you can say about your learning right now?",
      "What do you need to unlearn to get better in this area?",
      "How has your definition of 'good work' changed over this course?",
      "What is the gap between how you present yourself as a learner and who you actually are?",
      "What does failure teach you that success doesn't?",
      "What is one commitment you're making to yourself for the rest of this course?",
      "What would mastery look like for you — and how far are you from it?",
      "What would you do differently if you started this unit over today?",
      "What is holding you back right now, and is it within your control?"
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

const INITIAL_SPIN_QUESTION = QUESTION_BANK["25"].general[0];

function pickQuestion(
  grade: keyof typeof QUESTION_BANK,
  category: "general" | "academic" | "social" | "growth",
) {
  const pool = QUESTION_BANK[grade][category];
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function SpinPage() {
  const router = useRouter();
  const [grade, setGrade] = useState<keyof typeof QUESTION_BANK>("25");
  const [category, setCategory] = useState<"general" | "academic" | "social" | "growth">("general");
  const [question, setQuestion] = useState(INITIAL_SPIN_QUESTION);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");

  const spin = useCallback(() => {
    setQuestion(pickQuestion(grade, category));
    setError("");
  }, [category, grade]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.key === ' ') && document.activeElement?.tagName !== 'BUTTON') {
        e.preventDefault();
        spin();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [spin]);

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
                  onChange={(e) => {
                    const nextGrade = e.target.value as keyof typeof QUESTION_BANK;
                    setGrade(nextGrade);
                    setQuestion(pickQuestion(nextGrade, category));
                    setError("");
                  }}
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
                    onClick={() => {
                      const nextCategory = cat.id as typeof category;
                      setCategory(nextCategory);
                      setQuestion(pickQuestion(grade, nextCategory));
                      setError("");
                    }}
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
              <div>
                <h2 className="display-type text-4xl sm:text-5xl font-bold leading-[0.9]">
                  {question}
                </h2>
              </div>
            </div>

            {error ? <p className="font-black text-[#fd4401]">{error}</p> : null}

            <div className="grid gap-3 md:grid-cols-2">
              <button
                onClick={spin}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#006cff] px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5"
              >
                <RefreshCcw size={20} />
                Spin again
              </button>

              <button
                onClick={launchSession}
                disabled={launching}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#fd4401] px-7 py-4 text-lg font-black text-white transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                <Check size={20} />
                {launching ? "Launching..." : "Launch this question"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
