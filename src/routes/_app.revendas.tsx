import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { Store, Plus, ChevronDown, Coins, Receipt, Package } from "lucide-react";

export const Route = createFileRoute("/_app/revendas")({ component: Revendas });

type Revenda = {
  id: number;
  nome: string;
  cidade: string;
  servidores: string[];
  modos: ("creditos" | "pagamento" | "plano")[];
  clientes: number;
  receita: string;
};

const seed: Revenda[] = [
  { id: 1, nome: "Lucas Silva", cidade: "São Paulo · SP", servidores: ["P2 Premium", "SX Server"], modos: ["creditos", "pagamento"], clientes: 142, receita: "R$ 8.240" },
  { id: 2, nome: "Aline Costa", cidade: "Recife · PE", servidores: ["UltraServer"], modos: ["creditos", "plano"], clientes: 88, receita: "R$ 4.180" },
  { id: 3, nome: "Pedro Lima", cidade: "Curitiba · PR", servidores: ["FastPlay", "GoldTV"], modos: ["creditos", "pagamento", "plano"], clientes: 56, receita: "R$ 3.420" },
  { id: 4, nome: "Mariana Souza", cidade: "Belo Horizonte · MG", servidores: ["P2 Premium"], modos: ["plano"], clientes: 211, receita: "R$ 12.900" },
  { id: 5, nome: "Diego Alves", cidade: "Porto Alegre · RS", servidores: ["UltraServer", "ZTech Cloud"], modos: ["pagamento"], clientes: 34, receita: "R$ 1.690" },
];

const modoMeta = {
  creditos: { label: "Créditos", icon: Coins, color: "cyan" },
  pagamento: { label: "Pós-pago", icon: Receipt, color: "violet" },
  plano: { label: "Plano", icon: Package, color: "emerald" },
} as const;

function Revendas() {
  const [open, setOpen] = useState<number | null>(1);
  return (
    <>
      <PageHeader
        title="Revendas"
        subtitle="Cada revenda pode operar com um ou mais modos de cobrança — créditos, pós-pago e/ou planos."
        actions={<NeonButton><span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nova revenda</span></NeonButton>}
      />

      <div className="space-y-3">
        {seed.map((r) => {
          const isOpen = open === r.id;
          return (
            <GlassCard key={r.id} className="p-0 overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : r.id)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02]">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400/30 to-violet-500/30 border border-white/10 grid place-items-center">
                  <Store className="h-5 w-5 text-cyan-300" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-display text-white">{r.nome}</div>
                  <div className="text-xs text-slate-400">{r.cidade} · {r.clientes} clientes</div>
                </div>
                <div className="hidden md:flex items-center gap-1.5">
                  {r.modos.map((m) => {
                    const M = modoMeta[m];
                    return <span key={m} className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${M.color === "cyan" ? "border-cyan-400/30 text-cyan-300 bg-cyan-400/5" : M.color === "violet" ? "border-violet-400/30 text-violet-300 bg-violet-400/5" : "border-emerald-400/30 text-emerald-300 bg-emerald-400/5"}`}><M.icon className="h-3 w-3" /> {M.label}</span>;
                  })}
                </div>
                <div className="font-display text-cyan-300 hidden sm:block">{r.receita}</div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <div className="border-t border-white/5 px-5 py-5 grid grid-cols-12 gap-5 bg-black/20">
                  <div className="col-span-12 md:col-span-6">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Servidores vinculados</div>
                    <div className="flex flex-wrap gap-2">
                      {r.servidores.map((s) => (
                        <span key={s} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">{s}</span>
                      ))}
                      <button className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-white/15 text-slate-400 hover:text-white hover:border-cyan-400/40">+ Vincular</button>
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Modos de cobrança ativos</div>
                    <div className="space-y-2">
                      {(["creditos", "pagamento", "plano"] as const).map((m) => {
                        const active = r.modos.includes(m);
                        const M = modoMeta[m];
                        return (
                          <label key={m} className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer ${active ? "border-cyan-400/40 bg-cyan-400/5" : "border-white/10 bg-white/[0.02]"}`}>
                            <input type="checkbox" defaultChecked={active} className="accent-cyan-400" />
                            <M.icon className="h-4 w-4 text-slate-300" />
                            <span className="text-sm text-white">{M.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </>
  );
}
