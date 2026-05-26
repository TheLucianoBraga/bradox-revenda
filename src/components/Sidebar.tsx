import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Kanban, Bot, MessageCircle, Instagram, CreditCard,
  Workflow, Send, Users, Store, BarChart3, Settings, Sparkles, LogIn,
} from "lucide-react";

const nav = [
  { group: "Overview", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
  ]},
  { group: "Workspace", items: [
    { to: "/crm", label: "CRM Kanban", icon: Kanban },
    { to: "/ai-chat", label: "AI Chat", icon: Bot },
    { to: "/automation", label: "Automation Flows", icon: Workflow },
  ]},
  { group: "Inboxes", items: [
    { to: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
    { to: "/instagram", label: "Instagram", icon: Instagram },
    { to: "/telegram", label: "Telegram", icon: Send },
  ]},
  { group: "Business", items: [
    { to: "/billing", label: "Billing", icon: CreditCard },
    { to: "/customers", label: "Customer Portal", icon: Users },
    { to: "/reseller", label: "Reseller Portal", icon: Store },
  ]},
  { group: "System", items: [
    { to: "/settings", label: "Settings", icon: Settings },
    { to: "/login", label: "Login", icon: LogIn },
  ]},
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 glass-strong border-r border-white/5">
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 grid place-items-center glow-cyan">
          <Sparkles className="h-4 w-4 text-black" />
        </div>
        <div>
          <div className="font-display text-sm tracking-widest text-white">NEXUS</div>
          <div className="text-[10px] text-slate-400 tracking-[0.3em]">OS · v2.6</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-6 space-y-5">
        {nav.map((g) => (
          <div key={g.group}>
            <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.25em] text-slate-500">{g.group}</div>
            <ul className="space-y-1">
              {g.items.map(({ to, label, icon: Icon }) => {
                const active = pathname === to;
                return (
                  <li key={to}>
                    <Link to={to} className="relative block">
                      {active && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/15 to-violet-500/10 border border-cyan-400/30"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                      <div className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "text-white" : "text-slate-400 hover:text-white"}`}>
                        <Icon className={`h-4 w-4 ${active ? "text-cyan-300" : ""}`} />
                        <span>{label}</span>
                        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#00E5FF]" />}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="m-3 p-4 rounded-2xl glass border-gradient relative overflow-hidden">
        <div className="text-xs font-display text-cyan-300 tracking-widest">UPGRADE</div>
        <div className="mt-1 text-sm text-white">Nexus Quantum</div>
        <p className="mt-1 text-xs text-slate-400">Unlimited agents · White-label · Priority AI</p>
        <button className="mt-3 w-full text-xs py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-medium">Go Pro</button>
      </div>
    </aside>
  );
}
