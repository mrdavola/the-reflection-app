"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ImagePlus, MousePointer2, Rocket, Upload, Wand2 } from "lucide-react";
import { AccountMenu } from "../account-menu";

const STIMULUS_EXAMPLES = [
  {
    title: "School garden",
    prompt:
      "A busy school garden after rain with students noticing patterns, tools, puddles, leaves, soil, and sunlight. No text.",
  },
  {
    title: "Science phenomenon",
    prompt:
      "A clear classroom-safe image of an unusual science phenomenon with magnets, paper clips, shadows, and measurement tools. No text.",
  },
  {
    title: "Historical artifact",
    prompt:
      "A classroom-safe historical artifact table with a map, worn objects, photographs, and clues from daily life. No text or readable labels.",
  },
  {
    title: "Data scene",
    prompt:
      "A visual scene showing patterns in weather, plants, containers, and water levels that students can observe closely. No text.",
  },
];

export default function NewSessionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("See Think Wonder Reflection");
  const [learningTarget, setLearningTarget] = useState("");
  const [stimulus, setStimulus] = useState("");
  const [stimulusImage, setStimulusImage] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageMode, setImageMode] = useState<"generate" | "upload" | "text">("generate");
  const [voiceMinimumSeconds, setVoiceMinimumSeconds] = useState(5);
  const [annotationMode, setAnnotationMode] = useState(true);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function createSession() {
    setSubmitting(true);
    const stimulusPayload = stimulusImage
      ? { kind: "image", value: stimulusImage }
      : stimulus
        ? { kind: stimulus.startsWith("http") ? "link" : "text", value: stimulus }
        : { kind: "none", value: "" };
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        learningTarget,
        stimulus: stimulusPayload,
        config: {
          voiceMinimumSeconds,
          annotationMode,
        },
      }),
    });
    const data = await response.json();
    setSubmitting(false);

    if (data.session?.id) {
      router.push(`/teacher/session/${data.session.id}/live`);
    }
  }

  async function generateImage() {
    setImageError("");
    setGeneratingImage(true);
    const response = await fetch("/api/images/stimulus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: imagePrompt, learningTarget }),
    });
    const data = await response.json();
    setGeneratingImage(false);

    if (!response.ok) {
      setImageError(data.error ?? "Could not generate an image.");
      return;
    }

    setStimulusImage(data.image.dataUrl);
    setStimulus("");
  }

  function uploadImage(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setStimulusImage(String(reader.result));
      setStimulus("");
    };
    reader.readAsDataURL(file);
  }

  return (
    <main className="min-h-screen bg-[#fdcb40] px-5 py-5 text-black md:px-8 md:py-8">
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

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>

            <h1 className="display-type max-w-2xl text-[4.7rem] font-bold leading-[0.84] md:text-[7.3rem]">
              Thinking routines
            </h1>
            <p className="mt-8 max-w-xl text-2xl font-semibold leading-8">
              Pick the routine, add the context, and project a join code. The
              dashboard turns student reflection into your next teaching move.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["See", "Think", "Wonder"].map((item, index) => (
              <div
                key={item}
                className={`rounded-[24px] border-2 border-black p-5 ${
                  index === 0
                    ? "bg-[#04c6c5]"
                    : index === 1
                      ? "bg-white"
                      : "bg-[#f780d4]"
                }`}
              >
                <p className="display-type text-3xl font-bold leading-none">{item}</p>
                <p className="mt-3 text-sm font-bold leading-5">
                  {index === 0
                    ? "Name details."
                    : index === 1
                      ? "Explain ideas."
                      : "Open inquiry."}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="panel mt-10 grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-6">
            <label className="grid gap-2">
              <span className="text-sm font-black uppercase tracking-[0.08em]">
                Session title
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="focus-ring rounded-[24px] border-2 border-black bg-[#fff2b7] px-5 py-4 text-2xl font-bold"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-black uppercase tracking-[0.08em]">
                Learning target
              </span>
              <textarea
                value={learningTarget}
                onChange={(event) => setLearningTarget(event.target.value)}
                placeholder="Students will use evidence from an image to explain their thinking."
                className="focus-ring min-h-32 rounded-[24px] border-2 border-black bg-white px-5 py-4 text-xl font-semibold leading-7 placeholder:text-black/40"
              />
            </label>
            <div className="grid gap-3">
              <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em]">
                <ImagePlus size={18} />
                Stimulus
              </span>
              <div className="rounded-[24px] border-2 border-black bg-white p-5">
                <p className="text-sm font-black uppercase tracking-[0.08em]">
                  Project Zero launch frame
                </p>
                <p className="mt-2 text-lg font-bold leading-7">
                  Students observe first, then interpret with evidence, then name
                  questions that remain. Annotation mode lets them point to the
                  exact part of the image that sparked their thinking.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ["generate", "AI image"],
                  ["upload", "Upload"],
                  ["text", "Text / link"],
                ].map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setImageMode(mode as typeof imageMode)}
                    className={`focus-ring rounded-full border-2 border-black px-4 py-3 text-sm font-black ${
                      imageMode === mode ? "bg-[#006cff] text-white" : "bg-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {imageMode === "generate" ? (
                <div className="rounded-[24px] border-2 border-black bg-[#fff2b7] p-5">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {STIMULUS_EXAMPLES.map((example) => (
                      <button
                        key={example.title}
                        type="button"
                        onClick={() => setImagePrompt(example.prompt)}
                        className="focus-ring rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-black"
                      >
                        {example.title}
                      </button>
                    ))}
                  </div>
                  <label className="grid gap-2">
                    <span className="text-sm font-black uppercase tracking-[0.08em]">
                      Describe the image
                    </span>
                    <textarea
                      value={imagePrompt}
                      onChange={(event) => setImagePrompt(event.target.value)}
                      placeholder="Example: a busy school garden after rain with students noticing patterns, tools, and puddles"
                      className="focus-ring min-h-28 rounded-[20px] border-2 border-black bg-white px-5 py-4 text-lg font-semibold leading-7 placeholder:text-black/40"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={generateImage}
                    disabled={generatingImage || imagePrompt.trim().length < 8}
                    className="focus-ring mt-4 inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#006cff] px-6 py-3 font-black text-white disabled:opacity-50"
                  >
                    <Wand2 size={18} />
                    {generatingImage ? "Generating..." : "Generate image"}
                  </button>
                  {imageError ? (
                    <p className="mt-3 font-black text-[#fd4401]">{imageError}</p>
                  ) : null}
                </div>
              ) : null}

              {imageMode === "upload" ? (
                <label className="focus-ring flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-black bg-[#fff2b7] p-6 text-center font-black">
                  <Upload className="mb-2" />
                  Upload a classroom image
                  <span className="mt-1 text-sm font-bold">PNG, JPG, or WebP</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) => uploadImage(event.target.files?.[0])}
                  />
                </label>
              ) : null}

              {imageMode === "text" ? (
                <textarea
                  value={stimulus}
                  onChange={(event) => {
                    setStimulus(event.target.value);
                    setStimulusImage("");
                  }}
                  placeholder="Paste an image/article link or type the artifact students will observe."
                  className="focus-ring min-h-36 rounded-[24px] border-2 border-black bg-white px-5 py-4 text-xl font-semibold leading-7 placeholder:text-black/40"
                />
              ) : null}

              {stimulusImage ? (
                <div className="rounded-[24px] border-2 border-black bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stimulusImage}
                    alt="Selected See Think Wonder stimulus"
                    className="max-h-80 w-full rounded-[18px] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setStimulusImage("")}
                    className="focus-ring mt-3 rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-black"
                  >
                    Remove image
                  </button>
                </div>
              ) : null}
            </div>
            <section className="grid gap-3">
              <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em]">
                <MousePointer2 size={18} />
                Student response style
              </span>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setAnnotationMode(true)}
                  className={`focus-ring rounded-[24px] border-2 border-black p-5 text-left ${
                    annotationMode ? "bg-[#04c6c5]" : "bg-white"
                  }`}
                >
                  <p className="display-type text-3xl font-bold">
                    Annotate image
                  </p>
                  <p className="mt-2 text-sm font-black leading-5">
                    Students tap the image, add sticky notes by voice or typing,
                    then move through See, Think, Wonder.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setAnnotationMode(false)}
                  className={`focus-ring rounded-[24px] border-2 border-black p-5 text-left ${
                    !annotationMode ? "bg-[#fff2b7]" : "bg-white"
                  }`}
                >
                  <p className="display-type text-3xl font-bold">
                    Voice or type
                  </p>
                  <p className="mt-2 text-sm font-black leading-5">
                    Students respond to each routine step without placing pins on
                    the image.
                  </p>
                </button>
              </div>
            </section>
            <label className="grid gap-2">
              <span className="text-sm font-black uppercase tracking-[0.08em]">
                Voice minimum
              </span>
              <div className="rounded-[24px] border-2 border-black bg-[#fff2b7] p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="display-type text-4xl font-bold">
                    {voiceMinimumSeconds}s
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={voiceMinimumSeconds}
                    onChange={(event) =>
                      setVoiceMinimumSeconds(Number(event.target.value))
                    }
                    className="focus-ring w-28 rounded-[18px] border-2 border-black bg-white px-4 py-3 text-xl font-black"
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={5}
                  value={voiceMinimumSeconds}
                  onChange={(event) =>
                    setVoiceMinimumSeconds(Number(event.target.value))
                  }
                  className="mt-4 w-full"
                />
              </div>
            </label>
          </div>
          <aside className="flex flex-col justify-between rounded-[24px] border-2 border-black bg-[#006cff] p-6 text-white">
            <div>
              <p className="display-type text-5xl font-bold leading-[0.9]">
                Built for today’s class.
              </p>
              <p className="mt-5 text-lg font-semibold leading-7">
                Voice-first, text-ready, teacher-set voice minimum, adaptive follow-ups,
                and a thinking snapshot for every student.
              </p>
            </div>
            <button
              onClick={createSession}
              disabled={submitting}
              className="focus-ring mt-8 inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#fd4401] px-7 py-5 text-xl font-black text-white disabled:opacity-60"
            >
              <Rocket size={22} />
              {submitting ? "Launching..." : "Launch"}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
