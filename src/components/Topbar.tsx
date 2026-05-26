import { Bell, Search, Command, Zap } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
      <div className="flex items-center gap-4 px-5 py-3">
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              placeholder="Buscar revendas, clientes, fluxos…"
              className="w-full pl-9 pr-20 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 focus:bg-white/[0.07] transition"
            />
            <kbd className="hidden lg:flex items-center gap-1 absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">
              <Command className="h-3 w-3" /> K
            </kbd>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-xs text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> Sistemas operando normalmente
          </div>
          <button className="relative h-9 w-9 grid place-items-center rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/40 transition">
            <Zap className="h-4 w-4 text-cyan-300" />
          </button>
          <button className="relative h-9 w-9 grid place-items-center rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/40 transition">
            <Bell className="h-4 w-4 text-slate-300" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#F59E0B]" />
          </button>
          <div className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl bg-white/5 border border-white/10">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500" />
            <div className="hidden md:block leading-tight pr-2">
              <div className="text-xs text-white">Alex Mercer</div>
              <div className="text-[10px] text-slate-400">Admin · Acme Corp</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
