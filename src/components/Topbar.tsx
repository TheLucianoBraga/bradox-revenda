import { Bell, Search, Command } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 bg-[rgba(11,11,12,0.75)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)]">
      <div className="flex items-center gap-3 px-6 py-3">
        {/* Raycast-style search */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-[420px]">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-[#6B7280]" strokeWidth={1.75} />
            <input
              placeholder="Buscar revendas, clientes, fluxos…"
              className="input-ghost w-full h-9 pl-9 pr-16 rounded-[10px] text-[13px]"
            />
            <kbd className="hidden lg:flex items-center gap-1 absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#9CA3AF] bg-[#0B0B0C] border border-[rgba(255,255,255,0.06)] rounded-[6px] px-1.5 py-0.5 font-medium">
              <Command className="h-2.5 w-2.5" strokeWidth={2} /> K
            </kbd>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Status */}
          <div className="hidden md:flex items-center gap-2 h-8 px-3 rounded-full bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.20)] text-[11px] font-medium text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Operacional
          </div>

          {/* Notifications */}
          <button
            data-handled="true"
            className="relative h-9 w-9 grid place-items-center rounded-[10px] btn-secondary"
          >
            <Bell className="h-[15px] w-[15px] text-[#9CA3AF]" strokeWidth={1.75} />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#FFC247]" />
          </button>

          {/* Avatar */}
          <div className="flex items-center gap-2.5 pl-1 pr-3 h-9 rounded-[10px] bg-[#15171A] border border-[rgba(255,255,255,0.06)]">
            <div className="h-7 w-7 rounded-[8px] bg-gradient-to-br from-[#FFD27A] to-[#FFB020] grid place-items-center text-[#0B0B0C] text-[11px] font-bold">
              AM
            </div>
            <div className="hidden md:block leading-tight">
              <div className="text-[12px] font-medium text-white">Alex Mercer</div>
              <div className="text-[10px] text-[#6B7280]">Administrador</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
