import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FolderTree, FileVideo, Server, Coins, Receipt,
  Package, Store, MessageCircle, Megaphone, Settings, LogIn, Sparkles,
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
    <aside className="hidden lg:flex flex-col w-[232px] shrink-0 h-screen sticky top-0 bg-[#0B0B0C] border-r border-[rgba(255,255,255,0.06)]">
      {/* Brand */}
      <div className="px-5 pt-5 pb-6 flex items-center gap-2.5">
        <div className="relative h-8 w-8 rounded-[10px] bg-gradient-to-br from-[#FFD27A] to-[#FFB020] grid place-items-center shadow-[0_1px_0_rgba(255,255,255,0.3)_inset]">
          <Sparkles className="h-3.5 w-3.5 text-[#0B0B0C]" strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <div className="font-display text-[14px] font-bold text-white tracking-tight">BR Revenda</div>
          <div className="text-[10px] text-[#6B7280] font-medium tracking-wider">IPTV CONTROL</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-6 space-y-5">
        {nav.map((g) => (
          <div key={g.group}>
            <div className="px-3 mb-1.5 label-eyebrow">{g.group}</div>
            <ul className="space-y-0.5">
              {g.items.map(({ to, label, icon: Icon }) => {
                const active = pathname === to;
                return (
                  <li key={to}>
                    <Link to={to} className="relative block" data-handled="true">
                      <div className={`nav-item ${active ? "active" : ""}`}>
                        <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{label}</span>
                        {active && (
                          <motion.span
                            layoutId="sidebar-dot"
                            className="ml-auto h-1 w-1 rounded-full bg-[#FFC247]"
                          />
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Upgrade card */}
      <div className="m-3 p-4 rounded-[16px] bg-[#15171A] border border-[rgba(255,255,255,0.06)] relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#FFC247]/10 blur-3xl" />
        <div className="relative">
          <div className="text-[10px] font-medium tracking-[0.2em] text-[#FFC247]">PRO</div>
          <div className="mt-1.5 text-[13px] font-semibold text-white">Br Revenda Master</div>
          <p className="mt-1 text-[11px] text-[#9CA3AF] leading-relaxed">
            Revendas ilimitadas, WhatsApp API e broadcast.
          </p>
          <button className="mt-3 w-full h-8 text-[12px] rounded-[8px] btn-primary" data-handled="true">
            Fazer upgrade
          </button>
        </div>
      </div>
    </aside>
  );
}
