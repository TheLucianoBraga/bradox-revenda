import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ArrowUpRight, Edit3, Folder, ImageIcon, Link2, Plus, Search, Trash2, Upload, Wrench, X } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ModalPortal } from "@/components/ModalPortal";
import { useAppSession } from "@/contexts/AppSessionContext";
import { GlassCard, NeonButton, PageHeader } from "@/components/ui-kit";
import {
  deleteUsefulLink,
  deleteUsefulLinkCategory,
  fetchToolsSnapshot,
  reorderUsefulLinkCategories,
  reorderUsefulLinks,
  saveUsefulLink,
  saveUsefulLinkCategory,
  type UsefulLinkCategoryRow,
  type UsefulLinkRow,
  uploadUsefulLinkImage,
} from "@/services/bradox/tools";

export const Route = createFileRoute("/_app/ferramentas")({ component: Ferramentas });

type UsefulLinkGroup = UsefulLinkCategoryRow & {
  links: UsefulLinkRow[];
};

type CategoryModalState = { mode: "create" | "edit"; item?: UsefulLinkCategoryRow } | null;
type ToolModalState = { mode: "create" | "edit"; item?: UsefulLinkRow; categoryId?: string | null } | null;
type DeleteState =
  | { type: "category"; item: UsefulLinkCategoryRow }
  | { type: "tool"; item: UsefulLinkRow }
  | null;

