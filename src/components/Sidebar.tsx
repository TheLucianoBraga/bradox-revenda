import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, type ComponentType } from "react";
import {
  LayoutDashboard, FolderTree, FileVideo, Server, Coins, Receipt,
  Package, Users, MessageCircle, Megaphone, Settings, Sparkles,
  MessageSquareText, Network, Wrench,
} from "lucide-react";
import { useAppSession } from "@/contexts/AppSessionContext";

export type AppRole = "admin" | "revenda" | "cliente";
export type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  roles: AppRole[];
  showInBottomNav?: AppRole[];
};
type NavGroup = { group: string; items: NavItem[] };

const nav: NavGroup[] = [
  { group: "Overview", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "revenda", "cliente"], showInBottomNav: ["cliente"] },
  ]},
  { group: "Conteúdo", items: [
    { to: "/categorias", label: "Categorias", icon: FolderTree, roles: ["admin", "revenda"] },
    { to: "/posts", label: "Posts & Mídias", icon: FileVideo, roles: ["admin", "revenda", "cliente"], showInBottomNav: ["admin", "revenda", "cliente"] },
  ]},
  { group: "Operação", items: [
    { to: "/redes", label: "Redes", icon: Network, roles: ["admin"] },
    { to: "/usuarios", label: "Usuarios", icon: Users, roles: ["admin", "revenda"] },
    { to: "/servidores", label: "Servidores", icon: Server, roles: ["admin", "revenda"] },
    { to: "/ferramentas", label: "Ferramentas", icon: Wrench, roles: ["admin", "revenda"], showInBottomNav: ["admin", "revenda"] },
  ]},
  { group: "Cobrança", items: [
    { to: "/planos", label: "Planos", icon: Package, roles: ["admin", "revenda", "cliente"], showInBottomNav: ["cliente"] },
    { to: "/creditos", label: "Créditos", icon: Coins, roles: ["admin", "revenda", "cliente"], showInBottomNav: ["cliente"] },
    { to: "/pagamentos", label: "Pagamentos", icon: Receipt, roles: ["admin", "revenda", "cliente"], showInBottomNav: ["admin", "revenda", "cliente"] },
  ]},
  { group: "WhatsApp", items: [
    { to: "/wa-conexao", label: "Conexão API", icon: MessageCircle, roles: ["admin", "revenda"] },
    { to: "/templates", label: "Templates", icon: MessageSquareText, roles: ["admin", "revenda"] },
    { to: "/broadcast", label: "Envio em Massa", icon: Megaphone, roles: ["admin", "revenda"], showInBottomNav: ["admin", "revenda"] },
  ]},
  { group: "Sistema", items: [
    { to: "/settings", label: "Configurações", icon: Settings, roles: ["admin", "revenda"] },
  ]},
];

export function getBottomNavItems(role: AppRole): NavItem[] {
  return nav
    .flatMap((group) => group.items)
    .filter((item) => item.roles.includes(role) && item.showInBottomNav?.includes(role));
}

export function SidebarBody({ onNavigate, excludePaths }: { onNavigate?: () => void; excludePaths?: string[] }) {
  const { profile } = useAppSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = (profile?.role ?? "cliente") as AppRole;
  const blockedPaths = new Set(excludePaths ?? []);
  const groups = useMemo(() => nav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role) && !blockedPaths.has(item.to)),
    }))
    .filter((group) => group.items.length > 0), [blockedPaths, role]);

  return (
    <div className="flex flex-col w-full h-full glass-float rounded-[18px] overflow-hidden">
      <div className="px-4 pt-4 pb-5 flex items-center gap-2.5">
        <img src="/bradox-play-logo.png" alt="Bradox Play" className="h-10 w-10 object-contain drop-shadow-[0_0_14px_rgba(214,168,79,0.3)]" />
        <div className="leading-tight">
          <div className="font-display text-[15px] font-semibold text-white tracking-[-0.025em]">Bradox Play</div>
          <div className="text-[9.5px] text-[#52525B] font-semibold tracking-[0.18em] uppercase mt-1">Tv Online Control</div>
        </div>
      </div>

      <div className="hairline mx-3" />

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2.5 pt-4 pb-4 space-y-4">
        {groups.map((g) => (
          <div key={g.group}>
            <div className="px-2.5 mb-1 label-eyebrow">{g.group}</div>
            <ul className="space-y-px">
              {g.items.map(({ to, label, icon: Icon }) => {
                const active = pathname === to;
                return (
                  <li key={to}>
                    <Link to={to} className="relative block" data-handled="true" onClick={onNavigate}>
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

      <div className="m-2.5 pro-card">
        <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-[#D6A84F]/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[#E8C886]" strokeWidth={2} />
            <div className="text-[9.5px] font-semibold tracking-[0.22em] text-[#E8C886]">PRO</div>
          </div>
          <div className="mt-1.5 text-[12.5px] font-semibold text-white tracking-[-0.01em]">Bradox Play Master</div>
          <p className="mt-1 text-[10.5px] text-[#A1A1AA] leading-relaxed">
            Revendas ilimitadas, WhatsApp API e broadcast.
          </p>
          <button className="mt-3 w-full py-1.5 text-[11.5px] rounded-[8px] btn-primary" data-handled="true">
            Fazer upgrade
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex relative z-20 shrink-0 w-[244px] h-screen sticky top-0 p-3">
      <SidebarBody />
    </aside>
  );
}
