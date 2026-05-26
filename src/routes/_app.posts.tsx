import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { YoutubeModal } from "@/components/YoutubeModal";
import { RichTextEditor } from "@/components/RichTextEditor";
import { RichTextView } from "@/components/RichTextView";
import { Play, Image as ImgIcon, Link2, Plus, ExternalLink, Edit3, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/_app/posts")({ component: Posts });

type Tipo = "video" | "foto" | "link";
type StatusPost = "rascunho" | "publicado";
type Post = {
  id: number;
  titulo: string;
  categoria: string;
  tipo: Tipo;
  status: StatusPost;
  thumb: string;
  youtube?: string;
  resumo: string;
  botaoLabel?: string;
  botaoUrl?: string;
};

const seed: Post[] = [
  { id: 1, titulo: "Como configurar o app na TV Box", categoria: "Tutoriais", tipo: "video", status: "publicado", thumb: "from-amber-500/30 to-yellow-500/20", youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", resumo: "Passo a passo completo para nova instalação.", botaoLabel: "Baixar APK", botaoUrl: "#" },
  { id: 2, titulo: "Promo de Black Friday — 50% OFF", categoria: "Promoções", tipo: "foto", status: "publicado", thumb: "from-emerald-500/30 to-amber-500/20", resumo: "Banner oficial para divulgação nos grupos." },
  { id: 3, titulo: "Atualização do servidor SX", categoria: "Anúncios", tipo: "link", status: "rascunho", thumb: "from-yellow-500/30 to-orange-500/20", resumo: "Manutenção programada às 03h.", botaoLabel: "Ver detalhes", botaoUrl: "#" },
  { id: 4, titulo: "App SmartOne v3.2 disponível", categoria: "Atualizações de Apps", tipo: "video", status: "publicado", thumb: "from-amber-400/30 to-yellow-600/20", youtube: "https://www.youtube.com/watch?v=oHg5SJYRHA0", resumo: "Vídeo demonstrativo das novidades." },
];

const typeIcon = { video: Play, foto: ImgIcon, link: Link2 };

function Posts() {
  const [items, setItems] = useState<Post[]>(seed);
  const [filter, setFilter] = useState<"all" | "rascunho" | "publicado">("all");
  const [video, setVideo] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);

  const list = items.filter((p) => filter === "all" || p.status === filter);

  const onNew = () => { setEditing(null); setOpen(true); };
  const onEdit = (p: Post) => { setEditing(p); setOpen(true); };
  const onDelete = (id: number) => {
    setItems((arr) => arr.filter((p) => p.id !== id));
    toast.success("Post excluído");
  };
  const onSave = (data: Omit<Post, "id"> & { id?: number }) => {
    if (data.id) {
      setItems((arr) => arr.map((p) => (p.id === data.id ? ({ ...p, ...data } as Post) : p)));
      toast.success("Post atualizado");
    } else {
      const nextId = items.reduce((m, p) => Math.max(m, p.id), 0) + 1;
      setItems((arr) => [{ ...(data as Post), id: nextId }, ...arr]);
      toast.success("Post criado");
    }
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Posts & Mídias"
        subtitle="Crie conteúdos com vídeos, fotos, links e botões. Salve como rascunho ou publique para suas revendas."
        actions={
          <NeonButton onClick={onNew}>
            <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Novo post</span>
          </NeonButton>
        }
      />

      <div className="flex gap-2 mb-5">
        {(["all", "publicado", "rascunho"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs border transition ${filter === f ? "border-amber-400/50 bg-amber-400/10 text-amber-200" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}
          >
            {f === "all" ? "Todos" : f === "publicado" ? "Publicados" : "Rascunhos"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {list.map((p) => {
          const Icon = typeIcon[p.tipo];
          return (
            <GlassCard key={p.id} className="col-span-12 sm:col-span-6 xl:col-span-4 p-0 overflow-hidden group">
              <div className={`relative h-40 bg-gradient-to-br ${p.thumb} grid place-items-center`}>
                <Icon className="h-10 w-10 text-white/70" />
                <span className={`absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full border ${p.status === "publicado" ? "bg-emerald-400/15 border-emerald-400/40 text-emerald-200" : "bg-amber-400/15 border-amber-400/40 text-amber-200"}`}>
                  {p.status === "publicado" ? "Publicado" : "Rascunho"}
                </span>
                <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-slate-200">{p.categoria}</span>
                {p.youtube && (
                  <button onClick={() => setVideo(p.youtube!)} className="absolute inset-0 grid place-items-center group/play">
                    <span className="h-14 w-14 rounded-full bg-black/60 border border-amber-400/50 grid place-items-center group-hover/play:scale-110 transition">
                      <Play className="h-5 w-5 text-amber-300 ml-0.5" fill="currentColor" />
                    </span>
                  </button>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-display text-base text-white flex-1">{p.titulo}</div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => onEdit(p)} className="p-1.5 rounded-md border border-white/10 bg-white/5 hover:border-amber-400/40 text-slate-300" title="Editar">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onDelete(p.id)} className="p-1.5 rounded-md border border-white/10 bg-white/5 hover:border-red-400/40 text-slate-300 hover:text-red-300" title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">{p.resumo}</p>
                {p.botaoLabel && p.botaoUrl && (
                  <a href={p.botaoUrl} className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-xs font-medium">
                    {p.botaoLabel} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </GlassCard>
          );
        })}
        {list.length === 0 && (
          <div className="col-span-12 text-center text-sm text-slate-400 py-16">Nenhum post encontrado.</div>
        )}
      </div>

      <YoutubeModal url={video ?? ""} open={!!video} onOpenChange={(o) => !o && setVideo(null)} />
      <PostModal open={open} onClose={() => setOpen(false)} initial={editing} onSave={onSave} />
    </>
  );
}

function PostModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: Post | null;
  onSave: (p: Omit<Post, "id"> & { id?: number }) => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("Tutoriais");
  const [tipo, setTipo] = useState<Tipo>("video");
  const [status, setStatus] = useState<StatusPost>("rascunho");
  const [resumo, setResumo] = useState("");
  const [youtube, setYoutube] = useState("");
  const [botaoLabel, setBotaoLabel] = useState("");
  const [botaoUrl, setBotaoUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitulo(initial?.titulo ?? "");
    setCategoria(initial?.categoria ?? "Tutoriais");
    setTipo(initial?.tipo ?? "video");
    setStatus(initial?.status ?? "rascunho");
    setResumo(initial?.resumo ?? "");
    setYoutube(initial?.youtube ?? "");
    setBotaoLabel(initial?.botaoLabel ?? "");
    setBotaoUrl(initial?.botaoUrl ?? "");
  }, [open, initial]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = () => {
    if (!titulo.trim()) return toast.error("Informe o título");
    if (!resumo.trim()) return toast.error("Informe um resumo");
    onSave({
      id: initial?.id,
      titulo: titulo.trim(),
      categoria,
      tipo,
      status,
      resumo: resumo.trim(),
      thumb: initial?.thumb ?? "from-amber-500/30 to-yellow-500/20",
      youtube: tipo === "video" ? youtube.trim() || undefined : undefined,
      botaoLabel: botaoLabel.trim() || undefined,
      botaoUrl: botaoUrl.trim() || undefined,
    });
  };

  const field = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50";
  const label = "text-[11px] uppercase tracking-wider text-slate-400";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f1115] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <div className="font-display text-lg text-white">{initial ? "Editar post" : "Novo post"}</div>
                <div className="text-xs text-slate-400">Preencha os campos abaixo</div>
              </div>
              <button onClick={onClose} className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/5">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-12 gap-4 max-h-[70vh] overflow-y-auto">
              <div className="col-span-12">
                <div className={label}>Título</div>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={field} placeholder="Ex.: Tutorial de instalação" />
              </div>
              <div className="col-span-6">
                <div className={label}>Categoria</div>
                <input value={categoria} onChange={(e) => setCategoria(e.target.value)} className={field} />
              </div>
              <div className="col-span-6">
                <div className={label}>Tipo</div>
                <div className="flex gap-2 mt-1">
                  {(["video", "foto", "link"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTipo(t)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-xs capitalize transition ${tipo === t ? "border-amber-400/50 bg-amber-400/10 text-amber-200" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-12">
                <div className={label}>Resumo</div>
                <textarea value={resumo} onChange={(e) => setResumo(e.target.value)} className={`${field} min-h-[80px]`} placeholder="Descrição curta do conteúdo" />
              </div>
              {tipo === "video" && (
                <div className="col-span-12">
                  <div className={label}>URL do YouTube</div>
                  <input value={youtube} onChange={(e) => setYoutube(e.target.value)} className={field} placeholder="https://youtube.com/watch?v=..." />
                </div>
              )}
              <div className="col-span-6">
                <div className={label}>Texto do botão (opcional)</div>
                <input value={botaoLabel} onChange={(e) => setBotaoLabel(e.target.value)} className={field} placeholder="Ex.: Baixar APK" />
              </div>
              <div className="col-span-6">
                <div className={label}>URL do botão (opcional)</div>
                <input value={botaoUrl} onChange={(e) => setBotaoUrl(e.target.value)} className={field} placeholder="https://..." />
              </div>
              <div className="col-span-12">
                <div className={label}>Status</div>
                <div className="flex gap-2 mt-1">
                  {(["rascunho", "publicado"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-xs capitalize transition ${status === s ? "border-amber-400/50 bg-amber-400/10 text-amber-200" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10 bg-black/20">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5">
                Cancelar
              </button>
              <NeonButton onClick={submit}>
                <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> {initial ? "Salvar alterações" : "Criar post"}</span>
              </NeonButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
