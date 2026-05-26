import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { Package, Check, Plus, Edit3 } from "lucide-react";

export const Route = createFileRoute("/_app/planos")({ component: Planos });

const planos = [
  { nome: "Starter", valor: "R$ 29,90", descricao: "Para quem está começando a revender.", beneficios: ["1 dispositivo", "Suporte por e-mail", "Catálogo padrão", "EPG básico"], destaque: false },
  { nome: "Pro", valor: "R$ 49,90", descricao: "O queridinho dos revendedores.", beneficios: ["2 dispositivos", "Suporte prioritário 24/7", "Catálogo completo", "EPG premium", "Adultos (opcional)"], destaque: true },
  { nome: "Family", valor: "R$ 79,90", descricao: "Para casas com várias TVs.", beneficios: ["4 dispositivos", "Suporte 24/7", "Catálogo completo + 4K", "EPG premium", "Gravação em nuvem"], destaque: false },
  { nome: "Black", valor: "R$ 119,90", descricao: "O topo da linha sem concessões.", beneficios: ["6 dispositivos", "Atendimento dedicado", "4K + Dolby Atmos", "Servidor premium SX", "App white-label"], destaque: false },
];

function Planos() {
  return (
    <>
      <PageHeader
        title="Planos"
        subtitle="Defina valores, descrições e benefícios. Vincule planos a uma ou mais revendas."
        actions={<NeonButton><span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Novo plano</span></NeonButton>}
      />

      <div className="grid grid-cols-12 gap-5">
        {planos.map((p) => (
          <GlassCard key={p.nome} className={`col-span-12 md:col-span-6 xl:col-span-3 p-6 relative overflow-hidden ${p.destaque ? "border border-cyan-400/40 glow-cyan" : ""}`}>
            {p.destaque && <div className="absolute top-3 right-3 text-[10px] tracking-widest text-cyan-300 uppercase">Mais vendido</div>}
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400/30 to-violet-500/30 border border-white/10 grid place-items-center">
              <Package className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="mt-4 font-display text-xl text-white">{p.nome}</div>
            <div className="mt-1 text-xs text-slate-400">{p.descricao}</div>
            <div className="mt-4 font-display text-3xl text-gradient">{p.valor}<span className="text-xs text-slate-500 font-sans ml-1">/mês</span></div>
            <ul className="mt-5 space-y-2 text-sm">
              {p.beneficios.map((b) => (
                <li key={b} className="flex items-start gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-cyan-300 mt-0.5 shrink-0" /> {b}
                </li>
              ))}
            </ul>
            <button className="mt-6 w-full py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/40 text-xs flex items-center justify-center gap-2"><Edit3 className="h-3 w-3" /> Editar plano</button>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
