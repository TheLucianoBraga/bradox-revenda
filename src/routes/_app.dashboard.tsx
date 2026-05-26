import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, CartesianGrid, Line, LineChart } from "recharts";
import { ArrowUpRight, MessageCircle, Bot, Users, Zap, Plus, Sparkles, Activity, Globe2, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

const series = Array.from({ length: 24 }, (_, i) => ({
  t: `${i}h`,
  msgs: 200 + Math.round(Math.sin(i / 3) * 80 + Math.random() * 60),
  ai: 120 + Math.round(Math.cos(i / 4) * 60 + Math.random() * 50),
}));
const bars = ["WhatsApp", "Instagram", "Telegram", "E-mail", "Web", "API"].map((c) => ({
  c, v: Math.round(Math.random() * 80 + 20),
}));

// 7-day trend sparklines, one per KPI
const makeSpark = (base: number, vol: number) =>
  Array.from({ length: 7 }, (_, i) => ({ d: i, v: Math.round(base + Math.sin(i / 1.4) * vol + Math.random() * vol * 0.6) }));

type Trend = "up" | "gold" | "down";
type Kpi = {
  label: string; value: string; delta: string; trend: Trend;
  icon: typeof MessageCircle; spark: { d: number; v: number }[]; stroke: string;
};

const kpis: Kpi[] = [
  { label: "Conversas ativas", value: "8.492", delta: "+12,4%", trend: "up",
    icon: MessageCircle, spark: makeSpark(120, 40), stroke: "#6EE7B7" },
  { label: "Resolvidas por IA", value: "73,2%", delta: "+4,1%", trend: "up",
    icon: Bot, spark: makeSpark(80, 25), stroke: "#6EE7B7" },
  { label: "Receita mensal", value: "R$ 184.902", delta: "+8,7%", trend: "gold",
    icon: Zap, spark: makeSpark(140, 50), stroke: "#E8C886" },
  { label: "Revendas", value: "1.204", delta: "+22", trend: "up",
    icon: Users, spark: makeSpark(60, 18), stroke: "#6EE7B7" },
];

function Dashboard() {
  return (
    <>
      <PageHeader
        title="Central de Controle"
        subtitle="Pulso em tempo real de cada canal, cada agente e cada cliente."
        actions={
          <>
            <NeonButton variant="ghost"><span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Ao vivo</span></NeonButton>
            <Link to="/revendas" data-handled="true">
              <NeonButton><span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nova revenda</span></NeonButton>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="col-span-12 sm:col-span-6 xl:col-span-3">
            <GlassCard className="p-5 h-full">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/10 grid place-items-center">
                  <k.icon className="h-[18px] w-[18px] text-[#E0BC72]" strokeWidth={1.6} />
                </div>
                <span className={`pill-delta ${k.trend}`}>
                  <TrendingUp className="h-3 w-3" strokeWidth={2} />
                  {k.delta}<span className="opacity-70 font-normal ml-0.5">vs 7d</span>
                </span>
              </div>
              <div className="mt-5 metric-number font-display text-[30px] leading-none tracking-[-0.025em] font-semibold">
                {k.value}
              </div>
              <div className="text-[12px] text-[#A1A1AA] mt-2">{k.label}</div>
              <div className="mt-3 h-[34px] -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={k.spark}>
                    <defs>
                      <linearGradient id={`sp-${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={k.stroke} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={k.stroke} stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <Line type="monotone" dataKey="v" stroke={`url(#sp-${i})`} strokeWidth={1.75} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
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
          <div className="text-[10px] tracking-[0.25em] uppercase text-cyan-300/80">Canais</div>
          <div className="font-display text-xl text-white">Distribuição de volume</div>
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
              <div className="text-[10px] tracking-[0.25em] uppercase text-cyan-300/80">Feed ao vivo</div>
              <div className="font-display text-xl text-white">Atividade recente</div>
            </div>
            <NeonButton variant="ghost">Ver tudo</NeonButton>
          </div>
          <ul className="space-y-2">
            {[
              { who: "Aurora IA", what: "resolveu o ticket #4821", when: "12s", tag: "IA", color: "violet" },
              { who: "Maya Chen", what: "fechou negócio · Enterprise · R$ 48.000", when: "2m", tag: "CRM", color: "cyan" },
              { who: "Bot WhatsApp", what: "disparou o fluxo ‘Reativação 7d’", when: "5m", tag: "Fluxo", color: "cyan" },
              { who: "Revenda · Lima", what: "provisionou nova revenda", when: "11m", tag: "Revenda", color: "emerald" },
              { who: "Instagram", what: "32 DMs respondidos automaticamente", when: "18m", tag: "Caixa", color: "violet" },
              { who: "Bot Telegram", what: "broadcast entregue para 12,4 mil", when: "27m", tag: "Envio", color: "cyan" },
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
              <Sparkles className="h-3 w-3" /> Aurora · Copiloto IA
            </div>
            <div className="font-display text-xl text-white mt-1">Insights da semana</div>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "Fluxo de reativação elevou a retenção de 7 dias em 18,4%.",
                "Latência da caixa do Instagram caiu 240ms — dentro do SLO.",
                "Revenda ‘Aurora Tech’ converteu 12 novos clientes.",
                "Sugestão: limitar broadcasts no Telegram após 21:00.",
              ].map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#F59E0B]" />
                  <span className="text-slate-300">{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2">
              <NeonButton><span className="flex items-center gap-2">Aplicar sugestões <ArrowUpRight className="h-4 w-4" /></span></NeonButton>
              <NeonButton variant="ghost"><span className="flex items-center gap-2"><Globe2 className="h-4 w-4" /> Relatório completo</span></NeonButton>
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
