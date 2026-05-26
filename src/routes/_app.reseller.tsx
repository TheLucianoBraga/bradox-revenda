import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { Crown, Sparkles, Plus, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_app/reseller")({ component: Reseller });

const resellers = [
  { name: "Aurora Tech", region: "EU · DACH", tenants: 142, mrr: "$48,200", tier: "Diamond", uplift: "+18%" },
  { name: "Lima Telco", region: "LATAM", tenants: 88, mrr: "$22,400", tier: "Gold", uplift: "+12%" },
  { name: "Vertex Asia", region: "APAC", tenants: 56, mrr: "$18,900", tier: "Gold", uplift: "+9%" },
  { name: "Nordic Wave", region: "EU · Nordics", tenants: 32, mrr: "$11,600", tier: "Silver", uplift: "+22%" },
];

function Reseller() {
  return (
    <>
      <PageHeader
        title="Reseller Portal"
        subtitle="White-label partners, territory deals, and revenue share — fully transparent."
        actions={<NeonButton><span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Onboard reseller</span></NeonButton>}
      />

      <div className="grid grid-cols-12 gap-5 mb-6">
        {[
          { l: "Active resellers", v: "62" },
          { l: "Sub-tenants", v: "1,082" },
          { l: "Reseller MRR", v: "$284,900" },
          { l: "Avg uplift", v: "+14.2%" },
        ].map((s, i) => (
          <GlassCard key={i} className="col-span-6 md:col-span-3 p-5">
            <div className="text-xs text-slate-400">{s.l}</div>
            <div className="font-display text-2xl text-white mt-1">{s.v}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {resellers.map((r, i) => (
          <GlassCard key={i} className="col-span-12 md:col-span-6 xl:col-span-3 p-5 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-32 w-32 bg-cyan-400/20 blur-3xl rounded-full" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className={`text-[10px] tracking-[0.25em] uppercase ${r.tier === "Diamond" ? "text-cyan-300" : r.tier === "Gold" ? "text-amber-300" : "text-slate-300"}`}>{r.tier} partner</div>
                <Crown className={`h-4 w-4 ${r.tier === "Diamond" ? "text-cyan-300" : r.tier === "Gold" ? "text-amber-300" : "text-slate-400"}`} />
              </div>
              <div className="mt-2 font-display text-xl text-white">{r.name}</div>
              <div className="text-xs text-slate-400">{r.region}</div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-400">Tenants</div>
                  <div className="text-white text-lg">{r.tenants}</div>
                </div>
                <div>
                  <div className="text-slate-400">MRR</div>
                  <div className="text-white text-lg">{r.mrr}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="flex items-center gap-1 text-emerald-300 text-xs"><TrendingUp className="h-3 w-3" /> {r.uplift} 30d</span>
                <button className="text-xs text-cyan-300 hover:text-cyan-200">Open →</button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
