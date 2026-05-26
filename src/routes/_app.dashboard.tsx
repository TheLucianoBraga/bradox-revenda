import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { GlassCard, PageHeader, NeonButton, StatPill } from "@/components/ui-kit";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, CartesianGrid } from "recharts";
import { ArrowUpRight, MessageCircle, Bot, Users, Zap, Plus, Sparkles, Activity, Globe2 } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

const series = Array.from({ length: 24 }, (_, i) => ({
  t: `${i}h`,
  msgs: 200 + Math.round(Math.sin(i / 3) * 80 + Math.random() * 60),
  ai: 120 + Math.round(Math.cos(i / 4) * 60 + Math.random() * 50),
}));
const bars = ["WhatsApp", "Instagram", "Telegram", "E-mail", "Web", "API"].map((c) => ({
  c, v: Math.round(Math.random() * 80 + 20),
}));

function Dashboard() {
  return (
    <>
      <PageHeader
        title="Central de Controle"
        subtitle="Pulso em tempo real de cada canal, cada agente e cada cliente."
        actions={
          <>
            <NeonButton variant="ghost"><span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Ao vivo</span></NeonButton>
            <NeonButton><span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nova automação</span></NeonButton>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        {[
          { label: "Conversas ativas", value: "8.492", delta: "+12,4%", icon: MessageCircle, accent: "cyan" },
          { label: "Resolvidas por IA", value: "73,2%", delta: "+4,1%", icon: Bot, accent: "violet" },
          { label: "Receita mensal", value: "R$ 184.902", delta: "+8,7%", icon: Zap, accent: "emerald" },
          { label: "Revendas", value: "1.204", delta: "+22", icon: Users, accent: "cyan" },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="col-span-12 sm:col-span-6 xl:col-span-3">
            <GlassCard className="p-5 h-full">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
                  <k.icon className="h-5 w-5 text-cyan-300" />
                </div>
                <StatPill value={k.delta} label="vs 7d" accent={k.accent as any} />
              </div>
              <div className="mt-5 font-display text-3xl text-white">{k.value}</div>
              <div className="text-xs text-slate-400 mt-1">{k.label}</div>
              <div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full w-2/3 bg-gradient-to-r from-cyan-400 to-violet-500" />
              </div>
            </GlassCard>
          </motion.div>
        ))}

        <GlassCard className="col-span-12 xl:col-span-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-cyan-300/80">Vazão</div>
              <div className="font-display text-xl text-white">Mensagens · Atendimentos por IA</div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#F59E0B]" /> Mensagens</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_#F97316]" /> IA</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F97316" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="t" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "rgba(11,15,20,0.9)", border: "1px solid rgba(0,216,255,0.3)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="msgs" stroke="#F59E0B" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="ai" stroke="#F97316" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 xl:col-span-4 p-6">
          <div className="text-[10px] tracking-[0.25em] uppercase text-cyan-300/80">Channels</div>
          <div className="font-display text-xl text-white">Volume mix</div>
          <div className="h-72 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="c" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ background: "rgba(11,15,20,0.9)", border: "1px solid rgba(0,216,255,0.3)", borderRadius: 12 }} />
                <defs>
                  <linearGradient id="gb" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#F97316" />
                  </linearGradient>
                </defs>
                <Bar dataKey="v" fill="url(#gb)" radius={[6, 6, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 xl:col-span-7 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-cyan-300/80">Live Feed</div>
              <div className="font-display text-xl text-white">Recent activity</div>
            </div>
            <NeonButton variant="ghost">View all</NeonButton>
          </div>
          <ul className="space-y-2">
            {[
              { who: "Aurora AI", what: "resolved ticket #4821", when: "12s", tag: "AI", color: "violet" },
              { who: "Maya Chen", what: "closed deal · Enterprise · $48,000", when: "2m", tag: "CRM", color: "cyan" },
              { who: "WhatsApp Bot", what: "triggered flow ‘Reactivation 7d’", when: "5m", tag: "Flow", color: "cyan" },
              { who: "Reseller · Lima", what: "provisioned new tenant", when: "11m", tag: "Tenant", color: "emerald" },
              { who: "Instagram", what: "32 DMs auto-replied", when: "18m", tag: "Inbox", color: "violet" },
              { who: "Telegram Bot", what: "broadcast delivered to 12.4k", when: "27m", tag: "Cast", color: "cyan" },
            ].map((r, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition group">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400/40 to-violet-500/40 border border-white/10 grid place-items-center text-[10px] font-display">
                  {r.who.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate"><span className="text-slate-400">{r.who}</span> {r.what}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${r.color === "cyan" ? "border-cyan-400/30 text-cyan-300 bg-cyan-400/5" : r.color === "violet" ? "border-violet-400/30 text-violet-300 bg-violet-400/5" : "border-emerald-400/30 text-emerald-300 bg-emerald-400/5"}`}>{r.tag}</span>
                <span className="text-[10px] text-slate-500 w-8 text-right">{r.when}</span>
              </motion.li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="col-span-12 xl:col-span-5 p-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-cyan-300/80">
              <Sparkles className="h-3 w-3" /> Aurora · AI Co-pilot
            </div>
            <div className="font-display text-xl text-white mt-1">Insights this week</div>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "Reactivation flow lifted 7-day retention by 18.4%.",
                "Latency in Instagram inbox down 240ms — within SLO.",
                "Reseller ‘Aurora Tech’ converted 12 new tenants.",
                "Suggested: throttle Telegram broadcasts after 21:00 UTC.",
              ].map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#F59E0B]" />
                  <span className="text-slate-300">{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2">
              <NeonButton><span className="flex items-center gap-2">Apply suggestions <ArrowUpRight className="h-4 w-4" /></span></NeonButton>
              <NeonButton variant="ghost"><span className="flex items-center gap-2"><Globe2 className="h-4 w-4" /> Full report</span></NeonButton>
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
