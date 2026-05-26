import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { FolderTree, Plus, Edit3, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/categorias")({ component: Categorias });

const seed = [
  { id: 1, nome: "Tutoriais", slug: "tutoriais", posts: 24, cor: "cyan" },
  { id: 2, nome: "Anúncios", slug: "anuncios", posts: 11, cor: "violet" },
  { id: 3, nome: "Promoções", slug: "promocoes", posts: 8, cor: "emerald" },
  { id: 4, nome: "Suporte", slug: "suporte", posts: 17, cor: "cyan" },
  { id: 5, nome: "Atualizações de Apps", slug: "apps", posts: 6, cor: "violet" },
];

function Categorias() {
  const [items, setItems] = useState(seed);
  const [nome, setNome] = useState("");

  const add = () => {
    if (!nome.trim()) return;
    setItems([...items, { id: Date.now(), nome, slug: nome.toLowerCase().replace(/\s+/g, "-"), posts: 0, cor: "cyan" }]);
    setNome("");
  };

  return (
    <>
      <PageHeader
        title="Categorias"
        subtitle="Organize seus conteúdos em grupos para facilitar o acesso dos revendedores."
        actions={<NeonButton onClick={add}><span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nova categoria</span></NeonButton>}
      />

      <GlassCard className="p-5 mb-6">
        <div className="flex gap-3">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da categoria…"
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-400/50"
          />
          <NeonButton onClick={add}>Adicionar</NeonButton>
        </div>
      </GlassCard>

      <div className="grid grid-cols-12 gap-4">
        {items.map((c) => (
          <GlassCard key={c.id} className="col-span-12 sm:col-span-6 xl:col-span-4 p-5">
            <div className="flex items-start justify-between">
              <div className={`h-10 w-10 rounded-xl grid place-items-center border ${c.cor === "cyan" ? "bg-cyan-400/10 border-cyan-400/30 text-cyan-300" : c.cor === "violet" ? "bg-violet-400/10 border-violet-400/30 text-violet-300" : "bg-emerald-400/10 border-emerald-400/30 text-emerald-300"}`}>
                <FolderTree className="h-5 w-5" />
              </div>
              <div className="flex gap-1">
                <button className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => setItems(items.filter((i) => i.id !== c.id))} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="mt-4 font-display text-lg text-white">{c.nome}</div>
            <div className="text-xs text-slate-500 mt-0.5">/{c.slug}</div>
            <div className="mt-3 text-xs text-slate-400">{c.posts} posts publicados</div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
