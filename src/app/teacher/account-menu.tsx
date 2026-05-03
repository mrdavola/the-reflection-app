"use client";

import { useState } from "react";
import { LogOut, Settings, UserRound } from "lucide-react";

type AccountMenuProps = {
  onSignOut: () => Promise<void> | void;
};

export function AccountMenu({ onSignOut }: AccountMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-5 py-2 text-sm font-bold text-black transition hover:-translate-y-0.5"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserRound size={17} />
        Account
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-[24px] border-2 border-black bg-white p-5 text-left"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.08em] text-black/50">
                Teacher account
              </p>
              <p className="mt-1 text-xl font-black">Pilot teacher</p>
            </div>
            <div className="grid size-10 place-items-center rounded-[14px] border-2 border-black bg-[#04c6c5]">
              <Settings size={18} />
            </div>
          </div>

          <div className="mt-5 grid gap-2 text-sm font-bold">
            <div className="rounded-[18px] border-2 border-black bg-[#fff2b7] px-4 py-3">
              Gemini AI is active for question, reflection, and image generation.
            </div>
            <div className="rounded-[18px] border-2 border-black bg-white px-4 py-3">
              Default student voice minimum is 5 seconds.
            </div>
            <div className="rounded-[18px] border-2 border-black bg-white px-4 py-3">
              Students join by code, link, or QR with name-only identity.
            </div>
          </div>

          <button
            role="menuitem"
            onClick={onSignOut}
            className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-black bg-[#fd4401] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
