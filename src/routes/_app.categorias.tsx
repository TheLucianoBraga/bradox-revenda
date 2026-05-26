import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { FolderTree, Plus, Edit3, Trash2, X, Search } from "lucide-react";

export const Route = createFileRoute("/_app/categorias")({ component: Categorias });

type Cor = "cyan" | "violet" | "emerald" | "amber" | "rose";
type Categoria = { id: number; nome: string; slug: string; descricao: string; posts: number; cor: Cor };

const seed: Categoria[] = [
  { id: 1, nome: "Tutoriais", slug: "tutoriais", descricao: "Guias passo a passo para revendedores.", posts: 24, cor: "cyan" },
  { id: 2, nome: "Anúncios", slug: "anuncios", descricao: "Comunicados oficiais da plataforma.", posts: 11, cor: "violet" },
  { id: 3, nome: "Promoções", slug: "promocoes", descricao: "Campanhas e ofertas sazonais.", posts: 8, cor: "emerald" },
  { id: 4, nome: "Suporte", slug: "suporte", descricao: "Artigos de ajuda e troubleshooting.", posts: 17, cor: "cyan" },
  { id: 5, nome: "Atualizações de Apps", slug: "apps", descricao: "Novidades de versões dos aplicativos.", posts: 6, cor: "violet" },
];

const cores: { v: Cor; cls: string }[] = [
  { v: "cyan", cls: "bg-cyan-400/20 border-cyan-400/50 text-cyan-300" },
  { v: "violet", cls: "bg-violet-400/20 border-violet-400/50 text-violet-300" },
  { v: "emerald", cls: "bg-emerald-400/20 border-emerald-400/50 text-emerald-300" },
  { v: "amber", cls: "bg-amber-400/20 border-amber-400/50 text-amber-300" },
  { v: "rose", cls: "bg-rose-400/20 border-rose-400/50 text-rose-300" },
];

const corClass = (c: Cor) => cores.find((x) => x.v === c)!.cls;
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
                  <div className={`h-10 w-10 rounded-xl grid place-items-center border ${corClass(c.cor)}`}>
                    <FolderTree className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      data-handled="true"
                      onClick={() => openEdit(c)}
                      className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                      title="Editar"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      data-handled="true"
                      onClick={() => setConfirm(c)}
                      className="h-8 w-8 grid place-items-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-300"
                      title="Excluir"
                    >
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

      <CategoriaModal
        open={modal.open}
        editing={modal.editing}
        existing={items}
        onClose={close}
        onSave={save}
      />

      <ConfirmDelete
        item={confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm)}
      />
    </>
  );
}

function CategoriaModal({
  open,
  editing,
  existing,
  onClose,
  onSave,
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
  const [slugDirty, setSlugDirty] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (open) {
      setNome(editing?.nome ?? "");
      setSlug(editing?.slug ?? "");
      setDescricao(editing?.descricao ?? "");
      setCor(editing?.cor ?? "cyan");
      setSlugDirty(!!editing);
      setErro("");
    }
  }, [open, editing]);

  useEffect(() => {
    if (!slugDirty) setSlug(slugify(nome));
  }, [nome, slugDirty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = nome.trim();
    const s = slugify(slug || nome);
    if (!n) return setErro("Informe o nome da categoria.");
    if (!s) return setErro("Slug inválido.");
    if (existing.some((c) => c.slug === s && c.id !== editing?.id)) return setErro("Já existe uma categoria com este slug.");
    onSave({ nome: n, slug: s, descricao: descricao.trim(), cor });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 grid place-items-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.form
          onSubmit={submit}
          initial={{ y: 20, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.97 }}
          className="relative w-full max-w-lg rounded-2xl glass p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">
                {editing ? "Editar" : "Criar"}
              </div>
              <h2 className="font-display text-xl text-white mt-1">
                {editing ? "Editar categoria" : "Nova categoria"}
              </h2>
            </div>
            <button
              type="button"
              data-handled="true"
              onClick={onClose}
              className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400">Nome *</label>
              <input
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Tutoriais"
                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-400/50"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Slug</label>
              <input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugDirty(true); }}
                placeholder="tutoriais"
                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-400/50"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                placeholder="Breve descrição da categoria…"
                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-cyan-400/50 resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Cor</label>
              <div className="mt-2 flex gap-2">
                {cores.map((c) => (
                  <button
                    key={c.v}
                    type="button"
                    data-handled="true"
                    onClick={() => setCor(c.v)}
                    className={`h-9 w-9 rounded-lg border-2 transition ${c.cls} ${cor === c.v ? "ring-2 ring-white/40" : "opacity-60 hover:opacity-100"}`}
                  />
                ))}
              </div>
            </div>
            {erro && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{erro}</div>}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              data-handled="true"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white hover:border-white/30"
            >
              Cancelar
            </button>
            <NeonButton type="submit">{editing ? "Salvar alterações" : "Criar categoria"}</NeonButton>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}

function ConfirmDelete({
  item,
  onCancel,
  onConfirm,
}: {
  item: Categoria | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!item) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 grid place-items-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.97 }}
          className="relative w-full max-w-md rounded-2xl glass p-6 border border-red-500/30"
        >
          <h3 className="font-display text-lg text-white">Excluir categoria?</h3>
          <p className="text-sm text-slate-400 mt-2">
            Tem certeza que deseja excluir <span className="text-white">{item.nome}</span>? Esta ação não pode ser desfeita.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              data-handled="true"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white hover:border-white/30"
            >
              Cancelar
            </button>
            <button
              data-handled="true"
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl text-sm bg-red-500/20 border border-red-500/50 text-red-200 hover:bg-red-500/30"
            >
              Excluir
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
