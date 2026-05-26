import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { Plus, Play, Pause, Webhook, MessageCircle, Bot, Filter, Clock, GitBranch, Zap } from "lucide-react";

export const Route = createFileRoute("/_app/automation")({ component: Automation });

function Automation() {
  const nodes = [
    { x: 40, y: 90, w: 200, h: 92, title: "Trigger", sub: "WhatsApp · message_received", icon: MessageCircle, color: "from-emerald-400 to-cyan-400" },
    { x: 300, y: 60, w: 200, h: 92, title: "Filter", sub: "Tag = ‘dormant 7d’", icon: Filter, color: "from-cyan-400 to-sky-500" },
    { x: 300, y: 200, w: 200, h: 92, title: "AI Decision", sub: "Aurora · intent classifier", icon: Bot, color: "from-violet-400 to-fuchsia-500" },
    { x: 580, y: 60, w: 200, h: 92, title: "Delay", sub: "Wait 12h", icon: Clock, color: "from-amber-400 to-orange-500" },
    { x: 580, y: 200, w: 200, h: 92, title: "Branch", sub: "If reply → handoff", icon: GitBranch, color: "from-pink-400 to-violet-500" },
    { x: 840, y: 130, w: 200, h: 92, title: "Webhook", sub: "POST /api/crm/deal", icon: Webhook, color: "from-cyan-400 to-violet-500" },
  ];
  const edges = [
    { from: 0, to: 1 }, { from: 0, to: 2 },
    { from: 1, to: 3 }, { from: 2, to: 4 },
    { from: 3, to: 5 }, { from: 4, to: 5 },
  ];

  return (
    <>
      <PageHeader
        title="Automation Flows"
        subtitle="Visual canvas to orchestrate omnichannel journeys with AI in the loop."
        actions={
          <>
            <NeonButton variant="ghost"><span className="flex items-center gap-2"><Play className="h-4 w-4" /> Test</span></NeonButton>
            <NeonButton><span className="flex items-center gap-2"><Plus className="h-4 w-4" /> New flow</span></NeonButton>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        <GlassCard className="col-span-12 lg:col-span-3 p-4">
          <div className="text-[10px] tracking-[0.25em] uppercase text-slate-500 mb-3">Library</div>
          <div className="space-y-2">
            {[
              { i: MessageCircle, l: "WhatsApp trigger" },
              { i: Bot, l: "AI step" },
              { i: Filter, l: "Filter" },
              { i: Clock, l: "Delay" },
              { i: GitBranch, l: "Branch" },
              { i: Webhook, l: "Webhook" },
              { i: Zap, l: "Action" },
            ].map((b) => (
              <div key={b.l} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/40 cursor-grab transition">
                <div className="h-7 w-7 rounded-md bg-gradient-to-br from-cyan-400/40 to-violet-500/40 grid place-items-center">
                  <b.i className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm text-slate-200">{b.l}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-9 p-0 overflow-hidden relative h-[560px]">
          <div className="absolute inset-0 grid-bg opacity-50" />
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <span className="text-[10px] tracking-[0.25em] uppercase text-cyan-300/80">Flow</span>
            <span className="font-display text-white">Reactivation · Q3</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/30 text-emerald-300 bg-emerald-400/5 ml-2">Live</span>
          </div>
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <NeonButton variant="ghost"><Pause className="h-4 w-4" /></NeonButton>
          </div>

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1080 560" preserveAspectRatio="none">
            <defs>
              <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00E5FF" />
                <stop offset="100%" stopColor="#9333EA" />
              </linearGradient>
            </defs>
            {edges.map((e, i) => {
              const a = nodes[e.from], b = nodes[e.to];
              const x1 = a.x + a.w, y1 = a.y + a.h / 2;
              const x2 = b.x, y2 = b.y + b.h / 2;
              const mx = (x1 + x2) / 2;
              return <path key={i} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} stroke="url(#edge)" strokeWidth="1.5" fill="none" />;
            })}
          </svg>

          {nodes.map((n, i) => (
            <div key={i}
              style={{ left: n.x, top: n.y, width: n.w, height: n.h }}
              className="absolute rounded-xl glass-strong border border-white/10 p-3 hover:border-cyan-400/50 transition">
              <div className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-md bg-gradient-to-br ${n.color} grid place-items-center`}>
                  <n.icon className="h-3.5 w-3.5 text-black" />
                </div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-slate-400">{n.title}</div>
              </div>
              <div className="mt-2 text-sm text-white leading-tight">{n.sub}</div>
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#00E5FF]" />
              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-violet-400 shadow-[0_0_10px_#9333EA]" />
            </div>
          ))}
        </GlassCard>
      </div>
    </>
  );
}
