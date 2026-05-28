import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { ModalPortal } from "@/components/ModalPortal";
import { useAppSession } from "@/contexts/AppSessionContext";
import {
  deleteContentCategory,
  fetchContentSnapshot,
  saveContentCategory,
  uploadContentImage,
  type ContentCategoryRow,
  type ContentRow,
} from "@/services/bradox/content";
import {
  Bell, BookOpen, Calendar, Coffee, Edit3, FileText, FolderTree, Image as ImageIcon, Info,
  KeyRound, Lightbulb, Megaphone, Monitor, Package, Plus, Search, Server, Smartphone, Trash2, Tv, Upload, Video, Wrench, X,
} from "lucide-react";

export const Route = createFileRoute("/_app/categorias")({ component: Categorias });

type CategoriaView = ContentCategoryRow & { posts: number };

const ICONS = {
  bell: Bell,
  book: BookOpen,
  "book-open": BookOpen,
  calendar: Calendar,
  coffee: Coffee,
  "file-text": FileText,
  "folder-tree": FolderTree,
  info: Info,
  key: KeyRound,
  lightbulb: Lightbulb,
  megaphone: Megaphone,
  monitor: Monitor,
  package: Package,
  server: Server,
  smartphone: Smartphone,
  tv: Tv,
  video: Video,
  wrench: Wrench,
};

const iconOptions = [
  "folder-tree", "megaphone", "info", "server", "book-open", "lightbulb",
  "monitor", "smartphone", "tv", "video", "package", "wrench", "key", "calendar", "bell", "coffee",
] as const;

const colorOptions = [
  { value: "amber", label: "Dourado", dot: "bg-amber-400", border: "border-amber-400/60", bg: "bg-amber-400/10", text: "text-amber-200" },
  { value: "emerald", label: "Verde", dot: "bg-emerald-400", border: "border-emerald-400/60", bg: "bg-emerald-400/10", text: "text-emerald-200" },
  { value: "rose", label: "Rosa", dot: "bg-rose-400", border: "border-rose-400/60", bg: "bg-rose-400/10", text: "text-rose-200" },
  { value: "orange", label: "Laranja", dot: "bg-orange-400", border: "border-orange-400/60", bg: "bg-orange-400/10", text: "text-orange-200" },
  { value: "lime", label: "Lima", dot: "bg-lime-400", border: "border-lime-400/60", bg: "bg-lime-400/10", text: "text-lime-200" },
  { value: "indigo", label: "Azul", dot: "bg-indigo-400", border: "border-indigo-400/60", bg: "bg-indigo-400/10", text: "text-indigo-200" },
];

