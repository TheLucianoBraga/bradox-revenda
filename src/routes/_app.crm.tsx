import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { Plus, MoreHorizontal, DollarSign, Clock, User } from "lucide-react";

export const Route = createFileRoute("/_app/crm")({ component: CRM });

type Card = { id: string; title: string; company: string; value: string; owner: string; age: string; tag: string };
const cols: { name: string; accent: string; cards: Card[] }[] = [
  { name: "Discovery", accent: "from-slate-400/40 to-slate-500/0", cards: [
    { id: "D1", title: "Series B AI ops platform", company: "Helix Robotics", value: "$48k", owner: "MC", age: "2d", tag: "Inbound" },
    { id: "D2", title: "White-label reseller deal", company: "Lima Telco", value: "$12k", owner: "JR", age: "5d", tag: "Reseller" },
    { id: "D3", title: "WhatsApp automation pilot", company: "Acme Retail", value: "$6k", owner: "SK", age: "1d", tag: "Pilot" },
  ]},
  { name: "Qualified", accent: "from-cyan-400/60 to-cyan-500/0", cards: [
    { id: "Q1", title: "Enterprise CRM migration", company: "Nimbus Cloud", value: "$92k", owner: "AM", age: "4d", tag: "Enterprise" },
    { id: "Q2", title: "Multi-tenant rollout", company: "Vertex Group", value: "$140k", owner: "MC", age: "7d", tag: "Strategic" },
  ]},
  { name: "Proposal", accent: "from-violet-400/60 to-violet-500/0", cards: [
    { id: "P1", title: "AI agents · 250 seats", company: "Orbit Bank", value: "$320k", owner: "JR", age: "3d", tag: "AI" },
    { id: "P2", title: "Instagram inbox expansion", company: "Studio Noir", value: "$24k", owner: "SK", age: "2d", tag: "Inbox" },
    { id: "P3", title: "Telegram automation flows", company: "DAO Wave", value: "$18k", owner: "AM", age: "6d", tag: "Web3" },
  ]},
  { name: "Won", accent: "from-emerald-400/60 to-emerald-500/0", cards: [
    { id: "W1", title: "Annual license renewal", company: "Pulse Health", value: "$76k", owner: "MC", age: "1d", tag: "Renewal" },
    { id: "W2", title: "Reseller territory deal", company: "Aurora Tech", value: "$54k", owner: "JR", age: "3d", tag: "Reseller" },
  ]},
];

function CRM() {
  return (
    <>
      <PageHeader
        title="CRM · Pipeline"
        subtitle="Drag deals between stages. Every change syncs across channels in real-time."
        actions={<NeonButton><span className="flex items-center gap-2"><Plus className="h-4 w-4" /> New deal</span></NeonButton>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cols.map((col, ci) => (
          <div key={col.name} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-8 rounded-full bg-gradient-to-r ${col.accent}`} />
                <span className="font-display text-sm tracking-widest text-white uppercase">{col.name}</span>
                <span className="text-xs text-slate-500">{col.cards.length}</span>
              </div>
              <button className="text-slate-500 hover:text-white"><Plus className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3 min-h-[120px]">
              {col.cards.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.05 + i * 0.04 }}>
                  <GlassCard className="p-4 cursor-grab active:cursor-grabbing">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[10px] uppercase tracking-widest text-cyan-300/80">{c.tag}</div>
                      <MoreHorizontal className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="mt-1 text-sm text-white leading-tight">{c.title}</div>
                    <div className="mt-1 text-xs text-slate-400">{c.company}</div>
                    <div className="mt-4 flex items-center justify-between text-[11px] text-slate-300">
                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3 text-cyan-300" /> {c.value}</span>
                      <span className="flex items-center gap-1 text-slate-500"><Clock className="h-3 w-3" /> {c.age}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-5 w-5 rounded-md bg-gradient-to-br from-cyan-400 to-violet-500 grid place-items-center text-[9px] text-black font-semibold">{c.owner}</span>
                      </span>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
              <button className="w-full py-3 rounded-2xl border border-dashed border-white/10 text-xs text-slate-500 hover:border-cyan-400/40 hover:text-cyan-300 transition flex items-center justify-center gap-2">
                <Plus className="h-3.5 w-3.5" /> Add deal
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
