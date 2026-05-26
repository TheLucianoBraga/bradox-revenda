import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { Coins, Plus, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_app/creditos")({ component: Creditos });

const rows = [
  { data: "26/05/2026", revenda: "Lucas Silva", servidor: "P2 Premium", qtd: 50, valor: "R$ 350,00", status: "pago" },
  { data: "25/05/2026", revenda: "Aline Costa", servidor: "UltraServer", qtd: 100, valor: "R$ 680,00", status: "pago" },
  { data: "24/05/2026", revenda: "Pedro Lima", servidor: "FastPlay", qtd: 20, valor: "R$ 150,00", status: "pendente" },
  { data: "23/05/2026", revenda: "Mariana Souza", servidor: "P2 Premium", qtd: 200, valor: "R$ 1.300,00", status: "pago" },
  { data: "22/05/2026", revenda: "Diego Alves", servidor: "UltraServer", qtd: 10, valor: "R$ 75,00", status: "cancelado" },
];

const badge: Record<string, string> = {
  pago: "bg-emerald-400/15 border-emerald-400/40 text-emerald-200",
  pendente: "bg-amber-400/15 border-amber-400/40 text-amber-200",
  cancelado: "bg-red-400/15 border-red-400/40 text-red-200",
};

function Creditos() {
  return (
    <>
      <PageHeader
        title="Créditos · Pré-pago"
        subtitle="Histórico de compras de créditos por servidor pré-pago. Recarregue manualmente quando necessário."
        actions={<NeonButton><span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Comprar créditos</span></NeonButton>}
      />

      <div className="grid grid-cols-12 gap-4 mb-6">
        {[
          { l: "Créditos disponíveis", v: "7.840", i: Coins },
          { l: "Compras (30d)", v: "R$ 18.420", i: TrendingUp },
          { l: "Servidores ativos (pré)", v: "3", i: Coins },
        ].map((s, i) => (
          <GlassCard key={i} className="col-span-12 md:col-span-4 p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-cyan-400/10 border border-cyan-400/30 grid place-items-center text-cyan-300"><s.i className="h-5 w-5" /></div>
            <div>
              <div className="text-xs text-slate-400">{s.l}</div>
              <div className="font-display text-2xl text-white">{s.v}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
            <tr>
              <th className="px-5 py-3">Data</th>
              <th className="px-5 py-3">Revenda</th>
              <th className="px-5 py-3">Servidor</th>
              <th className="px-5 py-3">Qtd</th>
              <th className="px-5 py-3">Valor</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-slate-300">{r.data}</td>
                <td className="px-5 py-3 text-white">{r.revenda}</td>
                <td className="px-5 py-3 text-slate-300">{r.servidor}</td>
                <td className="px-5 py-3 text-cyan-300 font-display">{r.qtd}</td>
                <td className="px-5 py-3 text-white">{r.valor}</td>
                <td className="px-5 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border ${badge[r.status]}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </>
  );
}
