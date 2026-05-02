"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Keyboard, MessageCircle, Mic, Send, Square } from "lucide-react";
import type { Session } from "@/lib/models";
import type { ExitTicketTurnAnalysis } from "@/lib/ai/schemas";
import { SEE_THINK_WONDER_ROUTINE } from "@/lib/routines";

type Mode = "voice" | "text";
type StudentSessionPayload = {
  session: Pick<
    Session,
    | "id"
    | "routineId"
    | "title"
    | "learningTarget"
    | "config"
    | "stimulus"
    | "exitTicketQuestion"
    | "exitTicketMaxTurns"
  >;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionResultEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function collectSpeechTranscript(event: SpeechRecognitionResultEventLike) {
  return Array.from(event.results)
    .map((result) => result[0]?.transcript ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function StudentRoutine({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reflectionId = searchParams.get("reflectionId") ?? "";
  const token = searchParams.get("token") ?? "";
  const [stepIndex, setStepIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("voice");
  const [text, setText] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [error, setError] = useState("");
  const [studentSession, setStudentSession] = useState<StudentSessionPayload | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const speechRecognition = useRef<SpeechRecognitionLike | null>(null);
  const voiceTranscriptRef = useRef("");
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | null>(null);
  const step = SEE_THINK_WONDER_ROUTINE.steps[stepIndex];
  const voiceMinimumSeconds =
    studentSession?.session.config.voiceMinimumSeconds ?? 5;

  useEffect(() => {
    fetch(
      `/api/student/sessions/${sessionId}?reflectionId=${encodeURIComponent(reflectionId)}&token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setStudentSession(data);
      });

    return () => {
      if (timer.current) window.clearInterval(timer.current);
      recorder.current?.stream.getTracks().forEach((track) => track.stop());
      speechRecognition.current?.stop();
    };
  }, [reflectionId, sessionId, token]);

  async function startRecording() {
    setError("");
    setVoiceTranscript("");
    voiceTranscriptRef.current = "";
    const SpeechRecognition = getSpeechRecognition();

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      speechRecognition.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event) => {
        const transcript = collectSpeechTranscript(event);
        voiceTranscriptRef.current = transcript;
        setVoiceTranscript(transcript);
      };
      recognition.onerror = () => {
        setError("The microphone could not hear you clearly. You can type instead.");
        setRecording(false);
        setMode("text");
        if (timer.current) window.clearInterval(timer.current);
      };
      recognition.start();
      setRecording(true);
      setSeconds(0);
      timer.current = window.setInterval(() => setSeconds((value) => value + 1), 1000);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      recorder.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => chunks.current.push(event.data);
      mediaRecorder.start();
      setRecording(true);
      setSeconds(0);
      timer.current = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    } catch {
      setError("Microphone permission was blocked. You can type your thinking instead.");
      setMode("text");
    }
  }

  async function stopAndSubmitAudio() {
    if (speechRecognition.current) {
      speechRecognition.current.stop();
      speechRecognition.current = null;
      if (timer.current) window.clearInterval(timer.current);
      setRecording(false);
      const transcript = voiceTranscriptRef.current.trim();
      if (transcript.length < 3) {
        setError("We did not catch enough words. Try again or switch to typing.");
        return;
      }
      await submitRoutineText(transcript);
      return;
    }

    if (!recorder.current) return;
    setSubmitting(true);
    setRecording(false);
    if (timer.current) window.clearInterval(timer.current);

    const blob = await new Promise<Blob>((resolve) => {
      const activeRecorder = recorder.current!;
      activeRecorder.onstop = () => resolve(new Blob(chunks.current, { type: "audio/webm" }));
      activeRecorder.stop();
      activeRecorder.stream.getTracks().forEach((track) => track.stop());
    });

    const formData = new FormData();
    formData.append("participantToken", token);
    formData.append("audio", blob, `step-${step.stepNumber}.webm`);
    const response = await fetch(
      `/api/reflections/${reflectionId}/steps/${step.stepNumber}/audio`,
      { method: "POST", body: formData },
    );
    await handleStepResponse(response);
  }

  async function submitText() {
    await submitRoutineText(text);
  }

  async function submitRoutineText(transcription: string) {
    setSubmitting(true);
    setError("");
    const response = await fetch(
      `/api/reflections/${reflectionId}/steps/${step.stepNumber}/text`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantToken: token, transcription }),
      },
    );
    await handleStepResponse(response, transcription);
  }

  async function handleStepResponse(response: Response, fallbackTranscript = text) {
    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Could not submit this step.");
      return;
    }

    setTranscripts((items) => [...items, data.transcript ?? fallbackTranscript]);
    setText("");
    setVoiceTranscript("");
    voiceTranscriptRef.current = "";

    if (stepIndex < SEE_THINK_WONDER_ROUTINE.steps.length - 1) {
      setStepIndex((index) => index + 1);
      setSeconds(0);
      return;
    }

    const completed = await fetch(`/api/reflections/${reflectionId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantToken: token }),
    });
    const completeData = await completed.json();
    if (!completed.ok) {
      setError(completeData.error ?? "Could not finish your reflection.");
      return;
    }

    router.push(`/student/reflection/${reflectionId}/snapshot?token=${token}`);
  }

  if (!reflectionId || !token) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fdcb40] p-6 text-black">
        <div className="panel max-w-lg p-6 text-center">
          <h1 className="display-type text-4xl font-bold">Join link expired</h1>
          <p className="mt-2 text-lg font-semibold">Please scan your teacher’s QR code again.</p>
        </div>
      </main>
    );
  }

  if (!studentSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fdcb40] p-6 text-black">
        <div className="panel max-w-lg p-6 text-center">
          <h1 className="display-type text-4xl font-bold">Loading reflection</h1>
          <p className="mt-2 text-lg font-semibold">Getting your teacher’s question...</p>
        </div>
      </main>
    );
  }

  if (studentSession.session.routineId === "exit-ticket-conversation") {
    return (
      <ExitTicketConversation
        sessionId={sessionId}
        reflectionId={reflectionId}
        token={token}
        question={studentSession.session.exitTicketQuestion ?? "What are you thinking about today's lesson?"}
        maxTurns={studentSession.session.exitTicketMaxTurns ?? 4}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#fdcb40] px-5 py-6 text-black" data-session-id={sessionId}>
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
        <div className="panel p-6 md:p-10">
          <p className="inline-flex rounded-full border-2 border-black bg-[#04c6c5] px-4 py-2 text-sm font-black uppercase tracking-[0.08em]">
            Step {step.stepNumber} of 3
          </p>
          <h1 className="display-type mt-5 text-[5.5rem] font-bold leading-[0.82]">
            {step.prompt}
          </h1>
          <p className="mt-6 max-w-2xl text-2xl font-semibold leading-8">
            {step.studentCue}
          </p>

          <StimulusBlock stimulus={studentSession.session.stimulus} />

          <div className="mt-8 flex gap-2">
            <button
              onClick={() => setMode("voice")}
              className={`focus-ring inline-flex items-center gap-2 rounded-full border-2 border-black px-5 py-3 font-black ${
                mode === "voice" ? "bg-[#006cff] text-white" : "bg-white"
              }`}
            >
              <Mic size={18} />
              Voice
            </button>
            <button
              onClick={() => setMode("text")}
              className={`focus-ring inline-flex items-center gap-2 rounded-full border-2 border-black px-5 py-3 font-black ${
                mode === "text" ? "bg-[#006cff] text-white" : "bg-white"
              }`}
            >
              <Keyboard size={18} />
              Type
            </button>
          </div>

          {mode === "voice" ? (
            <div className="mt-8 rounded-[24px] border-2 border-black bg-[#fff2b7] p-6 text-center">
              <button
                onClick={recording ? stopAndSubmitAudio : startRecording}
                disabled={submitting || (recording && seconds < voiceMinimumSeconds)}
                className={`focus-ring mx-auto grid size-40 place-items-center rounded-full border-2 border-black text-white transition hover:-translate-y-0.5 ${
                  recording ? "bg-[#fd4401]" : "bg-[#006cff]"
                } disabled:opacity-50`}
              >
                {recording ? <Square size={42} /> : <Mic size={48} />}
              </button>
              <p className="display-type mt-5 text-5xl font-bold">{seconds}s</p>
              <p className="mt-2 text-lg font-bold">
                {recording
                  ? seconds < voiceMinimumSeconds
                    ? `Keep going for at least ${voiceMinimumSeconds} seconds.`
                    : "You can stop when your thought feels complete."
                  : voiceMinimumSeconds > 0
                    ? `Tap the microphone and speak for at least ${voiceMinimumSeconds} seconds.`
                    : "Tap the microphone and speak your thinking."}
              </p>
              {voiceTranscript ? (
                <div className="mt-5 rounded-[20px] border-2 border-black bg-white p-4 text-left">
                  <p className="text-xs font-black uppercase tracking-[0.08em]">
                    We heard
                  </p>
                  <p className="mt-2 text-lg font-bold leading-7">{voiceTranscript}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-8">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="focus-ring min-h-56 w-full rounded-[24px] border-2 border-black bg-white p-5 text-xl font-semibold leading-8"
                placeholder="Type your thinking here..."
              />
              <button
                onClick={submitText}
                disabled={submitting || text.trim().length < 3}
                className="focus-ring mt-4 inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#fd4401] px-7 py-4 font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                Submit step
                <Send size={18} />
              </button>
            </div>
          )}
          {submitting ? <p className="mt-4 font-black text-[#006cff]">Making your thinking visible...</p> : null}
          {error ? <p className="mt-4 font-black text-[#fd4401]">{error}</p> : null}
        </div>

        <aside className="panel p-5">
          <h2 className="display-type text-3xl font-bold">Your routine</h2>
          <div className="mt-4 space-y-3">
            {SEE_THINK_WONDER_ROUTINE.steps.map((item, index) => (
              <div
                key={item.label}
                className={`rounded-[20px] border-2 p-4 ${
                  index === stepIndex
                    ? "border-black bg-[#04c6c5]"
                    : index < stepIndex
                      ? "border-black bg-[#00b351]"
                      : "border-black bg-white"
                }`}
              >
                <p className="font-black">{item.label}</p>
                <p className="mt-1 text-sm font-semibold">
                  {transcripts[index] ?? item.prompt}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[20px] border-2 border-black bg-[#fff2b7] p-4 text-sm font-bold leading-6">
            <ArrowRight className="mb-2 text-[#fd4401]" size={18} />
            Your teacher sees patterns from the class, not a grade.
          </div>
        </aside>
      </section>
    </main>
  );
}

function StimulusBlock({
  stimulus,
}: {
  stimulus: { kind: "image" | "text" | "link" | "none"; value: string };
}) {
  if (stimulus.kind === "none" || !stimulus.value) return null;

  if (stimulus.kind === "image") {
    return (
      <div className="mt-8 rounded-[24px] border-2 border-black bg-white p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stimulus.value}
          alt="Reflection stimulus"
          className="max-h-[420px] w-full rounded-[18px] object-cover"
        />
      </div>
    );
  }

  if (stimulus.kind === "link") {
    return (
      <a
        href={stimulus.value}
        target="_blank"
        rel="noreferrer"
        className="focus-ring mt-8 block rounded-[24px] border-2 border-black bg-[#fff2b7] p-5 text-xl font-black underline"
      >
        Open stimulus link
      </a>
    );
  }

  return (
    <div className="mt-8 rounded-[24px] border-2 border-black bg-[#fff2b7] p-5">
      <p className="text-sm font-black uppercase tracking-[0.08em]">Stimulus</p>
      <p className="mt-2 text-xl font-bold leading-8">{stimulus.value}</p>
    </div>
  );
}

function ExitTicketConversation({
  sessionId,
  reflectionId,
  token,
  question,
  maxTurns,
}: {
  sessionId: string;
  reflectionId: string;
  token: string;
  question: string;
  maxTurns: number;
}) {
  const router = useRouter();
  const [turnIndex, setTurnIndex] = useState(0);
  const [prompt, setPrompt] = useState(question);
  const [mode, setMode] = useState<Mode>("voice");
  const [text, setText] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [listening, setListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lastAnalysis, setLastAnalysis] = useState<ExitTicketTurnAnalysis | null>(null);
  const [conversation, setConversation] = useState<
    Array<{ prompt: string; response: string; analysis: ExitTicketTurnAnalysis }>
  >([]);
  const speechRecognition = useRef<SpeechRecognitionLike | null>(null);
  const voiceTranscriptRef = useRef("");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      speechRecognition.current?.stop();
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  function startVoiceTurn() {
    setError("");
    setVoiceTranscript("");
    voiceTranscriptRef.current = "";
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setError("Voice is not available in this browser. Type your response instead.");
      setMode("text");
      return;
    }

    const recognition = new SpeechRecognition();
    speechRecognition.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = collectSpeechTranscript(event);
      voiceTranscriptRef.current = transcript;
      setVoiceTranscript(transcript);
    };
    recognition.onerror = () => {
      setError("The microphone could not hear you clearly. You can type instead.");
      setListening(false);
      setMode("text");
      if (timer.current) window.clearInterval(timer.current);
    };
    recognition.start();
    setListening(true);
    setSeconds(0);
    timer.current = window.setInterval(() => setSeconds((value) => value + 1), 1000);
  }

  async function stopVoiceTurn() {
    speechRecognition.current?.stop();
    speechRecognition.current = null;
    if (timer.current) window.clearInterval(timer.current);
    setListening(false);

    const transcript = voiceTranscriptRef.current.trim();
    if (transcript.length < 3) {
      setError("We did not catch enough words. Try again or switch to typing.");
      return;
    }

    await submitTurn(transcript);
  }

  async function submitTurn(responseText = text) {
    setSubmitting(true);
    setError("");
    const response = await fetch(`/api/reflections/${reflectionId}/exit-ticket/turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantToken: token,
        prompt,
        response: responseText,
        turnIndex,
      }),
    });
    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Could not submit your reflection.");
      return;
    }

    setLastAnalysis(data.analysis);
    setConversation((items) => [
      ...items,
      { prompt, response: responseText, analysis: data.analysis },
    ]);
    setText("");
    setVoiceTranscript("");
    voiceTranscriptRef.current = "";

    if (data.complete) {
      router.push(`/student/reflection/${reflectionId}/snapshot?token=${token}`);
      return;
    }

    setPrompt(data.analysis.followUpQuestion ?? question);
    setTurnIndex((index) => index + 1);
  }

  return (
    <main className="min-h-screen bg-[#fdcb40] px-5 py-6 text-black" data-session-id={sessionId}>
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
        <div className="panel p-6 md:p-10">
          <p className="inline-flex rounded-full border-2 border-black bg-[#04c6c5] px-4 py-2 text-sm font-black uppercase tracking-[0.08em]">
            Reflection turn {turnIndex + 1} of {maxTurns}
          </p>
          <h1 className="display-type mt-5 text-[3.1rem] font-bold leading-[0.9] sm:text-[4.2rem] md:text-[5.4rem]">
            {prompt}
          </h1>

          {lastAnalysis ? (
            <div className="mt-7 rounded-[24px] border-2 border-black bg-[#fff2b7] p-5">
              <p className="text-sm font-black uppercase tracking-[0.08em]">
                ReflectAI noticed
              </p>
              <p className="mt-2 text-xl font-black leading-7">
                “{lastAnalysis.directQuote}”
              </p>
              <div className="mt-4 flex items-center gap-2">
                {[1, 2, 3, 4].map((rating) => (
                  <div
                    key={rating}
                    className={`h-4 flex-1 rounded-full border-2 border-black ${
                      rating <= lastAnalysis.rating ? "bg-[#006cff]" : "bg-white"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-black uppercase">
                  {lastAnalysis.ratingLabel}
                </span>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex gap-2">
            <button
              onClick={() => setMode("voice")}
              className={`focus-ring inline-flex items-center gap-2 rounded-full border-2 border-black px-5 py-3 font-black ${
                mode === "voice" ? "bg-[#006cff] text-white" : "bg-white"
              }`}
            >
              <Mic size={18} />
              Voice
            </button>
            <button
              onClick={() => setMode("text")}
              className={`focus-ring inline-flex items-center gap-2 rounded-full border-2 border-black px-5 py-3 font-black ${
                mode === "text" ? "bg-[#006cff] text-white" : "bg-white"
              }`}
            >
              <Keyboard size={18} />
              Type
            </button>
          </div>

          <div className="mt-8">
            {mode === "voice" ? (
              <div className="rounded-[24px] border-2 border-black bg-[#fff2b7] p-6 text-center">
                <button
                  onClick={listening ? stopVoiceTurn : startVoiceTurn}
                  disabled={submitting}
                  className={`focus-ring mx-auto grid size-36 place-items-center rounded-full border-2 border-black text-white transition hover:-translate-y-0.5 ${
                    listening ? "bg-[#fd4401]" : "bg-[#006cff]"
                  } disabled:opacity-50`}
                >
                  {listening ? <Square size={36} /> : <Mic size={42} />}
                </button>
                <p className="display-type mt-5 text-5xl font-bold">{seconds}s</p>
                <p className="mt-2 text-lg font-bold">
                  {listening
                    ? "Stop when your thought feels complete."
                    : "Tap the microphone and answer in your own words."}
                </p>
                {voiceTranscript ? (
                  <div className="mt-5 rounded-[20px] border-2 border-black bg-white p-4 text-left">
                    <p className="text-xs font-black uppercase tracking-[0.08em]">
                      We heard
                    </p>
                    <p className="mt-2 text-lg font-bold leading-7">
                      {voiceTranscript}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="focus-ring min-h-56 w-full rounded-[24px] border-2 border-black bg-white p-5 text-xl font-semibold leading-8"
                  placeholder="Type your thinking here..."
                />
                <button
                  onClick={() => submitTurn()}
                  disabled={submitting || text.trim().length < 3}
                  className="focus-ring mt-4 inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#fd4401] px-7 py-4 font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {submitting ? "Thinking..." : turnIndex >= maxTurns - 1 ? "Finish" : "Send"}
                  <Send size={18} />
                </button>
              </>
            )}
          </div>
          {error ? <p className="mt-4 font-black text-[#fd4401]">{error}</p> : null}
        </div>

        <aside className="panel p-5">
          <h2 className="display-type flex items-center gap-2 text-3xl font-bold">
            <MessageCircle size={26} />
            Your conversation
          </h2>
          <div className="mt-4 space-y-3">
            {conversation.length === 0 ? (
              <p className="rounded-[20px] border-2 border-black bg-[#fff2b7] p-4 text-sm font-bold leading-6">
                Answer the first question. ReflectAI will ask a follow-up based
                on your own words.
              </p>
            ) : (
              conversation.map((turn, index) => (
                <div
                  key={`${turn.prompt}-${index}`}
                  className="rounded-[20px] border-2 border-black bg-white p-4"
                >
                  <p className="text-xs font-black uppercase tracking-[0.08em]">
                    Turn {index + 1} · {turn.analysis.ratingLabel}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6">“{turn.analysis.directQuote}”</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-5 rounded-[20px] border-2 border-black bg-[#04c6c5] p-4 text-sm font-bold leading-6">
            Your teacher sees your quote, rating, and follow-up path.
          </div>
        </aside>
      </section>
    </main>
  );
}
