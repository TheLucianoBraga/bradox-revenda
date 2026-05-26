import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import {
  FolderTree, Plus, Edit3, Trash2, X, Search, Upload, Image as ImageIcon,
  Tv, Film, Clapperboard, PlaySquare, Radio, Music, Mic, Headphones,
  Star, Heart, Flame, Zap, Sparkles, Crown, Gift, Tag, Bookmark, Pin,
  Megaphone, Bell, MessageCircle, MessageSquare, Mail, Phone, Send,
  Users, User, UserCheck, ShieldCheck, Lock, Key,
  Server, Cloud, Database, Wifi, Globe, Link2, Settings, Wrench, PenTool as Tool,
  CreditCard, DollarSign, Wallet, Receipt, ShoppingCart, Package, Truck,
  Calendar, Clock, AlertTriangle, CheckCircle2, Info, HelpCircle, FileText, BookOpen,
  Tv2, Smartphone, Monitor, Gamepad2,
} from "lucide-react";

export const Route = createFileRoute("/_app/categorias")({ component: Categorias });

type Cor = "cyan" | "violet" | "emerald" | "amber" | "rose";
type Categoria = {
  id: number;
  nome: string;
  slug: string;
  descricao: string;
  posts: number;
  cor: Cor;
  corHex?: string;
  icone: string;
  imagem?: string;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "folder-tree": FolderTree, tv: Tv, "tv-2": Tv2, film: Film, clapperboard: Clapperboard,
  "play-square": PlaySquare, radio: Radio, music: Music, mic: Mic, headphones: Headphones,
  star: Star, heart: Heart, flame: Flame, zap: Zap, sparkles: Sparkles, crown: Crown,
  gift: Gift, tag: Tag, bookmark: Bookmark, pin: Pin,
  megaphone: Megaphone, bell: Bell, "message-circle": MessageCircle, "message-square": MessageSquare,
  mail: Mail, phone: Phone, send: Send,
  users: Users, user: User, "user-check": UserCheck, "shield-check": ShieldCheck, lock: Lock, key: Key,
  server: Server, cloud: Cloud, database: Database, wifi: Wifi, globe: Globe, "link-2": Link2,
  settings: Settings, wrench: Wrench, tool: Tool,
  "credit-card": CreditCard, "dollar-sign": DollarSign, wallet: Wallet, receipt: Receipt,
  "shopping-cart": ShoppingCart, package: Package, truck: Truck,
  calendar: Calendar, clock: Clock, "alert-triangle": AlertTriangle, "check-circle-2": CheckCircle2,
  info: Info, "help-circle": HelpCircle, "file-text": FileText, "book-open": BookOpen,
  smartphone: Smartphone, monitor: Monitor, "gamepad-2": Gamepad2,
};
const ICON_KEYS = Object.keys(ICONS);

const seed: Categoria[] = [
  { id: 1, nome: "Tutoriais", slug: "tutoriais", descricao: "Guias passo a passo para revendedores.", posts: 24, cor: "cyan", icone: "book-open" },
  { id: 2, nome: "Anúncios", slug: "anuncios", descricao: "Comunicados oficiais da plataforma.", posts: 11, cor: "violet", icone: "megaphone" },
  { id: 3, nome: "Promoções", slug: "promocoes", descricao: "Campanhas e ofertas sazonais.", posts: 8, cor: "emerald", icone: "gift" },
  { id: 4, nome: "Suporte", slug: "suporte", descricao: "Artigos de ajuda e troubleshooting.", posts: 17, cor: "cyan", icone: "help-circle" },
  { id: 5, nome: "Atualizações de Apps", slug: "apps", descricao: "Novidades de versões dos aplicativos.", posts: 6, cor: "violet", icone: "smartphone" },
];

