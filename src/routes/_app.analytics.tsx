import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { Area, AreaChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, RadialBar, RadialBarChart, PolarAngleAxis, LineChart, Line } from "recharts";

export const Route = createFileRoute("/_app/analytics")({ component: Analytics });

const ts = Array.from({ length: 30 }, (_, i) => ({
  d: `D${i + 1}`,
  rev: 4000 + Math.round(Math.sin(i / 4) * 1200 + i * 90 + Math.random() * 400),
  users: 2000 + Math.round(Math.cos(i / 5) * 800 + i * 50 + Math.random() * 300),
}));
const ring = [{ name: "Goal", value: 73, fill: "#F59E0B" }];

function Analytics() {
  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Revenue, retention, AI quality and channel performance — at quantum resolution."
        actions={<NeonButton>Export report</NeonButton>}
      />

      <div className="grid grid-cols-12 gap-5">
        <GlassCard className="col-span-12 xl:col-span-8 p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-cyan-300/80">Revenue</div>
              <div className="font-display text-xl text-white">Last 30 days</div>
            </div>
            <div className="font-display text-2xl text-white">$486,902</div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ts}>
                <defs>
                  <linearGradient id="ar1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="d" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "rgba(11,15,20,0.9)", border: "1px solid rgba(0,216,255,0.3)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="rev" stroke="#F59E0B" strokeWidth={2} fill="url(#ar1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 xl:col-span-4 p-6">
          <div className="text-[10px] tracking-[0.25em] uppercase text-cyan-300/80">AI quality</div>
          <div className="font-display text-xl text-white">Aurora score</div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={ring} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background={{ fill: "rgba(255,255,255,0.06)" }} dataKey="value" cornerRadius={20} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="-mt-32 text-center font-display text-4xl text-white">73<span className="text-base text-slate-400">/100</span></div>
          <div className="mt-32 text-center text-xs text-slate-400">+4.1% vs last week · top quartile</div>
        </GlassCard>

        <GlassCard className="col-span-12 xl:col-span-6 p-6">
          <div className="text-[10px] tracking-[0.25em] uppercase text-cyan-300/80">Active users</div>
          <div className="font-display text-xl text-white">DAU vs WAU</div>
          <div className="h-64 mt-2">
            <ResponsiveContainer>
              <LineChart data={ts}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="d" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "rgba(11,15,20,0.9)", border: "1px solid rgba(0,216,255,0.3)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="users" stroke="#F97316" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="rev" stroke="#F59E0B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 xl:col-span-6 p-6">
          <div className="text-[10px] tracking-[0.25em] uppercase text-cyan-300/80">Top flows</div>
          <div className="font-display text-xl text-white mb-3">Performance</div>
          <ul className="divide-y divide-white/5">
            {[
              { n: "Reactivation · 7d", r: "18.4%", v: 86 },
              { n: "Welcome series", r: "12.1%", v: 72 },
              { n: "Abandoned cart", r: "9.6%", v: 58 },
              { n: "Renewal nudge", r: "7.8%", v: 49 },
              { n: "Upsell · Quantum", r: "6.2%", v: 41 },
            ].map((f, i) => (
              <li key={i} className="py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white">{f.n}</span>
                  <span className="text-cyan-300">{f.r}</span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${f.v}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </>
  );
}
