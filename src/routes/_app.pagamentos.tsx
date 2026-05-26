import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { Receipt, Plus, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_app/pagamentos")({ component: Pagamentos });

const rows = [
  { revenda: "Carlos Mendes", servidor: "SX Server", plano: "Pro", vencimento: "10/12/2026", valor: "R$ 49,90", status: "pago" },
  { revenda: "Júlia Rocha", servidor: "ZTech Cloud", plano: "Family", vencimento: "28/11/2026", valor: "R$ 79,90", status: "pendente" },
  { revenda: "Bruno Tavares", servidor: "GoldTV", plano: "Black", vencimento: "05/11/2026", valor: "R$ 119,90", status: "atrasado" },
  { revenda: "Sofia Pinto", servidor: "SX Server", plano: "Pro", vencimento: "15/12/2026", valor: "R$ 49,90", status: "pago" },
  { revenda: "Rafael Dias", servidor: "ZTech Cloud", plano: "Starter", vencimento: "02/12/2026", valor: "R$ 29,90", status: "pendente" },
];

const badge: Record<string, string> = {
  pago: "bg-emerald-400/15 border-emerald-400/40 text-emerald-200",
  pendente: "bg-amber-400/15 border-amber-400/40 text-amber-200",
  atrasado: "bg-red-400/15 border-red-400/40 text-red-200",
};

function Pagamentos() {
  return (
    <>
      <PageHeader
        title="Pagamentos · Pós-pago"
        subtitle="Acompanhe vencimentos, recebimentos e inadimplência das revendas em modelo pós-pago."
        actions={<NeonButton><span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Registrar pagamento</span></NeonButton>}
      />

      <div className="grid grid-cols-12 gap-4 mb-6">
        {[
          { l: "Recebido (mês)", v: "R$ 24.180", c: "emerald" },
          { l: "A receber", v: "R$ 6.420", c: "amber" },
          { l: "Em atraso", v: "R$ 1.890", c: "red" },
          { l: "Taxa de adimplência", v: "94.2%", c: "cyan" },
        ].map((s, i) => (
          <GlassCard key={i} className="col-span-6 md:col-span-3 p-5">
            <div className="text-xs text-slate-400">{s.l}</div>
            <div className={`font-display text-2xl mt-1 ${s.c === "emerald" ? "text-emerald-300" : s.c === "amber" ? "text-amber-300" : s.c === "red" ? "text-red-300" : "text-white"}`}>{s.v}</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-cyan-300" />
          <div className="text-sm text-white">Próximos vencimentos</div>
          <span className="ml-auto flex items-center gap-1 text-[11px] text-amber-300"><AlertTriangle className="h-3 w-3" /> 3 atrasos detectados</span>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
            <tr>
              <th className="px-5 py-3">Revenda</th>
              <th className="px-5 py-3">Servidor</th>
              <th className="px-5 py-3">Plano</th>
              <th className="px-5 py-3">Vencimento</th>
              <th className="px-5 py-3">Valor</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-white">{r.revenda}</td>
                <td className="px-5 py-3 text-slate-300">{r.servidor}</td>
                <td className="px-5 py-3 text-slate-300">{r.plano}</td>
                <td className="px-5 py-3 text-slate-300">{r.vencimento}</td>
                <td className="px-5 py-3 text-white">{r.valor}</td>
                <td className="px-5 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border ${badge[r.status]}`}>{r.status}</span></td>
                <td className="px-5 py-3 text-right"><button className="text-xs text-cyan-300 hover:text-cyan-200">Cobrar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </>
  );
}
