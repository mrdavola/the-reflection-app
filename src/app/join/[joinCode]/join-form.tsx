"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

export default function JoinForm({ initialJoinCode }: { initialJoinCode: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [joinCode, setJoinCode] = useState(initialJoinCode === "DEMO" ? "" : initialJoinCode);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  async function join() {
    setJoining(true);
    setError("");

    let code = joinCode.trim().toUpperCase();
    if (initialJoinCode === "DEMO" && !code) {
      const seeded = await fetch("/api/demo/seed", { method: "POST" }).then((res) => res.json());
      code = seeded.session.joinCode;
    }

    const response = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinCode: code, displayName: displayName.trim() }),
    });
    const data = await response.json();
    setJoining(false);

    if (!response.ok) {
      setError(data.error ?? "Could not join this session.");
      return;
    }

    const search = new URLSearchParams({
      reflectionId: data.reflection.id,
      token: data.participant.participantToken,
    });
    router.push(`/student/session/${data.session.id}?${search.toString()}`);
  }

  const canJoin = displayName.trim().length > 0 && (initialJoinCode === "DEMO" || joinCode.trim().length >= 4);

  return (
    <main className="grid min-h-screen place-items-center bg-[#fdcb40] px-6 py-8 text-black">
      <section className="w-full max-w-xl">
        <div className="text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-[20px] border-2 border-black bg-[#04c6c5] text-black">
            <Sparkles size={26} />
          </div>
          <h1 className="display-type mt-7 text-[5rem] font-bold leading-[0.82]">
            Join reflection
          </h1>
          <p className="mt-5 text-2xl font-semibold leading-8">
            Enter your first name and class code. Your teacher will see your
            reflection as part of the class thinking map.
          </p>
        </div>

        <div className="panel mt-8 grid gap-4 p-6">
          <label className="grid gap-2">
            <span className="text-sm font-black uppercase tracking-[0.08em]">First name</span>
            <input
              autoFocus
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="focus-ring rounded-[24px] border-2 border-black bg-[#fff2b7] px-5 py-4 text-2xl font-bold"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black uppercase tracking-[0.08em]">Class code</span>
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder={initialJoinCode === "DEMO" ? "Demo will create one" : "CODE"}
              className="focus-ring rounded-[24px] border-2 border-black bg-white px-5 py-4 text-2xl font-black tracking-[0.1em]"
            />
          </label>
          {error ? <p className="text-sm font-black text-[#fd4401]">{error}</p> : null}
          <button
            onClick={join}
            disabled={joining || !canJoin}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#fd4401] px-7 py-4 text-xl font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {joining ? "Joining..." : "Begin"}
            <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </main>
  );
}
