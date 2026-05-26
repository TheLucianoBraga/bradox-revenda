import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { Check, Sparkles, Download } from "lucide-react";

export const Route = createFileRoute("/_app/billing")({ component: Billing });

function Billing() {
  return (
    <>
      <PageHeader
        title="Billing"
        subtitle="Subscriptions, invoices and white-label tenant usage."
        actions={<NeonButton><span className="flex items-center gap-2"><Download className="h-4 w-4" /> Export</span></NeonButton>}
      />

      <div className="grid grid-cols-12 gap-5">
        <GlassCard className="col-span-12 lg:col-span-8 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-cyan-300/80">Current plan</div>
              <div className="font-display text-3xl text-white mt-1">Quantum · $899<span className="text-base text-slate-400">/mo</span></div>
              <div className="text-sm text-slate-400 mt-1">Unlimited agents · White-label · Priority AI</div>
            </div>
            <NeonButton>Manage plan</NeonButton>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: "AI tokens", u: "8.4M / 20M", w: "42%" },
              { l: "Seats", u: "48 / ∞", w: "30%" },
              { l: "Tenants", u: "120 / 500", w: "24%" },
              { l: "Storage", u: "412 / 2000 GB", w: "20%" },
            ].map((m, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs text-slate-400">{m.l}</div>
                <div className="text-sm text-white mt-1">{m.u}</div>
                <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: m.w }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 lg:col-span-4 p-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 bg-cyan-400/20 blur-3xl rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-cyan-300/80"><Sparkles className="h-3 w-3" /> Upgrade</div>
            <div className="font-display text-2xl mt-1">Quantum Infinite</div>
            <div className="text-sm text-slate-400 mt-1">Dedicated GPU pool · 24/7 SRE · Custom SLAs.</div>
            <ul className="mt-4 space-y-2 text-sm">
              {["Dedicated AI compute", "On-prem option", "99.999% uptime SLO", "White-glove migration"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-slate-300"><Check className="h-4 w-4 text-cyan-300" /> {f}</li>
              ))}
            </ul>
            <NeonButton className="mt-5 w-full">Talk to sales</NeonButton>
          </div>
        </GlassCard>

        <GlassCard className="col-span-12 p-6">
          <div className="font-display text-xl text-white mb-3">Invoices</div>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-[11px] uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="text-left px-4 py-3">Invoice</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { id: "INV-2026-0518", d: "May 01 2026", a: "$899.00", s: "Paid" },
                  { id: "INV-2026-0417", d: "Apr 01 2026", a: "$899.00", s: "Paid" },
                  { id: "INV-2026-0316", d: "Mar 01 2026", a: "$899.00", s: "Paid" },
                  { id: "INV-2026-0215", d: "Feb 01 2026", a: "$799.00", s: "Paid" },
                ].map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-white">{r.id}</td>
                    <td className="px-4 py-3 text-slate-300">{r.d}</td>
                    <td className="px-4 py-3 text-slate-300">{r.a}</td>
                    <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/30 text-emerald-300 bg-emerald-400/5">{r.s}</span></td>
                    <td className="px-4 py-3 text-right"><button className="text-xs text-cyan-300 hover:text-cyan-200">Download PDF</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