function Ferramentas() {
  const { activeNetworkId } = useAppSession();
  const [groups, setGroups] = useState<UsefulLinkGroup[]>([]);
  const [orphanLinks, setOrphanLinks] = useState<UsefulLinkRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [categoryModal, setCategoryModal] = useState<CategoryModalState>(null);
  const [toolModal, setToolModal] = useState<ToolModalState>(null);
  const [toDelete, setToDelete] = useState<DeleteState>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const { categories, links } = await fetchToolsSnapshot(activeNetworkId);
      setGroups(categories.map((category) => ({
        ...category,
        links: links.filter((link) => link.category_id === category.id),
      })));
      setOrphanLinks(links.filter((link) => !link.category_id || !categories.some((category) => category.id === link.category_id)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar ferramentas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [activeNetworkId]);

  const filteredGroups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return groups;

    return groups
      .map((group) => ({
        ...group,
        links: group.links.filter((link) =>
          link.title.toLowerCase().includes(term) ||
          link.url.toLowerCase().includes(term) ||
          group.name.toLowerCase().includes(term),
        ),
      }))
      .filter((group) => group.links.length > 0 || group.name.toLowerCase().includes(term));
  }, [groups, query]);

  const filteredOrphans = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return orphanLinks;
    return orphanLinks.filter((link) => link.title.toLowerCase().includes(term) || link.url.toLowerCase().includes(term));
  }, [orphanLinks, query]);

  const allCategories = groups.map(({ links, ...category }) => category);
  const totalLinks = groups.reduce((sum, group) => sum + group.links.length, 0) + orphanLinks.length;

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      if (toDelete.type === "category") {
        await deleteUsefulLinkCategory(activeNetworkId, toDelete.item.id);
        toast.success("Categoria excluida");
      } else {
        await deleteUsefulLink(activeNetworkId, toDelete.item.id);
        toast.success("Ferramenta excluida");
      }
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel excluir");
    }
  };

  const moveCategory = async (categoryId: string, direction: "up" | "down") => {
    const nextOrder = moveId(groups.map((group) => group.id), categoryId, direction);
    if (!nextOrder) return;
    try {
      await reorderUsefulLinkCategories(activeNetworkId, nextOrder);
      toast.success("Ordem das categorias atualizada");
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel reordenar categorias");
    }
  };

  const moveTool = async (links: UsefulLinkRow[], linkId: string, direction: "up" | "down") => {
    const nextOrder = moveId(links.map((link) => link.id), linkId, direction);
    if (!nextOrder) return;
    try {
      await reorderUsefulLinks(activeNetworkId, nextOrder);
      toast.success("Ordem das ferramentas atualizada");
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel reordenar ferramentas");
    }
  };

  return (
    <>
      <PageHeader
        title="Ferramentas"
        subtitle="Cadastre categorias, links uteis, imagens e a ordem de apresentacao da rede Braga Digital."
        actions={
          <div className="flex flex-wrap gap-2">
            <NeonButton variant="secondary" onClick={() => setCategoryModal({ mode: "create" })}>
              <Plus className="h-4 w-4" /> Nova categoria
            </NeonButton>
            <NeonButton onClick={() => setToolModal({ mode: "create" })}>
              <Plus className="h-4 w-4" /> Nova ferramenta
            </NeonButton>
          </div>
        }
      />

      <div className="mb-5 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar ferramenta, categoria ou URL"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
          />
        </div>
        <div className="text-xs text-slate-400">{loading ? "Carregando..." : `${totalLinks} links`}</div>
      </div>

      <div className="space-y-6">
        {filteredGroups.map((group, groupIndex) => (
          <section key={group.id}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-400/10 border border-amber-300/20 grid place-items-center">
                  <Folder className="h-4 w-4 text-amber-300" />
                </div>
                <div>
                  <h2 className="font-display text-lg text-white">{group.name}</h2>
                  <div className="text-xs text-slate-500">{group.links.length} links disponiveis</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => moveCategory(group.id, "up")} disabled={groupIndex === 0 || !!query.trim()} className={iconActionClass} title="Subir categoria">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => moveCategory(group.id, "down")} disabled={groupIndex === filteredGroups.length - 1 || !!query.trim()} className={iconActionClass} title="Descer categoria">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setToolModal({ mode: "create", categoryId: group.id })} className={smallActionClass}>
                  <Plus className="h-3.5 w-3.5" /> Ferramenta
                </button>
                <button onClick={() => setCategoryModal({ mode: "edit", item: group })} className={smallActionClass}>
                  <Edit3 className="h-3.5 w-3.5" /> Editar
                </button>
                <button onClick={() => setToDelete({ type: "category", item: group })} className={smallDangerClass}>
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              </div>
            </div>
            <UsefulLinksGrid links={group.links} onMove={(id, direction) => moveTool(group.links, id, direction)} onEdit={(item) => setToolModal({ mode: "edit", item })} onDelete={(item) => setToDelete({ type: "tool", item })} />
          </section>
        ))}

        {filteredOrphans.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 grid place-items-center">
                <Wrench className="h-4 w-4 text-slate-300" />
              </div>
              <div>
                <h2 className="font-display text-lg text-white">Sem categoria</h2>
                <div className="text-xs text-slate-500">{filteredOrphans.length} links disponiveis</div>
              </div>
            </div>
            <UsefulLinksGrid links={filteredOrphans} onMove={(id, direction) => moveTool(orphanLinks, id, direction)} onEdit={(item) => setToolModal({ mode: "edit", item })} onDelete={(item) => setToDelete({ type: "tool", item })} />
          </section>
        )}

        {!loading && filteredGroups.length === 0 && filteredOrphans.length === 0 && (
          <GlassCard className="p-10 text-center text-sm text-slate-400">
            Nenhuma ferramenta encontrada.
          </GlassCard>
        )}
      </div>

      <CategoryModal
        state={categoryModal}
        networkId={activeNetworkId}
        onClose={() => setCategoryModal(null)}
        onSaved={async () => {
          setCategoryModal(null);
          await reload();
        }}
      />
      <ToolModal
        state={toolModal}
        networkId={activeNetworkId}
        categories={allCategories}
        onClose={() => setToolModal(null)}
        onSaved={async () => {
          setToolModal(null);
          await reload();
        }}
      />
      <ConfirmModal
        open={!!toDelete}
        title={toDelete?.type === "category" ? "Excluir categoria" : "Excluir ferramenta"}
        description={toDelete?.type === "category"
          ? `A categoria \"${toDelete.item.name}\" sera removida e suas ferramentas ficarao sem categoria.`
          : `Tem certeza que deseja excluir \"${toDelete?.item.title}\"?`}
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