const cores: { v: Cor; cls: string }[] = [
  { v: "cyan", cls: "bg-cyan-400/20 border-cyan-400/50 text-cyan-300" },
  { v: "violet", cls: "bg-violet-400/20 border-violet-400/50 text-violet-300" },
  { v: "emerald", cls: "bg-emerald-400/20 border-emerald-400/50 text-emerald-300" },
  { v: "amber", cls: "bg-amber-400/20 border-amber-400/50 text-amber-300" },
  { v: "rose", cls: "bg-rose-400/20 border-rose-400/50 text-rose-300" },
];

const corClass = (c: Cor) => cores.find((x) => x.v === c)!.cls;
const swatchStyle = (hex?: string): React.CSSProperties | undefined =>
  hex ? { backgroundColor: `${hex}33`, borderColor: `${hex}88`, color: hex } : undefined;
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function CategoriaIcone({ c, className = "h-5 w-5" }: { c: Categoria; className?: string }) {
  if (c.imagem) return <img src={c.imagem} alt="" className="h-full w-full object-cover rounded-lg" />;
  const Ico = ICONS[c.icone] ?? FolderTree;
  return <Ico className={className} />;
}

function Categorias() {
  const [items, setItems] = useState<Categoria[]>(seed);
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing: Categoria | null }>({ open: false, editing: null });
  const [confirm, setConfirm] = useState<Categoria | null>(null);

  const filtradas = items.filter((c) =>
    [c.nome, c.slug, c.descricao].join(" ").toLowerCase().includes(busca.toLowerCase()),
  );

  const openNew = () => setModal({ open: true, editing: null });
  const openEdit = (c: Categoria) => setModal({ open: true, editing: c });
  const close = () => setModal({ open: false, editing: null });

  const save = (data: Omit<Categoria, "id" | "posts">) => {
    if (modal.editing) {
      setItems((arr) => arr.map((c) => (c.id === modal.editing!.id ? { ...c, ...data } : c)));
      toast.success("Categoria atualizada", { description: data.nome });
    } else {
      const nova: Categoria = { ...data, id: Date.now(), posts: 0 };
      setItems((arr) => [nova, ...arr]);
      toast.success("Categoria criada", { description: data.nome });
    }
    close();
  };

  const remove = (c: Categoria) => {
    setItems((arr) => arr.filter((i) => i.id !== c.id));
    toast.success("Categoria removida", { description: c.nome });
    setConfirm(null);
  };

  return (
    <>
      <PageHeader
        title="Categorias"
        subtitle="Organize seus conteúdos em grupos para facilitar o acesso dos revendedores."
        actions={
          <NeonButton onClick={openNew}>
            <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nova categoria</span>
          </NeonButton>
        }
      />

      <GlassCard className="p-3 mb-6">
        <div className="flex items-center gap-2 px-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, slug ou descrição…"
            className="flex-1 bg-transparent py-2 text-sm focus:outline-none placeholder:text-slate-500"
          />
          <span className="text-[11px] text-slate-500">{filtradas.length} de {items.length}</span>
        </div>
      </GlassCard>

      <div className="grid grid-cols-12 gap-4">
        <AnimatePresence>
          {filtradas.map((c) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="col-span-12 sm:col-span-6 xl:col-span-4"
            >
              <GlassCard className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className={`h-12 w-12 rounded-xl grid place-items-center border overflow-hidden ${c.imagem ? "bg-white/5 border-white/10" : (c.corHex ? "" : corClass(c.cor))}`}
                    style={c.imagem ? undefined : swatchStyle(c.corHex)}
                  >
                    <CategoriaIcone c={c} className="h-6 w-6" />
                  </div>
                  <div className="flex gap-1">
                    <button data-handled="true" onClick={() => openEdit(c)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white" title="Editar">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button data-handled="true" onClick={() => setConfirm(c)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-300" title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 font-display text-lg text-white">{c.nome}</div>
                <div className="text-xs text-slate-500 mt-0.5">/{c.slug}</div>
                <div className="mt-2 text-xs text-slate-400 line-clamp-2 min-h-[2rem]">{c.descricao}</div>
                <div className="mt-3 text-xs text-slate-400">{c.posts} posts publicados</div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtradas.length === 0 && (
          <GlassCard className="col-span-12 p-10 text-center text-slate-400">Nenhuma categoria encontrada.</GlassCard>
        )}
      </div>

      <CategoriaModal open={modal.open} editing={modal.editing} existing={items} onClose={close} onSave={save} />
      <ConfirmDelete item={confirm} onCancel={() => setConfirm(null)} onConfirm={() => confirm && remove(confirm)} />
    </>
  );
}

function CategoriaModal({
  open, editing, existing, onClose, onSave,
}: {
  open: boolean;
  editing: Categoria | null;
  existing: Categoria[];
  onClose: () => void;
  onSave: (data: Omit<Categoria, "id" | "posts">) => void;
}) {
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState<Cor>("cyan");
  const [corHex, setCorHex] = useState<string | undefined>(undefined);
  const [icone, setIcone] = useState<string>("folder-tree");
  const [imagem, setImagem] = useState<string | undefined>(undefined);
  const [iconBusca, setIconBusca] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);
  const [erro, setErro] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setNome(editing?.nome ?? "");
      setSlug(editing?.slug ?? "");
      setDescricao(editing?.descricao ?? "");
      setCor(editing?.cor ?? "cyan");
      setCorHex(editing?.corHex);
      setIcone(editing?.icone ?? "folder-tree");
      setImagem(editing?.imagem);
      setIconBusca("");
      setSlugDirty(!!editing);
      setErro("");
    }
  }, [open, editing]);

  useEffect(() => { if (!slugDirty) setSlug(slugify(nome)); }, [nome, slugDirty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Arquivo inválido", { description: "Envie uma imagem (PNG, JPG, SVG…)" }); return; }
    if (f.size > 2 * 1024 * 1024) { toast.error("Imagem muito grande", { description: "Limite de 2MB." }); return; }
    const reader = new FileReader();
    reader.onload = () => setImagem(reader.result as string);
    reader.readAsDataURL(f);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = nome.trim();
    const s = slugify(slug || nome);
    if (!n) return setErro("Informe o nome da categoria.");
    if (!s) return setErro("Slug inválido.");
    if (existing.some((c) => c.slug === s && c.id !== editing?.id)) return setErro("Já existe uma categoria com este slug.");
    onSave({ nome: n, slug: s, descricao: descricao.trim(), cor, corHex, icone, imagem });
  };

  const iconsFiltrados = ICON_KEYS.filter((k) => k.includes(iconBusca.toLowerCase()));
  const PreviewIcon = ICONS[icone] ?? FolderTree;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.form
          onSubmit={submit}
          initial={{ y: 20, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.97 }}
          className="relative w-full max-w-2xl rounded-2xl glass p-6 border border-white/10 max-h-[90vh] overflow-y-auto scrollbar-thin"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">{editing ? "Editar" : "Criar"}</div>
              <h2 className="font-display text-xl text-white mt-1">{editing ? "Editar categoria" : "Nova categoria"}</h2>
            </div>
            <button type="button" data-handled="true" onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Preview + Nome / Slug */}
          <div className="flex gap-4 items-start">
            <div
              className={`h-20 w-20 shrink-0 rounded-2xl grid place-items-center border overflow-hidden ${imagem ? "bg-white/5 border-white/10" : (corHex ? "" : corClass(cor))}`}
              style={imagem ? undefined : swatchStyle(corHex)}
            >
              {imagem ? <img src={imagem} alt="" className="h-full w-full object-cover" /> : <PreviewIcon className="h-9 w-9" />}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-xs text-slate-400">Nome *</label>
                <input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Tutoriais" className="mt-1 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-400/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Slug</label>
                <input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugDirty(true); }} placeholder="tutoriais" className="mt-1 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-400/50" />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs text-slate-400">Descrição</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} placeholder="Breve descrição da categoria…" className="mt-1 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-400/50 resize-none" />
          </div>

          <div className="mt-4">
            <label className="text-xs text-slate-400">Cor</label>
            <div className="mt-2 flex gap-2">
              {cores.map((c) => (
                <button key={c.v} type="button" data-handled="true" onClick={() => setCor(c.v)} className={`h-9 w-9 rounded-lg border-2 transition ${c.cls} ${cor === c.v ? "ring-2 ring-white/40" : "opacity-60 hover:opacity-100"}`} />
              ))}
            </div>
          </div>

          {/* Imagem upload */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 flex items-center gap-2"><ImageIcon className="h-3.5 w-3.5" /> Imagem como ícone (opcional)</label>
              {imagem && (
                <button type="button" data-handled="true" onClick={() => setImagem(undefined)} className="text-[11px] text-rose-300 hover:text-rose-200">Remover imagem</button>
              )}
            </div>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
              className="mt-2 cursor-pointer rounded-xl border border-dashed border-white/15 hover:border-cyan-400/40 bg-white/[0.02] px-4 py-4 flex items-center gap-3 transition"
            >
              <div className="h-10 w-10 rounded-lg bg-white/5 grid place-items-center text-cyan-300">
                <Upload className="h-4 w-4" />
              </div>
              <div className="text-xs text-slate-400">
                {imagem ? "Imagem carregada. Clique para trocar." : "Arraste ou clique para enviar (PNG, JPG, SVG · até 2MB)"}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? undefined)} />
            </div>
          </div>

          {/* Galeria de ícones */}
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs text-slate-400">Ícone {imagem && <span className="text-slate-600">(desativado enquanto há imagem)</span>}</label>
              <div className="flex items-center gap-2 flex-1 max-w-[220px]">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <input
                  value={iconBusca}
                  onChange={(e) => setIconBusca(e.target.value)}
                  placeholder="Buscar ícone…"
                  className="flex-1 bg-transparent text-xs py-1 focus:outline-none placeholder:text-slate-600"
                />
              </div>
            </div>
            <div className={`mt-2 grid grid-cols-8 sm:grid-cols-10 gap-2 max-h-52 overflow-y-auto scrollbar-thin p-2 rounded-xl bg-black/30 border border-white/5 ${imagem ? "opacity-40 pointer-events-none" : ""}`}>
              {iconsFiltrados.map((k) => {
                const Ico = ICONS[k];
                const sel = k === icone;
                return (
                  <button
                    key={k}
                    type="button"
                    data-handled="true"
                    onClick={() => setIcone(k)}
                    title={k}
                    className={`h-9 w-9 grid place-items-center rounded-lg border transition ${sel ? "bg-cyan-400/20 border-cyan-400/60 text-cyan-200 ring-2 ring-cyan-400/30" : "bg-white/5 border-white/5 text-slate-300 hover:border-white/20 hover:text-white"}`}
                  >
                    <Ico className="h-4 w-4" />
                  </button>
                );
              })}
              {iconsFiltrados.length === 0 && <div className="col-span-full text-center text-xs text-slate-500 py-4">Nenhum ícone encontrado.</div>}
            </div>
          </div>

          {erro && <div className="mt-4 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" data-handled="true" onClick={onClose} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white hover:border-white/30">Cancelar</button>
            <NeonButton type="submit">{editing ? "Salvar alterações" : "Criar categoria"}</NeonButton>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}

function ConfirmDelete({ item, onCancel, onConfirm }: { item: Categoria | null; onCancel: () => void; onConfirm: () => void }) {
  if (!item) return null;
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
        <motion.div initial={{ y: 20, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.97 }} className="relative w-full max-w-md rounded-2xl glass p-6 border border-red-500/30">
          <h3 className="font-display text-lg text-white">Excluir categoria?</h3>
          <p className="text-sm text-slate-400 mt-2">Tem certeza que deseja excluir <span className="text-white">{item.nome}</span>? Esta ação não pode ser desfeita.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button data-handled="true" onClick={onCancel} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white hover:border-white/30">Cancelar</button>
            <button data-handled="true" onClick={onConfirm} className="px-4 py-2 rounded-xl text-sm bg-red-500/20 border border-red-500/50 text-red-200 hover:bg-red-500/30">Excluir</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
