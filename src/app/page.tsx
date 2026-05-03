import Link from "next/link";
import { ArrowRight, QrCode, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fdcb40] px-5 py-6 text-black md:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-[16px] border-2 border-black bg-[#04c6c5] text-black">
              <Sparkles size={20} />
            </div>
            <span className="display-type text-3xl font-bold">ReflectAI</span>
          </div>
          <Link
            href="/teacher"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#fd4401] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
          >
            Teacher dashboard
            <ArrowRight size={16} />
          </Link>
        </nav>

        <div className="flex flex-1 flex-col justify-center">
          <div className="grid items-center gap-10 py-14 lg:grid-cols-[1fr_460px]">
          <div>
            <h1 className="display-type max-w-4xl text-[4.6rem] font-bold leading-[0.82] md:text-[7.8rem]">
              Make every student’s thinking visible.
            </h1>
            <p className="mt-8 max-w-2xl text-2xl font-semibold leading-8">
              Launch a See Think Wonder reflection, let students speak or type,
              and watch class patterns become actionable in real time.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/teacher"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-[#fd4401] px-7 py-4 font-bold text-white transition hover:-translate-y-0.5"
              >
                Launch reflection
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/join"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-7 py-4 font-bold text-black transition hover:-translate-y-0.5"
              >
                <QrCode size={18} />
                Student join
              </Link>
            </div>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between border-b border-[#dce7e4] pb-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.08em]">Class pulse</p>
                <p className="display-type text-4xl font-bold">14 of 22 done</p>
              </div>
              <div className="rounded-full border-2 border-black bg-[#04c6c5] px-4 py-2 text-sm font-black">
                STW-482
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 py-5">
              {["See", "Think", "Wonder"].map((label, index) => (
                <div key={label} className="soft-panel min-h-36 p-4">
                  <p className="display-type text-2xl font-bold">{label}</p>
                  <div className="mt-3 space-y-2">
                    {[0, 1, 2].slice(0, 3 - index).map((item) => (
                      <div
                        key={item}
                        className="h-9 rounded-full border-2 border-black bg-white"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-[24px] border-2 border-black bg-[#fff2b7] p-5">
              <p className="text-sm font-black uppercase tracking-[0.08em]">Next move</p>
              <p className="mt-2 text-base font-bold leading-6">
                Ask students to connect one observation to evidence before
                writing their claim.
              </p>
            </div>
          </div>
          </div>
        </div>
      </section>
    </main>
  );
}