function UsefulLinksGrid({
  links,
  onMove,
  onEdit,
  onDelete,
}: {
  links: UsefulLinkRow[];
  onMove: (id: string, direction: "up" | "down") => void;
  onEdit: (link: UsefulLinkRow) => void;
  onDelete: (link: UsefulLinkRow) => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-4">
      {links.map((link, index) => (
        <GlassCard key={link.id} className="col-span-12 md:col-span-6 xl:col-span-4 h-full p-4 border-white/10">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400/25 to-yellow-500/10 border border-white/10 grid place-items-center shrink-0 overflow-hidden">
              {link.image_url ? <img src={link.image_url} alt="" className="h-full w-full object-cover" /> : <Link2 className="h-5 w-5 text-amber-300" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-white truncate">{link.title.trim()}</div>
              <div className="mt-1 text-xs text-slate-500 truncate">{link.url}</div>
            </div>
          </div>
          {link.image_url && (
            <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500">
              <ImageIcon className="h-3 w-3" /> Imagem vinculada
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <a href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:border-amber-300/40 hover:text-amber-200">
              Abrir <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <div className="flex items-center gap-2">
              <button onClick={() => onMove(link.id, "up")} disabled={index === 0} className={iconActionClass} title="Subir ferramenta">
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onMove(link.id, "down")} disabled={index === links.length - 1} className={iconActionClass} title="Descer ferramenta">
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onEdit(link)} className={iconActionClass} title="Editar ferramenta">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onDelete(link)} className={iconDangerClass} title="Excluir ferramenta">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function CategoryModal({
  state,
  networkId,
  onClose,
  onSaved,
}: {
  state: CategoryModalState;
  networkId: string | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("folder");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!state) return;
    setName(state.item?.name ?? "");
    setIcon(state.item?.icon ?? "folder");
    setDisplayOrder(state.item?.display_order ?? 0);
  }, [state]);

  if (!state) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome da categoria");
      return;
    }
    setSaving(true);
    try {
      await saveUsefulLinkCategory(networkId, { id: state.item?.id, name, icon, displayOrder });
      toast.success(state.mode === "edit" ? "Categoria atualizada" : "Categoria criada");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar a categoria");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
        <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f1115] p-5 shadow-2xl">
          <ModalHeader title={state.mode === "edit" ? "Editar categoria" : "Nova categoria"} onClose={onClose} />
          <div className="mt-5 grid gap-4">
            <Field label="Nome">
              <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Ex.: Paineis" autoFocus />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Icone">
                <input value={icon} onChange={(event) => setIcon(event.target.value)} className={inputClass} placeholder="folder" />
              </Field>
              <Field label="Ordem da categoria">
                <input type="number" value={displayOrder} onChange={(event) => setDisplayOrder(Number(event.target.value))} className={inputClass} />
              </Field>
            </div>
          </div>
          <ModalActions saving={saving} label={state.mode === "edit" ? "Salvar categoria" : "Criar categoria"} onClose={onClose} />
        </form>
      </div>
    </ModalPortal>
  );
}

function ToolModal({
  state,
  networkId,
  categories,
  onClose,
  onSaved,
}: {
  state: ToolModalState;
  networkId: string | null;
  categories: UsefulLinkCategoryRow[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [icon, setIcon] = useState("link");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!state) return;
    setTitle(state.item?.title ?? "");
    setUrl(state.item?.url ?? "");
    setCategoryId(state.item?.category_id ?? state.categoryId ?? "");
    setImageUrl(state.item?.image_url ?? "");
    setIcon(state.item?.icon ?? "link");
    setDisplayOrder(state.item?.display_order ?? 0);
  }, [state]);

  if (!state) return null;

  const uploadImage = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Envie uma imagem valida");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande", { description: "Use um arquivo de ate 5 MB." });
      return;
    }
    setUploadingImage(true);
    try {
      const publicUrl = await uploadUsefulLinkImage(file);
      setImageUrl(publicUrl);
      toast.success("Imagem enviada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel enviar imagem");
    } finally {
      setUploadingImage(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Informe o nome da ferramenta");
      return;
    }
    if (!url.trim()) {
      toast.error("Informe a URL da ferramenta");
      return;
    }
    setSaving(true);
    try {
      await saveUsefulLink(networkId, {
        id: state.item?.id,
        title,
        url,
        categoryId: categoryId || null,
        imageUrl,
        icon,
        displayOrder,
      });
      toast.success(state.mode === "edit" ? "Ferramenta atualizada" : "Ferramenta criada");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar a ferramenta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
        <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f1115] p-5 shadow-2xl">
          <ModalHeader title={state.mode === "edit" ? "Editar ferramenta" : "Nova ferramenta"} onClose={onClose} />
          <div className="mt-5 grid gap-4">
            <Field label="Nome">
              <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} placeholder="Ex.: Painel de clientes" autoFocus />
            </Field>
            <Field label="URL">
              <input value={url} onChange={(event) => setUrl(event.target.value)} className={inputClass} placeholder="https://exemplo.com" />
            </Field>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Categoria">
                <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={inputClass}>
                  <option value="">Sem categoria</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </Field>
              <Field label="Ordem da ferramenta">
                <input type="number" value={displayOrder} onChange={(event) => setDisplayOrder(Number(event.target.value))} className={inputClass} />
              </Field>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Icone">
                <input value={icon} onChange={(event) => setIcon(event.target.value)} className={inputClass} placeholder="link" />
              </Field>
              <div>
                <span className="text-xs text-slate-400">Imagem URL ou upload</span>
                <div className="mt-1.5 grid grid-cols-[1fr_auto] gap-2">
                  <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} className={inputClass} placeholder="https://..." />
                  <label className="inline-flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white hover:border-amber-300/40 disabled:opacity-60">
                    <Upload className="h-4 w-4" /> {uploadingImage ? "Enviando" : "Upload"}
                    <input type="file" accept="image/*" className="sr-only" disabled={uploadingImage} onChange={(event) => uploadImage(event.target.files?.[0] ?? null)} />
                  </label>
                </div>
              </div>
            </div>
            {imageUrl && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-2 text-xs text-slate-400">Previa da imagem</div>
                <img src={imageUrl} alt="Previa da ferramenta" className="h-24 w-24 rounded-xl object-cover" />
              </div>
            )}
          </div>
          <ModalActions saving={saving} label={state.mode === "edit" ? "Salvar ferramenta" : "Criar ferramenta"} onClose={onClose} />
        </form>
      </div>
    </ModalPortal>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-xl text-white">{title}</h2>
      <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function ModalActions({ saving, label, onClose }: { saving: boolean; label: string; onClose: () => void }) {
  return (
    <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
      <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:border-white/30">
        Cancelar
      </button>
      <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-60">
        {saving ? "Salvando..." : label}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function moveId(ids: string[], id: string, direction: "up" | "down") {
  const currentIndex = ids.indexOf(id);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ids.length) return null;

  const next = [...ids];
  [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
  return next;
}

const inputClass = "w-full rounded-xl border border-white/10 bg-[#101317] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none";
const smallActionClass = "inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:border-amber-300/40 hover:text-amber-200";
const smallDangerClass = "inline-flex items-center gap-1 rounded-lg border border-red-400/20 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-200 hover:border-red-300/50";
const iconActionClass = "grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:border-amber-300/40 hover:text-amber-200";
const iconDangerClass = "grid h-8 w-8 place-items-center rounded-lg border border-red-400/20 bg-red-500/10 text-red-200 hover:border-red-300/50";
