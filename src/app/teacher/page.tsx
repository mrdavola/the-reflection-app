"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, MessageCircle, Play, Plus, Sparkles } from "lucide-react";
import type { Session } from "@/lib/models";

export default function TeacherPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadSessions() {
    const response = await fetch("/api/sessions", { cache: "no-store" });
    const data = await response.json();
    setSessions(data.sessions ?? []);
    setLoading(false);
  }

  async function seedDemo() {
    setLoading(true);
    const response = await fetch("/api/demo/seed", { method: "POST" });
    const data = await response.json();
    await loadSessions();
    if (data.session?.id) {
      window.location.href = `/teacher/session/${data.session.id}/live`;
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/sessions", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setSessions(data.sessions ?? []);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#fdcb40] px-5 py-6 text-black md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-[16px] border-2 border-black bg-[#04c6c5] text-black">
                <Sparkles size={20} />
              </div>
              <span className="display-type text-3xl font-bold">ReflectAI</span>
            </div>
            <h1 className="display-type mt-10 max-w-4xl text-[4.6rem] font-bold leading-[0.85] md:text-[7rem]">
              Make thinking visible.
            </h1>
            <p className="mt-6 max-w-2xl text-2xl font-semibold leading-8">
              Launch a reflection, project the join code, and watch thinking
              patterns emerge while students finish.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={seedDemo}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-7 py-4 font-bold text-black transition hover:-translate-y-0.5"
            >
              <Play size={18} />
              Seed demo
            </button>
            <Link
              href="/teacher/new"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#fd4401] px-7 py-4 font-bold text-white transition hover:-translate-y-0.5"
            >
              <Plus size={18} />
              New reflection
            </Link>
            <Link
              href="/teacher/exit-ticket/new"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#006cff] px-7 py-4 font-bold text-white transition hover:-translate-y-0.5"
            >
              <MessageCircle size={18} />
              Exit ticket
            </Link>
          </div>
        </header>

        <section className="mt-10 grid gap-4">
          {loading ? (
            <div className="panel p-8 text-xl font-bold">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="panel p-10">
              <p className="display-type text-4xl font-bold">No sessions yet</p>
              <p className="mt-3 max-w-xl text-xl font-semibold leading-7">
                Create a See Think Wonder reflection or seed a demo session with
                sample student thinking.
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <Link
                key={session.id}
                href={`/teacher/session/${session.id}/live`}
                className="panel flex flex-wrap items-center justify-between gap-4 p-7 transition hover:-translate-y-0.5 hover:bg-[#fff2b7]"
              >
                <div>
                  <p className="display-type text-4xl font-bold">{session.title}</p>
                  <p className="mt-2 text-lg font-bold">
                    {session.doneCount} done · {session.joinedCount} joined · Code{" "}
                    {session.joinCode}
                  </p>
                </div>
                <ArrowRight className="text-[#006cff]" />
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
