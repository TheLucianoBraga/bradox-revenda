import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FolderTree, FileVideo, Server, Coins, Receipt,
  Package, Store, MessageCircle, Megaphone, Settings, LogIn, Sparkles,
  MessageSquareText,
} from "lucide-react";

const nav = [
  { group: "Overview", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { group: "Conteúdo", items: [
    { to: "/categorias", label: "Categorias", icon: FolderTree },
    { to: "/posts", label: "Posts & Mídias", icon: FileVideo },
  ]},
  { group: "Operação", items: [
    { to: "/revendas", label: "Revendas", icon: Store },
    { to: "/servidores", label: "Servidores", icon: Server },
  ]},
  { group: "Cobrança", items: [
    { to: "/planos", label: "Planos", icon: Package },
    { to: "/creditos", label: "Créditos", icon: Coins },
    { to: "/pagamentos", label: "Pagamentos", icon: Receipt },
  ]},
  { group: "WhatsApp", items: [
    { to: "/wa-conexao", label: "Conexão API", icon: MessageCircle },
    { to: "/templates", label: "Templates", icon: MessageSquareText },
    { to: "/broadcast", label: "Envio em Massa", icon: Megaphone },
  ]},
  { group: "Sistema", items: [
    { to: "/settings", label: "Configurações", icon: Settings },
    { to: "/login", label: "Entrar", icon: LogIn },
  ]},
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden lg:flex relative z-20 shrink-0 w-[244px] h-screen sticky top-0 p-3">
      <div className="flex flex-col w-full h-full glass-float rounded-[18px] overflow-hidden">
        {/* Brand */}
        <div className="px-4 pt-4 pb-5 flex items-center gap-2.5">
          <div className="relative h-8 w-8 rounded-[9px] grid place-items-center
                          bg-gradient-to-br from-[#E0B45C] to-[#A8791E]
                          shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_4px_12px_-4px_rgba(214,168,79,0.5)]">
            <Sparkles className="h-3.5 w-3.5 text-[#1A1308]" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-[15px] font-semibold text-white tracking-[-0.025em]">BR Revenda</div>
            <div className="text-[9.5px] text-[#52525B] font-semibold tracking-[0.18em] uppercase mt-1">IPTV Control</div>
          </div>
        </div>

        <div className="hairline mx-3" />

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-2.5 pt-4 pb-4 space-y-4">
          {nav.map((g) => (
            <div key={g.group}>
              <div className="px-2.5 mb-1 label-eyebrow">{g.group}</div>
              <ul className="space-y-px">
                {g.items.map(({ to, label, icon: Icon }) => {
                  const active = pathname === to;
                  return (
                    <li key={to}>
                      <Link to={to} className="relative block" data-handled="true">
                        {active && (
                          <motion.span
                            layoutId="sidebar-rail"
                            className="absolute -left-[7px] top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-full"
                            style={{
                              background: "linear-gradient(180deg,#E8C886,#B98A3D)",
                              boxShadow: "0 0 12px rgba(224,188,114,0.55), 0 0 2px rgba(224,188,114,0.9)",
                            }}
                            transition={{ type: "spring", stiffness: 320, damping: 28 }}
                          />
                        )}
                        <div className={`nav-item ${active ? "active" : ""}`}>
                          <Icon className="h-[15px] w-[15px] shrink-0 opacity-90" strokeWidth={1.5} />
                          <span className="truncate">{label}</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>


        {/* Upgrade dock — luxury gradient border */}
        <div className="m-2.5 pro-card">
          <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-[#D6A84F]/15 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[#E8C886]" strokeWidth={2} />
              <div className="text-[9.5px] font-semibold tracking-[0.22em] text-[#E8C886]">PRO</div>
            </div>
            <div className="mt-1.5 text-[12.5px] font-semibold text-white tracking-[-0.01em]">Br Revenda Master</div>
            <p className="mt-1 text-[10.5px] text-[#A1A1AA] leading-relaxed">
              Revendas ilimitadas, WhatsApp API e broadcast.
            </p>
            <button className="mt-3 w-full py-1.5 text-[11.5px] rounded-[8px] btn-primary" data-handled="true">
              Fazer upgrade
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
}
