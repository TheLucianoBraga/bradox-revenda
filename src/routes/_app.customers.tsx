import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader, NeonButton, StatPill } from "@/components/ui-kit";
import { Search, Mail, Phone, Building2, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/_app/customers")({ component: Customers });

const customers = [
  { name: "Maya Chen", co: "Helix Robotics", plan: "Quantum", mrr: "$4,800", health: 96, status: "Active" },
  { name: "Jared Park", co: "Nimbus Cloud", plan: "Pro", mrr: "$1,200", health: 78, status: "Active" },
  { name: "Sara Kim", co: "Studio Noir", plan: "Pro", mrr: "$1,200", health: 88, status: "Active" },
  { name: "Alex Mercer", co: "Orbit Bank", plan: "Quantum", mrr: "$12,400", health: 92, status: "Active" },
  { name: "Dana Liu", co: "Pulse Health", plan: "Quantum", mrr: "$7,600", health: 64, status: "At risk" },
  { name: "Ravi Shah", co: "Vertex Group", plan: "Pro", mrr: "$1,200", health: 81, status: "Active" },
];

function Customers() {
  return (
    <>
      <PageHeader
        title="Customer Portal"
        subtitle="Every tenant, every contract, every health score — in one console."
        actions={<NeonButton>Invite tenant</NeonButton>}
      />
      <div className="grid grid-cols-12 gap-5 mb-6">
        {[
          { l: "Tenants", v: "1,204" },
          { l: "Active seats", v: "18,902" },
          { l: "Net retention", v: "118%" },
          { l: "At risk", v: "23" },
        ].map((s, i) => (
          <GlassCard key={i} className="col-span-6 md:col-span-3 p-5">
            <div className="text-xs text-slate-400">{s.l}</div>
            <div className="font-display text-2xl text-white mt-1">{s.v}</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input placeholder="Search customers" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-400/40" />
          </div>
          <StatPill value="6" label="results" />
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-[11px] uppercase tracking-widest text-slate-400">
              <tr>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Plan</th>
                <th className="text-left px-4 py-3">MRR</th>
                <th className="text-left px-4 py-3">Health</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {customers.map((c, i) => (
                <tr key={i} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500" />
                      <div>
                        <div className="text-white">{c.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1"><Building2 className="h-3 w-3" /> {c.co}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full border border-cyan-400/30 text-cyan-300 bg-cyan-400/5">{c.plan}</span></td>
                  <td className="px-4 py-3 text-white">{c.mrr}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 w-40">
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className={`h-full ${c.health > 80 ? "bg-gradient-to-r from-cyan-400 to-emerald-400" : c.health > 70 ? "bg-gradient-to-r from-amber-400 to-cyan-400" : "bg-gradient-to-r from-rose-400 to-amber-400"}`} style={{ width: `${c.health}%` }} />
                      </div>
                      <span className="text-[11px] text-slate-300 w-7 text-right">{c.health}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${c.status === "Active" ? "border-emerald-400/30 text-emerald-300 bg-emerald-400/5" : "border-rose-400/30 text-rose-300 bg-rose-400/5"}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right"><MoreHorizontal className="h-4 w-4 text-slate-500 inline" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}
