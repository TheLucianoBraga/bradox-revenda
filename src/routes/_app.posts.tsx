import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { YoutubeModal } from "@/components/YoutubeModal";
import { Play, Image as ImgIcon, Link2, Plus, ExternalLink, FileVideo } from "lucide-react";

export const Route = createFileRoute("/_app/posts")({ component: Posts });

type Post = {
  id: number;
  titulo: string;
  categoria: string;
  tipo: "video" | "foto" | "link";
  status: "rascunho" | "publicado";
  thumb: string;
  youtube?: string;
  links?: { label: string; url: string }[];
  botao?: { label: string; url: string };
  resumo: string;
};

const seed: Post[] = [
  { id: 1, titulo: "Como configurar o app na TV Box", categoria: "Tutoriais", tipo: "video", status: "publicado", thumb: "from-cyan-500/40 to-violet-500/40", youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", resumo: "Passo a passo completo para nova instalação.", botao: { label: "Baixar APK", url: "#" } },
  { id: 2, titulo: "Promo de Black Friday — 50% OFF", categoria: "Promoções", tipo: "foto", status: "publicado", thumb: "from-emerald-500/40 to-cyan-500/40", resumo: "Banner oficial para divulgação nos grupos.", links: [{ label: "Banner PNG", url: "#" }, { label: "Banner Story", url: "#" }] },
  { id: 3, titulo: "Atualização do servidor SX", categoria: "Anúncios", tipo: "link", status: "rascunho", thumb: "from-violet-500/40 to-pink-500/40", resumo: "Manutenção programada às 03h.", botao: { label: "Ver detalhes", url: "#" } },
  { id: 4, titulo: "App SmartOne v3.2 disponível", categoria: "Atualizações de Apps", tipo: "video", status: "publicado", thumb: "from-cyan-500/40 to-blue-500/40", youtube: "https://www.youtube.com/watch?v=oHg5SJYRHA0", resumo: "Vídeo demonstrativo das novidades." },
  { id: 5, titulo: "Modelos de TV compatíveis", categoria: "Suporte", tipo: "foto", status: "rascunho", thumb: "from-amber-500/40 to-orange-500/40", resumo: "Tabela atualizada de compatibilidade." },
  { id: 6, titulo: "Como vender mais — Webinar", categoria: "Tutoriais", tipo: "video", status: "publicado", thumb: "from-violet-500/40 to-cyan-500/40", youtube: "https://www.youtube.com/watch?v=L_jWHffIx5E", resumo: "Estratégias para revendedores iniciantes." },
];

function Posts() {
  const [filter, setFilter] = useState<"all" | "rascunho" | "publicado">("all");
  const [video, setVideo] = useState<string | null>(null);
  const list = seed.filter((p) => filter === "all" || p.status === filter);

  const typeIcon = { video: Play, foto: ImgIcon, link: Link2 };

  return (
    <>
      <PageHeader
        title="Posts & Mídias"
        subtitle="Crie conteúdos com vídeos, fotos, links e botões. Salve como rascunho ou publique para suas revendas."
        actions={<NeonButton><span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Novo post</span></NeonButton>}
      />

      <div className="flex gap-2 mb-5">
        {(["all", "publicado", "rascunho"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs border transition ${filter === f ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}
          >
            {f === "all" ? "Todos" : f === "publicado" ? "Publicados" : "Rascunhos"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {list.map((p) => {
          const Icon = typeIcon[p.tipo];
          return (
            <GlassCard key={p.id} className="col-span-12 sm:col-span-6 xl:col-span-4 p-0 overflow-hidden">
              <div className={`relative h-40 bg-gradient-to-br ${p.thumb} grid place-items-center`}>
                <Icon className="h-10 w-10 text-white/70" />
                <span className={`absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full border ${p.status === "publicado" ? "bg-emerald-400/15 border-emerald-400/40 text-emerald-200" : "bg-amber-400/15 border-amber-400/40 text-amber-200"}`}>
                  {p.status === "publicado" ? "Publicado" : "Rascunho"}
                </span>
                <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-slate-200">{p.categoria}</span>
                {p.youtube && (
                  <button onClick={() => setVideo(p.youtube!)} className="absolute inset-0 grid place-items-center group">
                    <span className="h-14 w-14 rounded-full bg-black/60 border border-cyan-400/50 grid place-items-center group-hover:scale-110 transition glow-cyan">
                      <Play className="h-5 w-5 text-cyan-300 ml-0.5" fill="currentColor" />
                    </span>
                  </button>
                )}
              </div>
              <div className="p-5">
                <div className="font-display text-base text-white">{p.titulo}</div>
                <p className="text-xs text-slate-400 mt-1.5">{p.resumo}</p>
                {p.links && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.links.map((l) => (
                      <a key={l.label} href={l.url} className="text-[11px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 hover:border-cyan-400/40 flex items-center gap-1"><Link2 className="h-3 w-3" /> {l.label}</a>
                    ))}
                  </div>
                )}
                {p.botao && (
                  <a href={p.botao.url} className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-violet-500 text-black text-xs font-medium">
                    {p.botao.label} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      <YoutubeModal url={video ?? ""} open={!!video} onOpenChange={(o) => !o && setVideo(null)} />
    </>
  );
}