function Categorias() {
  const { activeNetworkId } = useAppSession();
  const [categories, setCategories] = useState<ContentCategoryRow[]>([]);
  const [content, setContent] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing: CategoriaView | null }>({ open: false, editing: null });
  const [confirm, setConfirm] = useState<CategoriaView | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const snapshot = await fetchContentSnapshot(activeNetworkId);
      setCategories(snapshot.categories);
      setContent(snapshot.content);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar categorias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [activeNetworkId]);

  const items = useMemo<CategoriaView[]>(() => categories.map((category) => ({
    ...category,
    posts: content.filter((post) => post.category_id === category.id).length,
  })), [categories, content]);

  const filtradas = items.filter((category) =>
    [category.name, category.icon, category.color].join(" ").toLowerCase().includes(busca.toLowerCase()),
  );

  const save = async (input: { name: string; icon: string; color: string; imageUrl?: string | null }) => {
    try {
      await saveContentCategory(activeNetworkId, {
        id: modal.editing?.id,
        name: input.name,
        icon: input.icon,
        color: input.color,
        imageUrl: input.imageUrl,
        displayOrder: modal.editing?.display_order ?? items.length,
      });
      toast.success(modal.editing ? "Categoria atualizada" : "Categoria criada", { description: input.name });
      setModal({ open: false, editing: null });
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar a categoria.");
    }
  };

  const remove = async () => {
    if (!confirm) return;
    try {
      await deleteContentCategory(activeNetworkId, confirm.id);
      toast.success("Categoria removida", { description: confirm.name });
      setConfirm(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover a categoria.");
    }
  };

  return (
    <>
      <PageHeader
        title="Categorias"
        subtitle="Organize os conteúdos reais migrados do legado por rede, status e categoria."
        actions={
          <NeonButton onClick={() => setModal({ open: true, editing: null })}>
            <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Nova categoria</span>
          </NeonButton>
        }
      />

      <GlassCard className="p-3 mb-6">
        <div className="flex items-center gap-2 px-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por nome, icone ou cor..."
            className="flex-1 bg-transparent py-2 text-sm focus:outline-none placeholder:text-slate-500"
          />
          <span className="text-[11px] text-slate-500">{filtradas.length} de {items.length}</span>
        </div>
      </GlassCard>

      <div className="grid grid-cols-12 gap-4">
        <AnimatePresence>
          {filtradas.map((category) => (
            <motion.div
              key={category.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="col-span-12 sm:col-span-6 xl:col-span-4"
            >
              <GlassCard className="p-5">
                <div className="flex items-start justify-between">
                  <CategoryBadge category={category} />
                  <div className="flex gap-1">
                    <button onClick={() => setModal({ open: true, editing: category })} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white" title="Editar">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setConfirm(category)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-300" title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 font-display text-lg text-white">{category.name}</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span className={`h-2.5 w-2.5 rounded-full ${getColorClasses(category.color).dot}`} />
                  Visual da categoria
                </div>
                <div className="mt-3 text-xs text-slate-400">{category.posts} posts vinculados</div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
        {!loading && filtradas.length === 0 && (
          <GlassCard className="col-span-12 p-10 text-center text-slate-400">Nenhuma categoria encontrada.</GlassCard>
        )}
        {loading && <GlassCard className="col-span-12 p-10 text-center text-slate-400">Carregando categorias...</GlassCard>}
      </div>

      <CategoriaModal
        open={modal.open}
        editing={modal.editing}
        onClose={() => setModal({ open: false, editing: null })}
        onSave={save}
      />
      <ConfirmDelete item={confirm} onCancel={() => setConfirm(null)} onConfirm={remove} />
    </>
  );
}

function CategoryBadge({ category }: { category: ContentCategoryRow }) {
  if (category.image_url) {
    return <img src={category.image_url} alt="" className="h-12 w-12 rounded-xl object-cover border border-white/10" />;
  }
  const Icon = ICONS[(category.icon || "folder-tree") as keyof typeof ICONS] ?? FolderTree;
  const color = getColorClasses(category.color);
  return (
    <div className={`h-12 w-12 rounded-xl grid place-items-center border ${color.border} ${color.bg} ${color.text}`}>
      <Icon className="h-6 w-6" />
    </div>
  );
}

function getColorClasses(value?: string | null) {
  return colorOptions.find((option) => option.value === value) ?? colorOptions[0];
}

function CategoriaModal({
  open,
  editing,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: CategoriaView | null;
  onClose: () => void;
  onSave: (data: { name: string; icon: string; color: string; imageUrl?: string | null }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("folder-tree");
  const [color, setColor] = useState("amber");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setIcon(editing?.icon ?? "folder-tree");
    setColor(editing?.color ?? "amber");
    setImageUrl(editing?.image_url ?? null);
    setSaving(false);
  }, [open, editing]);

  if (!open) return null;

  const onFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Envie uma imagem valida.");
    try {
      setSaving(true);
      setImageUrl(await uploadContentImage(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel enviar a imagem.");
    } finally {
      setSaving(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return toast.error("Informe o nome da categoria.");
    setSaving(true);
    await onSave({ name: name.trim(), icon, color, imageUrl });
    setSaving(false);
  };

  return (
    <ModalPortal open={open} onClose={onClose}>
      <AnimatePresence>
        <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.form onSubmit={submit} initial={{ y: 20, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.97 }} className="relative w-full max-w-lg rounded-2xl glass p-6 border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-amber-300/80">{editing ? "Editar" : "Criar"}</div>
                <h2 className="font-display text-xl text-white mt-1">{editing ? "Editar categoria" : "Nova categoria"}</h2>
              </div>
              <button type="button" onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs text-slate-400">Nome</span>
                <input autoFocus value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-amber-400/50" />
              </label>

              <div>
                <span className="text-xs text-slate-400">Icone</span>
                <div className="mt-2 grid grid-cols-8 gap-2">
                  {iconOptions.map((option) => {
                    const Icon = ICONS[option] ?? FolderTree;
                    const active = icon === option;
                    return (
                      <button key={option} type="button" onClick={() => setIcon(option)} title={option} className={`grid h-10 place-items-center rounded-xl border transition ${active ? "border-amber-400/70 bg-amber-400/15 text-amber-200" : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/25 hover:text-white"}`}>
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400">Cor</span>
                <div className="mt-2 grid grid-cols-6 gap-2">
                  {colorOptions.map((option) => {
                    const active = color === option.value;
                    return (
                      <button key={option.value} type="button" onClick={() => setColor(option.value)} title={option.label} className={`grid h-10 place-items-center rounded-xl border transition ${active ? `${option.border} ${option.bg}` : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}>
                        <span className={`h-5 w-5 rounded-full ${option.dot} shadow-lg`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-2"><ImageIcon className="h-3.5 w-3.5" /> Imagem</span>
                  {imageUrl && <button type="button" onClick={() => setImageUrl(null)} className="text-[11px] text-rose-300 hover:text-rose-200">Remover</button>}
                </div>
                <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 w-full rounded-xl border border-dashed border-white/15 hover:border-amber-400/40 bg-white/[0.02] px-4 py-4 flex items-center gap-3 text-left transition">
                  <span className="h-10 w-10 rounded-lg bg-white/5 grid place-items-center text-amber-300"><Upload className="h-4 w-4" /></span>
                  <span className="text-xs text-slate-400">{imageUrl ? "Imagem carregada. Clique para trocar." : "Clique para enviar PNG, JPG, WebP ou GIF."}</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => void onFile(event.target.files?.[0])} />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white hover:border-white/30">Cancelar</button>
              <NeonButton type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</NeonButton>
            </div>
          </motion.form>
        </motion.div>
      </AnimatePresence>
    </ModalPortal>
  );
}

function ConfirmDelete({ item, onCancel, onConfirm }: { item: CategoriaView | null; onCancel: () => void; onConfirm: () => void }) {
  if (!item) return null;
  return (
    <ModalPortal open={!!item} onClose={onCancel}>
      <AnimatePresence>
        <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
          <motion.div initial={{ y: 20, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.97 }} className="relative w-full max-w-md rounded-2xl glass p-6 border border-red-500/30">
            <h3 className="font-display text-lg text-white">Excluir categoria?</h3>
            <p className="text-sm text-slate-400 mt-2">A categoria <span className="text-white">{item.name}</span> sera inativada e os posts ficarao sem categoria.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white hover:border-white/30">Cancelar</button>
              <button onClick={onConfirm} className="px-4 py-2 rounded-xl text-sm bg-red-500/20 border border-red-500/50 text-red-200 hover:bg-red-500/30">Excluir</button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </ModalPortal>
  );
}
