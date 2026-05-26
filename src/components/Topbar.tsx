import { Bell, Search, Command } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30">
      <div className="mx-3 mt-3 rounded-[14px] glass-strong shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-16px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <MobileNav />
          {/* Raycast-style command bar */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-[460px]">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[13px] w-[13px] text-[#71717A]" strokeWidth={1.6} />
              <input
                placeholder="Pesquisar ou executar comando…"
                className="input-ghost w-full h-10 pl-10 pr-16 rounded-[11px] text-[13.5px] font-display tracking-[-0.012em] placeholder:font-sans placeholder:font-normal"
              />
              <kbd className="hidden lg:flex items-center gap-1 absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#A1A1AA]
                              bg-[rgba(0,0,0,0.35)] border border-[rgba(255,255,255,0.06)] rounded-[6px] px-1.5 py-0.5 font-medium font-mono">
                <Command className="h-2.5 w-2.5" strokeWidth={2} /> K
              </kbd>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Status */}
            <div className="hidden md:flex items-center gap-2 h-8 px-3 rounded-full
                            bg-[rgba(34,197,94,0.07)] border border-[rgba(34,197,94,0.18)]
                            text-[10.5px] font-medium text-emerald-300 tracking-wide">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Operacional
            </div>

            <button
              data-handled="true"
              className="relative h-9 w-9 grid place-items-center rounded-[10px] btn-secondary"
            >
              <Bell className="h-[14px] w-[14px] text-[#A1A1AA]" strokeWidth={1.6} />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#D6A84F] shadow-[0_0_6px_rgba(214,168,79,0.7)]" />
            </button>

            <div className="flex items-center gap-2.5 pl-1 pr-3 h-9 rounded-[10px]
                            bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_60%),var(--surface)]
                            border border-[rgba(255,255,255,0.06)]
                            shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
              <div className="h-7 w-7 rounded-[7px] grid place-items-center text-[11px] font-bold text-[#1A1308]
                              bg-gradient-to-br from-[#E0B45C] to-[#A8791E]
                              shadow-[0_1px_0_rgba(255,255,255,0.3)_inset]">
                AM
              </div>
              <div className="hidden md:block leading-tight">
                <div className="text-[11.5px] font-semibold text-white tracking-[-0.005em]">Alex Mercer</div>
                <div className="text-[9.5px] text-[#71717A]">Administrador</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
