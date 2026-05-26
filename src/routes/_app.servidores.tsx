import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { Server, Plus, Calendar, Coins } from "lucide-react";

export const Route = createFileRoute("/_app/servidores")({ component: Servidores });

const servidores = [
  { nome: "SX Server", tipo: "pos", clientes: 482, vencimento: "10/12/2026", status: "ativo" },
  { nome: "P2 Premium", tipo: "pre", clientes: 261, creditos: 1840, status: "ativo" },
  { nome: "ZTech Cloud", tipo: "pos", clientes: 154, vencimento: "28/11/2026", status: "atencao" },
  { nome: "FastPlay", tipo: "pre", clientes: 98, creditos: 320, status: "ativo" },
  { nome: "GoldTV", tipo: "pos", clientes: 73, vencimento: "05/11/2026", status: "vencido" },
  { nome: "UltraServer", tipo: "pre", clientes: 312, creditos: 5400, status: "ativo" },
];

const statusStyle = {
  ativo: "bg-emerald-400/15 border-emerald-400/40 text-emerald-200",
  atencao: "bg-amber-400/15 border-amber-400/40 text-amber-200",
  vencido: "bg-red-400/15 border-red-400/40 text-red-200",
} as const;

function Servidores() {
  return (
    <>
      <PageHeader
        title="Servidores"
        subtitle="Cadastre servidores nos modelos pré-pago (créditos) e pós-pago (vencimento mensal)."
        actions={<NeonButton><span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Novo servidor</span></NeonButton>}
      />

      <div className="grid grid-cols-12 gap-5">
        {servidores.map((s) => (
          <GlassCard key={s.nome} className="col-span-12 md:col-span-6 xl:col-span-4 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-400/30 to-violet-500/30 border border-white/10 grid place-items-center">
                  <Server className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <div className="font-display text-lg text-white">{s.nome}</div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-500">{s.tipo === "pre" ? "Pré-pago" : "Pós-pago"}</div>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusStyle[s.status as keyof typeof statusStyle]}`}>{s.status}</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-slate-400">Clientes</div>
                <div className="text-white text-lg font-display mt-0.5">{s.clientes}</div>
              </div>
              {s.tipo === "pre" ? (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-slate-400 flex items-center gap-1"><Coins className="h-3 w-3" /> Créditos</div>
                  <div className="text-cyan-300 text-lg font-display mt-0.5">{s.creditos}</div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Vence em</div>
                  <div className="text-violet-300 text-sm font-display mt-1">{s.vencimento}</div>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="text-xs text-slate-400 hover:text-white">Editar</button>
              <button className="text-xs text-cyan-300 hover:text-cyan-200">Abrir →</button>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
