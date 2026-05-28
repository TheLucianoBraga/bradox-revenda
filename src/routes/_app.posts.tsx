import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { ModalPortal } from "@/components/ModalPortal";
import { YoutubeModal } from "@/components/YoutubeModal";
import { RichTextEditor } from "@/components/RichTextEditor";
import { RichTextView } from "@/components/RichTextView";
import { useAppSession } from "@/contexts/AppSessionContext";
import {
  deleteContent,
  fetchContentSnapshot,
  saveContent,
  updateFeaturedContentOrder,
  uploadContentImage,
  type ContentCategoryRow,
  type ContentRow,
} from "@/services/bradox/content";
import { ArrowDown, ArrowUp, Calendar, Check, Copy, ExternalLink, Grid2X2, Image as ImageIcon, Info, KeyRound, Link2, Monitor, Plus, Search, Share2, SlidersHorizontal, Star, Trash2, Upload, Video, X, Edit3, Play } from "lucide-react";

export const Route = createFileRoute("/_app/posts")({ component: Posts });

type Filter = "all" | "published" | "draft";
type CategoryFilter = "all" | string;

function Posts() {
  const { activeNetworkId, profile } = useAppSession();
  const canManageContent = profile?.role === "admin" || profile?.role === "revenda";
  const isClient = profile?.role === "cliente";
  const [categories, setCategories] = useState<ContentCategoryRow[]>([]);
  const [items, setItems] = useState<ContentRow[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContentRow | null>(null);
  const [viewing, setViewing] = useState<ContentRow | null>(null);
  const [showFeaturedOrder, setShowFeaturedOrder] = useState(false);
  const [savingFeaturedOrder, setSavingFeaturedOrder] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const snapshot = await fetchContentSnapshot(activeNetworkId, { publishedOnly: isClient });
      setCategories(snapshot.categories);
      setItems(snapshot.content);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [activeNetworkId, isClient]);

  const counts = categories.reduce<Record<string, number>>((acc, category) => {
    acc[category.id] = items.filter((post) => post.category_id === category.id).length;
    return acc;
  }, {});

  const normalizedSearch = search.trim().toLowerCase();
  const list = items.filter((post) => {
    const matchesStatus = filter === "all" || post.status === filter;
    const matchesCategory = categoryFilter === "all" || post.category_id === categoryFilter;
    const text = `${post.title} ${post.description ?? ""} ${stripHtml(post.body ?? "")}`.toLowerCase();
    const matchesSearch = !normalizedSearch || text.includes(normalizedSearch);
    return matchesStatus && matchesCategory && matchesSearch;
  }).sort(compareContentDisplay);
  const featuredPosts = items.filter((post) => post.is_featured).sort(compareFeaturedContent);

  const onNew = () => { setEditing(null); setOpen(true); };
  const onEdit = (post: ContentRow) => { setEditing(post); setOpen(true); };
  const onDelete = async (id: string) => {
    try {
      await deleteContent(activeNetworkId, id);
      toast.success("Post arquivado");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel excluir o post.");
    }
  };

  const onSave = async (data: ContentFormData) => {
    try {
      await saveContent(activeNetworkId, data);
      toast.success(data.id ? "Post atualizado" : "Post criado");
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar o post.");
    }
  };

  const moveFeatured = (id: string, direction: -1 | 1) => {
    const ordered = [...featuredPosts];
    const currentIndex = ordered.findIndex((post) => post.id === id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;
    const [item] = ordered.splice(currentIndex, 1);
    ordered.splice(nextIndex, 0, item);
    setItems((current) => current.map((post) => {
      const featuredIndex = ordered.findIndex((featured) => featured.id === post.id);
      return featuredIndex >= 0 ? { ...post, featured_order: featuredIndex } : post;
    }));
  };

  const saveFeaturedOrder = async () => {
    try {
      setSavingFeaturedOrder(true);
      await updateFeaturedContentOrder(activeNetworkId, featuredPosts.map((post) => post.id));
      toast.success("Ordem dos destaques salva");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar a ordem dos destaques.");
    } finally {
      setSavingFeaturedOrder(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Conteúdos"
        subtitle="Comunicados, tutoriais e recursos exclusivos para sua rede."
        actions={canManageContent ? (
          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={() => setShowFeaturedOrder((value) => !value)} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${showFeaturedOrder ? "border-amber-400/60 bg-amber-400/15 text-amber-100" : "border-white/10 bg-white/5 text-slate-200 hover:border-amber-400/40"}`}>
              <SlidersHorizontal className="h-4 w-4" /> Ordenar destaques
            </button>
            <NeonButton onClick={onNew}>
              <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Novo Conteudo</span>
            </NeonButton>
          </div>
        ) : undefined}
      />

      <AnimatePresence>
        {canManageContent && showFeaturedOrder && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-5 rounded-2xl border border-amber-400/20 bg-[#13110b]/90 p-4 shadow-xl shadow-black/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Destaques</div>
                <p className="mt-1 text-sm text-slate-400">Use as setas para definir a ordem em que os conteúdos destacados aparecem.</p>
              </div>
              <button onClick={saveFeaturedOrder} disabled={savingFeaturedOrder} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black shadow-lg shadow-amber-500/20 disabled:opacity-60">
                {savingFeaturedOrder ? "Salvando..." : "Salvar ordem"}
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {featuredPosts.map((post, index) => (
                <div key={post.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-400/15 text-xs font-black text-amber-200">{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{post.title}</div>
                    <div className="text-[11px] text-slate-500">Publicado em {formatDate(post.published_at || post.created_at)}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => moveFeatured(post.id, -1)} disabled={index === 0} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-300 hover:border-amber-400/40 disabled:opacity-35"><ArrowUp className="h-4 w-4" /></button>
                    <button onClick={() => moveFeatured(post.id, 1)} disabled={index === featuredPosts.length - 1} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-300 hover:border-amber-400/40 disabled:opacity-35"><ArrowDown className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              {featuredPosts.length === 0 && <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">Nenhum conteúdo marcado como destaque.</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-5 space-y-4">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin">
          <CategoryChip
            active={categoryFilter === "all"}
            label="Todos"
            count={items.length}
            icon={<Grid2X2 className="h-3.5 w-3.5" />}
            tone="primary"
            onClick={() => setCategoryFilter("all")}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              active={categoryFilter === category.id}
              label={category.name}
              count={counts[category.id] ?? 0}
              icon={getCategoryIcon(category.icon, category.name)}
              tone={getCategoryToneName(category.name, category.color)}
              onClick={() => setCategoryFilter(category.id)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por titulo, descricao ou conteudo..."
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#0f1115] px-11 text-sm text-slate-100 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-amber-400/50 focus:ring-4 focus:ring-amber-500/10"
            />
          </div>
          {canManageContent ? (
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as Filter)}
              className="h-12 rounded-2xl border border-white/10 bg-[#0f1115] px-4 text-sm font-semibold text-slate-200 shadow-sm outline-none transition focus:border-amber-400/50 focus:ring-4 focus:ring-amber-500/10 sm:w-48"
            >
              <option value="all">Todos os status</option>
              <option value="published">Publicados</option>
              <option value="draft">Rascunhos</option>
            </select>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {list.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            category={categories.find((category) => category.id === post.category_id)}
            onView={() => setViewing(post)}
            onEdit={canManageContent ? () => onEdit(post) : undefined}
            onDelete={canManageContent ? () => void onDelete(post.id) : undefined}
            onPlay={(url) => setVideo(url)}
          />
        ))}
        {!loading && list.length === 0 && (
          <GlassCard className="col-span-12 p-10 text-center text-sm text-slate-400">Nenhum conteúdo encontrado.</GlassCard>
        )}
        {loading && <GlassCard className="col-span-12 p-10 text-center text-sm text-slate-400">Carregando conteúdos...</GlassCard>}
      </div>

      <YoutubeModal url={video ?? ""} open={!!video} onOpenChange={(isOpen) => !isOpen && setVideo(null)} />
      <PostModal open={canManageContent && open} onClose={() => setOpen(false)} initial={editing} categories={categories} onSave={onSave} />
      <PostViewModal
        post={viewing}
        category={categories.find((category) => category.id === viewing?.category_id)}
        onClose={() => setViewing(null)}
        onPlay={(url) => setVideo(url)}
        onEdit={canManageContent ? (post) => { setViewing(null); onEdit(post); } : undefined}
      />
    </>
  );
}

function CategoryChip({
  active,
  label,
  count,
  icon,
  tone,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  icon: React.ReactNode;
  tone: CategoryToneName;
  onClick: () => void;
}) {
  const classes = getCategoryChipClasses(tone, active);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-extrabold shadow-sm transition hover:-translate-y-0.5 ${classes.button}`}
    >
      <span className={classes.icon}>{icon}</span>
      <span>{label}</span>
      <span className={`ml-1 grid min-w-6 place-items-center rounded-full px-1.5 py-0.5 text-[11px] font-black ${classes.count}`}>{count}</span>
    </button>
  );
}

type CategoryToneName = "primary" | "orange" | "amber" | "emerald" | "rose" | "lime" | "indigo";

function getCategoryToneName(name: string, color?: string | null): CategoryToneName {
  const value = `${name} ${color ?? ""}`.toLowerCase();
  if (value.includes("portal") || value.includes("revenda") || value.includes("orange")) return "orange";
  if (value.includes("comunicado") || value.includes("amber") || value.includes("yellow")) return "amber";
  if (value.includes("servidor") || value.includes("green") || value.includes("emerald")) return "emerald";
  if (value.includes("tutorial") || value.includes("red") || value.includes("rose")) return "rose";
  if (value.includes("dica") || value.includes("lime")) return "lime";
  if (value.includes("aplicativo") || value.includes("app") || value.includes("indigo") || value.includes("blue")) return "indigo";
  return "primary";
}

function getCategoryIcon(icon?: string | null, name = "") {
  const normalizedIcon = (icon ?? "").toLowerCase();
  if (["monitor", "portal"].includes(normalizedIcon)) return <Monitor className="h-3.5 w-3.5" />;
  if (["info", "megaphone", "comunicado"].includes(normalizedIcon)) return <Info className="h-3.5 w-3.5" />;
  if (["server", "servidor"].includes(normalizedIcon)) return <Calendar className="h-3.5 w-3.5" />;
  if (["book", "book-open", "tutorial"].includes(normalizedIcon)) return <ImageIcon className="h-3.5 w-3.5" />;
  if (["key", "lightbulb", "dica"].includes(normalizedIcon)) return <KeyRound className="h-3.5 w-3.5" />;
  if (["video", "app", "aplicativo", "smartphone", "tv"].includes(normalizedIcon)) return <Video className="h-3.5 w-3.5" />;
  const normalized = name.toLowerCase();
  if (normalized.includes("portal") || normalized.includes("revenda")) return <Monitor className="h-3.5 w-3.5" />;
  if (normalized.includes("comunicado")) return <Info className="h-3.5 w-3.5" />;
  if (normalized.includes("servidor")) return <Calendar className="h-3.5 w-3.5" />;
  if (normalized.includes("tutorial")) return <ImageIcon className="h-3.5 w-3.5" />;
  if (normalized.includes("dica")) return <KeyRound className="h-3.5 w-3.5" />;
  if (normalized.includes("aplicativo") || normalized.includes("app")) return <Video className="h-3.5 w-3.5" />;
  return <Grid2X2 className="h-3.5 w-3.5" />;
}

function getCategoryChipClasses(tone: CategoryToneName, active: boolean) {
  if (active) {
    return {
      button: "border border-amber-400/50 bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-amber-500/25",
      icon: "text-black",
      count: "bg-black/20 text-black",
    };
  }

  const tones: Record<CategoryToneName, { button: string; icon: string; count: string }> = {
    primary: { button: "border border-indigo-400/25 bg-indigo-400/10 text-indigo-200 hover:bg-indigo-400/15", icon: "text-indigo-300", count: "bg-indigo-300/15 text-indigo-100" },
    orange: { button: "border border-orange-400/25 bg-orange-400/10 text-orange-200 hover:bg-orange-400/15", icon: "text-orange-300", count: "bg-orange-300/15 text-orange-100" },
    amber: { button: "border border-amber-400/25 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15", icon: "text-amber-300", count: "bg-amber-300/15 text-amber-100" },
    emerald: { button: "border border-emerald-400/25 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15", icon: "text-emerald-300", count: "bg-emerald-300/15 text-emerald-100" },
    rose: { button: "border border-rose-400/25 bg-rose-400/10 text-rose-200 hover:bg-rose-400/15", icon: "text-rose-300", count: "bg-rose-300/15 text-rose-100" },
    lime: { button: "border border-lime-400/25 bg-lime-400/10 text-lime-200 hover:bg-lime-400/15", icon: "text-lime-300", count: "bg-lime-300/15 text-lime-100" },
    indigo: { button: "border border-indigo-400/25 bg-indigo-400/10 text-indigo-200 hover:bg-indigo-400/15", icon: "text-indigo-300", count: "bg-indigo-300/15 text-indigo-100" },
  };
  return tones[tone];
}

function PostCard({
  post,
  category,
  onView,
  onEdit,
  onDelete,
  onPlay,
}: {
  post: ContentRow;
  category?: ContentCategoryRow;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPlay: (url: string) => void;
}) {
  const images = getPostImages(post);
  const imageUrl = images[0] || (post.video_url ? getYouTubeThumbnail(post.video_url) : null);
  const hasMedia = Boolean(imageUrl || post.video_url);
  const categoryLabel = category?.name ?? "Sem categoria";
  const categoryTone = getCategoryTone(category?.color);
  const summary = stripHtml(post.description || post.body || "");
  return (
    <div className="col-span-12 sm:col-span-6 xl:col-span-4 cursor-pointer" onClick={onView}>
      <div className="group h-full overflow-hidden rounded-[22px] border border-white/10 bg-[#101217] shadow-[0_24px_70px_-46px_rgba(0,0,0,0.9)] transition duration-300 hover:-translate-y-1 hover:border-amber-400/35 hover:shadow-[0_30px_80px_-48px_rgba(245,158,11,0.45)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#191b22]">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="absolute inset-0 flex flex-col justify-end overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.22),transparent_34%),linear-gradient(145deg,#171a22,#0d0f14_58%,#1c1609)] p-5">
              <div className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200 shadow-lg shadow-black/20">
                {getCategoryIcon(category?.icon, categoryLabel)}
              </div>
              <div className="relative max-w-[82%]">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300/80">Conteudo</div>
                <div className="mt-2 line-clamp-3 font-display text-xl leading-tight text-white">{post.title}</div>
                {summary && <div className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-400">{summary}</div>}
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />
          <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur ${categoryTone.badge}`}>
            <span className="h-3.5 w-3.5 rounded-[5px] grid place-items-center border border-current/20"><Video className="h-2.5 w-2.5" /></span>
            {categoryLabel}
          </span>
          {post.is_featured && (
            <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-amber-500 text-white shadow-lg">
              <Star className="h-4 w-4" fill="currentColor" />
            </span>
          )}
          {post.video_url && (
            <button onClick={(event) => { event.stopPropagation(); onPlay(post.video_url!); }} className="absolute inset-0 grid place-items-center group/play">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-black/70 text-amber-300 shadow-xl ring-1 ring-amber-300/40 transition group-hover/play:scale-110">
                <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
              </span>
            </button>
          )}
        </div>
        <div className={`p-4 ${!hasMedia ? "border-t border-white/10" : ""}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="font-display text-[17px] leading-tight text-white flex-1 line-clamp-2">{post.title}</div>
            {onEdit && onDelete ? (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition" onClick={(event) => event.stopPropagation()}>
                <button onClick={onEdit} className="p-1.5 rounded-md border border-white/10 bg-white/5 hover:border-amber-400/50 text-slate-400" title="Editar">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button onClick={onDelete} className="p-1.5 rounded-md border border-white/10 bg-white/5 hover:border-red-400/50 text-slate-400 hover:text-red-300" title="Excluir">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>
          <p className="mt-3 min-h-[42px] text-[14px] leading-relaxed text-slate-400 line-clamp-2">{summary}</p>
          {post.cta_text && post.cta_link && (
            <a href={post.cta_link} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-400/20">
              {post.cta_text} <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(post.published_at || post.created_at)}</span>
            <Copy className="h-4 w-4 text-slate-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function getPostImages(post: ContentRow) {
  return Array.isArray(post.images) ? post.images.filter((image): image is string => typeof image === "string" && image.trim().length > 0) : [];
}

function PostViewModal({
  post,
  category,
  onClose,
  onPlay,
  onEdit,
}: {
  post: ContentRow | null;
  category?: ContentCategoryRow;
  onClose: () => void;
  onPlay: (url: string) => void;
  onEdit?: (post: ContentRow) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  if (!post) return null;
  const images = getPostImages(post);
  const imageUrl = images[0] || (post.video_url ? getYouTubeThumbnail(post.video_url) : null);
  const categoryTone = getCategoryTone(category?.color);
  const links = Array.isArray(post.links) ? post.links.filter(isContentLink) : [];

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(post.body || post.description || post.title);
      setCopied(true);
      toast.success("Texto copiado");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Nao foi possivel copiar.");
    }
  };

  const shareContent = async () => {
    const url = `${window.location.origin}/posts?id=${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: post.title, text: post.description || post.title, url });
      else await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      toast.error("Nao foi possivel compartilhar.");
    }
  };

  return (
    <ModalPortal open onClose={onClose}>
      <AnimatePresence>
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div initial={{ y: 16, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0, scale: 0.98 }} onClick={(event) => event.stopPropagation()} className="w-full max-w-[720px] max-h-[92vh] overflow-hidden rounded-[18px] border border-white/10 bg-[#0f1115] text-slate-100 shadow-2xl shadow-black/60">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/10 bg-[#101217]/95 px-4 py-3 backdrop-blur">
              <div className="flex min-w-0 items-start gap-3">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${categoryTone.icon}`}><Video className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${categoryTone.soft}`}>{category?.name ?? "Sem categoria"}</span>
                    {post.status === "draft" && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Rascunho</span>}
                  </div>
                  <h2 className="mt-1 line-clamp-2 font-display text-[17px] font-semibold leading-tight text-white">{post.title}</h2>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={shareContent} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white">{shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}</button>
                <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="max-h-[calc(92vh-70px)] overflow-y-auto px-4 py-4 scrollbar-thin">
              <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatLongDate(post.published_at || post.created_at)}</span>
              </div>

              {post.description && <p className="mb-4 text-[14px] leading-relaxed text-slate-300">{linkifyText(post.description)}</p>}

              {images.length > 0 && (
                <section className="mb-5">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-300"><ImageIcon className="h-3.5 w-3.5" /> Imagens ({images.length})</div>
                  <div className={images.length === 1 ? "grid grid-cols-1" : "grid grid-cols-2 gap-3"}>
                    {images.map((image) => (
                      <a key={image} href={image} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-[8px] border border-white/10 bg-black/25">
                        <img src={image} alt="" className="mx-auto max-h-[420px] w-full object-contain" />
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {images.length === 0 && imageUrl && (
                <section className="mb-5 overflow-hidden rounded-[8px] border border-white/10 bg-black/25">
                  <img src={imageUrl} alt="" className="mx-auto max-h-[420px] w-full object-contain" />
                </section>
              )}

              {post.video_url && (
                <section className="mb-5">
                  <button onClick={() => onPlay(post.video_url!)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100 hover:border-amber-300/50 hover:bg-amber-400/15">
                    <Play className="h-4 w-4" fill="currentColor" /> Assistir video
                  </button>
                </section>
              )}

              {post.body && (
                <section className="mb-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-300">Conteudo</div>
                    <button onClick={copyText} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:border-amber-400/40 hover:text-amber-200">
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copiado" : "Copiar texto"}
                    </button>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#151820] p-4 text-[14px] leading-relaxed text-slate-300 shadow-sm">
                    <div className="whitespace-pre-wrap">{renderTextWithLinks(post.body)}</div>
                  </div>
                </section>
              )}

              {links.length > 0 && (
                <section className="mb-5">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-300"><Link2 className="h-3.5 w-3.5" /> Links</div>
                  <div className="space-y-2">
                    {links.map((link, index) => (
                      <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3 text-slate-200 shadow-sm ring-1 ring-white/10 hover:ring-amber-400/40">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-400/10 text-amber-300"><ExternalLink className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{link.label || "Abrir link"}</span>
                          <span className="block truncate text-[11px] text-slate-500">{link.url}</span>
                        </span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {post.cta_text && post.cta_link && (
                <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-[#0f1115] via-[#0f1115] to-transparent px-4 pb-1 pt-3">
                  <a href={post.cta_link} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-3 text-sm font-bold text-black shadow-lg shadow-amber-500/20 hover:brightness-105">
                    {post.cta_text} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

              {onEdit ? (
                <div className="mt-5 flex justify-end">
                  <button onClick={() => onEdit(post)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-amber-400/40 hover:text-amber-200">
                    <Edit3 className="h-3.5 w-3.5" /> Editar
                  </button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </ModalPortal>
  );
}

type ContentFormData = Parameters<typeof saveContent>[1];

function PostModal({
  open,
  onClose,
  initial,
  categories,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: ContentRow | null;
  categories: ContentCategoryRow[];
  onSave: (post: ContentFormData) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [contentType, setContentType] = useState<ContentRow["content_type"]>("comunicado");
  const [status, setStatus] = useState<ContentRow["status"]>("draft");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [publishedAt, setPublishedAt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setCategoryId(initial?.category_id ?? categories[0]?.id ?? "");
    setContentType(initial?.content_type ?? "comunicado");
    setStatus(initial?.status ?? "draft");
    setDescription(initial?.description ?? "");
    setBody(initial?.body ?? "");
    setVideoUrl(initial?.video_url ?? "");
    setCtaText(initial?.cta_text ?? "");
    setCtaLink(initial?.cta_link ?? "");
    setIsFeatured(initial?.is_featured ?? false);
    setPublishedAt(toDatetimeLocal(initial?.published_at ?? new Date().toISOString()));
    setImages(initial ? getPostImages(initial) : []);
    setSaving(false);
  }, [open, initial, categories]);

  if (!open) return null;

  const onFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Envie uma imagem valida.");
    try {
      setSaving(true);
      const url = await uploadContentImage(file);
      setImages((current) => [url, ...current]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel enviar a imagem.");
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!title.trim()) return toast.error("Informe o titulo.");
    if (!stripHtml(body)) return toast.error("Informe o conteudo.");
    setSaving(true);
    await onSave({
      id: initial?.id,
      categoryId: categoryId || null,
      title: title.trim(),
      description: description.trim() || null,
      body: body.trim(),
      contentType,
      videoUrl: videoUrl.trim() || null,
      images,
      ctaText: ctaText.trim() || null,
      ctaLink: ctaLink.trim() || null,
      status,
      isFeatured,
      featuredOrder: initial?.featured_order ?? 0,
      publishedAt: status === "published" ? publishedAt : null,
    });
    setSaving(false);
  };

  const field = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50";
  const label = "text-[11px] uppercase tracking-wider text-slate-400";

  return (
    <ModalPortal open={open} onClose={onClose}>
      <AnimatePresence>
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div initial={{ y: 16, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0, scale: 0.98 }} onClick={(event) => event.stopPropagation()} className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0f1115] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <div className="font-display text-lg text-white">{initial ? "Editar post" : "Novo post"}</div>
                <div className="text-xs text-slate-400">Conteudo publicado na rede ativa</div>
              </div>
              <button onClick={onClose} className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/5">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-12 gap-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
              <div className="col-span-12">
                <div className={label}>Titulo</div>
                <input value={title} onChange={(event) => setTitle(event.target.value)} className={field} placeholder="Ex.: Tutorial de instalacao" />
              </div>
              <div className="col-span-12 md:col-span-6">
                <div className={label}>Categoria</div>
                <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={`${field} bg-[#0f1115]`}>
                  <option value="">Sem categoria</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
              <div className="col-span-12 md:col-span-6">
                <div className={label}>Tipo</div>
                <select value={contentType} onChange={(event) => setContentType(event.target.value as ContentRow["content_type"])} className={`${field} bg-[#0f1115]`}>
                  <option value="comunicado">Comunicado</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="aplicativo">Aplicativo</option>
                  <option value="atualizacao">Atualizacao</option>
                </select>
              </div>
              <div className="col-span-12">
                <div className={label}>Resumo</div>
                <input value={description} onChange={(event) => setDescription(event.target.value)} className={field} placeholder="Linha curta para o card" />
              </div>
              <div className="col-span-12">
                <div className={label}>Conteudo</div>
                <div className="mt-1">
                  <RichTextEditor value={body} onChange={setBody} placeholder="Descreva o conteudo com formatacao..." minHeight={200} />
                </div>
              </div>
              <div className="col-span-12 md:col-span-6">
                <div className={label}>URL de video</div>
                <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} className={field} placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div className="col-span-12 md:col-span-6">
                <div className={label}>Imagem</div>
                <button onClick={() => fileRef.current?.click()} className="mt-1 w-full px-3 py-2 rounded-lg border border-dashed border-white/15 bg-white/5 text-sm text-slate-300 flex items-center gap-2 justify-center">
                  <Upload className="h-4 w-4" /> Enviar imagem
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => void onFile(event.target.files?.[0])} />
              </div>
              {images.length > 0 && (
                <div className="col-span-12 flex gap-2 overflow-x-auto pb-1">
                  {images.map((image) => (
                    <div key={image} className="relative h-16 w-24 shrink-0 rounded-lg overflow-hidden border border-white/10">
                      <img src={image} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => setImages((current) => current.filter((item) => item !== image))} className="absolute top-1 right-1 rounded bg-black/70 p-1 text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="col-span-12 md:col-span-6">
                <div className={label}>Texto do botao</div>
                <input value={ctaText} onChange={(event) => setCtaText(event.target.value)} className={field} placeholder="Ex.: Solicitar conteudo" />
              </div>
              <div className="col-span-12 md:col-span-6">
                <div className={label}>URL do botao</div>
                <input value={ctaLink} onChange={(event) => setCtaLink(event.target.value)} className={field} placeholder="https://..." />
              </div>
              <div className="col-span-12 md:col-span-6">
                <div className={label}>Data de publicacao</div>
                <input type="datetime-local" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} className={field} disabled={status !== "published"} />
              </div>
              <div className="col-span-12 md:col-span-6 flex items-end">
                <button onClick={() => setPublishedAt(toDatetimeLocal(new Date().toISOString()))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:border-amber-400/40 hover:text-white" disabled={status !== "published"}>
                  Usar data/hora atual
                </button>
              </div>
              <div className="col-span-12 flex flex-wrap gap-2">
                {(["published", "draft"] as const).map((nextStatus) => (
                  <button key={nextStatus} onClick={() => setStatus(nextStatus)} className={`px-3 py-2 rounded-lg border text-xs transition ${status === nextStatus ? "border-amber-400/50 bg-amber-400/10 text-amber-200" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}>
                    {nextStatus === "published" ? "Publicado" : "Rascunho"}
                  </button>
                ))}
                <button onClick={() => setIsFeatured((value) => !value)} className={`px-3 py-2 rounded-lg border text-xs transition ${isFeatured ? "border-amber-400/50 bg-amber-400/10 text-amber-200" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}>
                  <Star className="inline h-3 w-3 mr-1" /> Destaque
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10 bg-black/20">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5">Cancelar</button>
              <NeonButton onClick={submit} disabled={saving}>
                <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> {saving ? "Salvando..." : initial ? "Salvar alteracoes" : "Criar post"}</span>
              </NeonButton>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </ModalPortal>
  );
}

function stripHtml(value: string) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function compareFeaturedContent(a: ContentRow, b: ContentRow) {
  const featuredOrderDiff = (a.featured_order ?? 0) - (b.featured_order ?? 0);
  if (featuredOrderDiff !== 0) return featuredOrderDiff;
  return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
}

function compareContentDisplay(a: ContentRow, b: ContentRow) {
  if (a.is_featured && b.is_featured) return compareFeaturedContent(a, b);
  if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
  return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
}

function getYouTubeVideoId(url: string) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
    /youtube\.com\/shorts\/([^?&\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getYouTubeThumbnail(url: string) {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

function renderTextWithLinks(text: string) {
  const urlPattern = /(https?:\/\/[^\s<>]+)/g;
  return text.split("\n").map((line, lineIndex) => {
    if (!line.trim()) return <br key={lineIndex} />;
    return (
      <p key={lineIndex} className="mb-2 last:mb-0">
        {line.split(urlPattern).map((part, partIndex) => {
          if (urlPattern.test(part)) {
            urlPattern.lastIndex = 0;
            return <a key={partIndex} href={part} target="_blank" rel="noopener noreferrer" className="break-all text-indigo-600 hover:underline">{part}</a>;
          }
          urlPattern.lastIndex = 0;
          return part;
        })}
      </p>
    );
  });
}

function linkifyText(text: string) {
  const urlPattern = /(https?:\/\/[^\s<>]+)/g;
  return text.split(urlPattern).map((part, index) => {
    if (urlPattern.test(part)) {
      urlPattern.lastIndex = 0;
      return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="break-all text-indigo-600 hover:underline">{part}</a>;
    }
    urlPattern.lastIndex = 0;
    return part;
  });
}

function getCategoryTone(color?: string | null) {
  const normalized = (color || "amber").toLowerCase();
  if (["emerald", "green", "lime"].includes(normalized)) {
    return {
      badge: "bg-emerald-50/95 text-emerald-700",
      icon: "bg-emerald-50 text-emerald-600",
      soft: "bg-emerald-50 text-emerald-700",
    };
  }
  if (["red", "rose"].includes(normalized)) {
    return {
      badge: "bg-rose-50/95 text-rose-700",
      icon: "bg-rose-50 text-rose-600",
      soft: "bg-rose-50 text-rose-700",
    };
  }
  if (["primary", "blue", "indigo", "violet"].includes(normalized)) {
    return {
      badge: "bg-indigo-50/95 text-indigo-700",
      icon: "bg-indigo-50 text-indigo-600",
      soft: "bg-indigo-50 text-indigo-700",
    };
  }
  return {
    badge: "bg-amber-50/95 text-amber-700",
    icon: "bg-amber-50 text-amber-600",
    soft: "bg-amber-50 text-amber-700",
  };
}

function isContentLink(value: unknown): value is { label?: string; url: string } {
  return typeof value === "object" && value !== null && "url" in value && typeof (value as { url?: unknown }).url === "string";
}
