import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  MessageSquareText, Plus, Search, Pencil, Trash2, Copy, X,
  Bold, Italic, Strikethrough, Code, CheckCheck, Tag,
  ImagePlus, Film, Paperclip, FileImage,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/templates")({ component: TemplatesPage });

type MediaKind = "image" | "video";
type Media = { kind: MediaKind; url: string; name: string; size: number };

type Template = {
  id: string;
  nome: string;
  categoria: string;
  conteudo: string;
  media?: Media | null;
  updatedAt: number;
};

const STORAGE_KEY = "wa_templates_v1";

const VARIAVEIS = [
  { token: "{saudacao}", label: "Saudação", sample: saudacaoAtual() },
  { token: "{nome}", label: "Nome", sample: "João Silva" },
  { token: "{plano}", label: "Plano", sample: "Pro" },
  { token: "{valor}", label: "Valor", sample: "R$ 49,90" },
  { token: "{vencimento}", label: "Vencimento", sample: "12/06/2026" },
  { token: "{dias_restantes}", label: "Dias restantes", sample: "3" },
  { token: "{servidor}", label: "Servidor", sample: "SX Server" },
  { token: "{revenda}", label: "Revenda", sample: "Master BR" },
  { token: "{whatsapp}", label: "WhatsApp", sample: "(11) 99999-9999" },
  { token: "{usuario}", label: "Usuário", sample: "joaosilva" },
  { token: "{senha}", label: "Senha", sample: "••••••" },
  { token: "{link_pagamento}", label: "Link pagamento", sample: "https://pag.br/abc123" },
  { token: "{pix}", label: "Chave PIX", sample: "contato@revenda.com" },
  { token: "{data}", label: "Data atual", sample: new Date().toLocaleDateString("pt-BR") },
] as const;

function saudacaoAtual() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const CATEGORIAS = ["Cobrança", "Boas-vindas", "Promoção", "Suporte", "Aviso", "Outros"];

const DEFAULTS: Template[] = [
  {
    id: "t1",
    nome: "Aviso de vencimento",
    categoria: "Cobrança",
    conteudo:
      "Olá *{nome}*! 👋\n\nSeu plano *{plano}* no servidor _{servidor}_ vence em *{vencimento}*.\n\nRenove agora e ganhe *10% OFF* 🚀\n\n— Equipe {revenda}",
    updatedAt: Date.now(),
  },
  {
    id: "t2",
    nome: "Boas-vindas",
    categoria: "Boas-vindas",
    conteudo:
      "Olá *{nome}*, seja bem-vindo(a) à *{revenda}*! 🎉\n\nSeu plano *{plano}* já está ativo no servidor _{servidor}_.\n\nQualquer dúvida estamos por aqui.",
    updatedAt: Date.now(),
  },
  {
    id: "t3",
    nome: "Promoção relâmpago",
    categoria: "Promoção",
    conteudo:
      "🔥 *{nome}*, oferta só hoje!\n\nUpgrade do *{plano}* com *20% OFF* — válido até *{vencimento}*.\n\nResponda *EU QUERO* para liberar.",
    updatedAt: Date.now(),
  },
];

/* ---------- WhatsApp-style formatting renderer ---------- */
function renderWhatsapp(text: string, withSamples = true): string {
  let out = text;
  if (withSamples) {
    for (const v of VARIAVEIS) {
      out = out.split(v.token).join(
        `‹VAR›${v.sample}‹/VAR›`,
      );
    }
  } else {
    for (const v of VARIAVEIS) {
      out = out.split(v.token).join(`‹VAR›${v.token}‹/VAR›`);
    }
  }
  // escape html
  out = out.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // restore var markers
  out = out
    .replace(/‹VAR›/g, '<span class="wa-var">')
    .replace(/‹\/VAR›/g, "</span>");
  // *bold*
  out = out.replace(/(^|[\s(])\*(?!\s)([^*\n]+?)\*(?=[\s.,!?)]|$)/g, '$1<strong>$2</strong>');
  // _italic_
  out = out.replace(/(^|[\s(])_(?!\s)([^_\n]+?)_(?=[\s.,!?)]|$)/g, '$1<em>$2</em>');
  // ~strike~
  out = out.replace(/(^|[\s(])~(?!\s)([^~\n]+?)~(?=[\s.,!?)]|$)/g, '$1<s>$2</s>');
  // ```mono```
  out = out.replace(/```([^`]+)```/g, '<code class="wa-mono">$1</code>');
  // newlines
  out = out.replace(/\n/g, "<br/>");
  return out;
}

function loadTemplates(): Template[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
    return DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function TemplatesPage() {
  const [items, setItems] = useState<Template[]>(() => loadTemplates());
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Template | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Template | null>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (t) => t.nome.toLowerCase().includes(q) || t.categoria.toLowerCase().includes(q) || t.conteudo.toLowerCase().includes(q),
    );
  }, [items, query]);

  function novo() {
    setEditing({
      id: `t_${Date.now()}`,
      nome: "Novo template",
      categoria: "Outros",
      conteudo: "Olá *{nome}*! ",
      updatedAt: Date.now(),
    });
    setOpen(true);
  }

  function editar(t: Template) {
    setEditing({ ...t });
    setOpen(true);
  }

  function salvar(t: Template) {
    if (!t.nome.trim()) { toast.error("Informe um nome"); return; }
    if (!t.conteudo.trim()) { toast.error("Mensagem vazia"); return; }
    setItems((arr) => {
      const exists = arr.some((x) => x.id === t.id);
      const next = { ...t, updatedAt: Date.now() };
      return exists ? arr.map((x) => (x.id === t.id ? next : x)) : [next, ...arr];
    });
    toast.success("Template salvo");
    setOpen(false);
    setEditing(null);
  }

  function duplicar(t: Template) {
    const copy: Template = { ...t, id: `t_${Date.now()}`, nome: `${t.nome} (cópia)`, updatedAt: Date.now() };
    setItems((arr) => [copy, ...arr]);
    toast.success("Template duplicado");
  }

  function confirmarExcluir() {
    if (!toDelete) return;
    setItems((arr) => arr.filter((x) => x.id !== toDelete.id));
    toast.success("Template excluído");
    setToDelete(null);
  }

  return (
    <div className="px-6 lg:px-10 py-6 max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="WhatsApp"
        title="Templates"
        subtitle="Modelos prontos com variáveis dinâmicas e pré-visualização em tempo real."
        actions={
          <NeonButton onClick={novo}>
            <Plus className="h-4 w-4" /> Novo template
          </NeonButton>
        }
      />

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, categoria ou conteúdo…"
            className="w-full h-10 rounded-[10px] bg-[#15171A] border border-white/[0.06] pl-9 pr-3 text-[13px] text-[#F5F7FA] placeholder:text-[#6B7280] focus:outline-none focus:border-[#FFC247]/40"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <GlassCard key={t.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-[#FFC247]" strokeWidth={1.75} />
                  <h3 className="font-display text-[15px] font-semibold text-[#F5F7FA] truncate">{t.nome}</h3>
                </div>
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10.5px] text-[#9CA3AF]">
                  <Tag className="h-3 w-3" /> {t.categoria}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => duplicar(t)} className="h-8 w-8 grid place-items-center rounded-[8px] hover:bg-white/[0.05] text-[#9CA3AF]" title="Duplicar">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => editar(t)} className="h-8 w-8 grid place-items-center rounded-[8px] hover:bg-white/[0.05] text-[#9CA3AF]" title="Editar">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setToDelete(t)} className="h-8 w-8 grid place-items-center rounded-[8px] hover:bg-rose-500/10 text-rose-400/80" title="Excluir">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {t.media && (
              <div className="mt-3 rounded-[10px] overflow-hidden border border-white/[0.06] bg-black/30">
                {t.media.kind === "image" ? (
                  <img src={t.media.url} alt="" className="w-full h-32 object-cover" />
                ) : (
                  <div className="relative w-full h-32 bg-black grid place-items-center">
                    <Film className="h-6 w-6 text-white/60" />
                    <span className="absolute bottom-1.5 left-2 text-[10px] text-white/70 truncate max-w-[90%]">{t.media.name}</span>
                  </div>
                )}
              </div>
            )}
            <div
              className="mt-3 text-[12.5px] text-[#A1A1AA] leading-[1.55] line-clamp-5 whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: renderWhatsapp(t.conteudo, false) }}
            />
          </GlassCard>
        ))}
        {!filtered.length && (
          <div className="col-span-full text-center py-16 text-[#6B7280] text-sm">
            Nenhum template encontrado.
          </div>
        )}
      </div>

      {/* Editor modal */}
      <AnimatePresence>
        {open && editing && (
          <EditorModal
            template={editing}
            onChange={setEditing}
            onClose={() => { setOpen(false); setEditing(null); }}
            onSave={() => salvar(editing)}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmarExcluir}
        title="Excluir template?"
        description={toDelete ? `“${toDelete.nome}” será removido permanentemente.` : ""}
        confirmLabel="Excluir"
      />
    </div>
  );
}

/* ---------- Editor Modal ---------- */
function EditorModal({
  template, onChange, onClose, onSave,
}: {
  template: Template;
  onChange: (t: Template) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  function wrap(prefix: string, suffix = prefix) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const value = template.conteudo;
    const sel = value.slice(start, end) || "texto";
    const next = value.slice(0, start) + prefix + sel + suffix + value.slice(end);
    onChange({ ...template, conteudo: next });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length + sel.length);
    });
  }

  function insertVar(token: string) {
    const ta = taRef.current;
    if (!ta) {
      onChange({ ...template, conteudo: template.conteudo + token });
      return;
    }
    const start = ta.selectionStart, end = ta.selectionEnd;
    const value = template.conteudo;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange({ ...template, conteudo: next });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + token.length, start + token.length);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-[18px] glass-float flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[9px] grid place-items-center bg-[#FFC247]/15 text-[#FFC247]">
              <MessageSquareText className="h-4 w-4" />
            </div>
            <div>
              <div className="font-display text-[15px] font-semibold text-[#F5F7FA]">Editor de template</div>
              <div className="text-[11px] text-[#6B7280]">Use *negrito*, _itálico_, ~tachado~ e ```mono```</div>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-[8px] hover:bg-white/[0.05] text-[#9CA3AF]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-0 overflow-auto">
          {/* Editor */}
          <div className="p-5 space-y-4 border-r border-white/[0.06]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1.5">Nome</label>
                <input
                  value={template.nome}
                  onChange={(e) => onChange({ ...template, nome: e.target.value })}
                  className="w-full h-10 rounded-[10px] bg-[#0E1014] border border-white/[0.06] px-3 text-[13px] text-[#F5F7FA] focus:outline-none focus:border-[#FFC247]/40"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1.5">Categoria</label>
                <select
                  value={template.categoria}
                  onChange={(e) => onChange({ ...template, categoria: e.target.value })}
                  className="w-full h-10 rounded-[10px] bg-[#0E1014] border border-white/[0.06] px-3 text-[13px] text-[#F5F7FA] focus:outline-none focus:border-[#FFC247]/40"
                >
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5">
              <ToolbarBtn onClick={() => wrap("*")} title="Negrito"><Bold className="h-3.5 w-3.5" /></ToolbarBtn>
              <ToolbarBtn onClick={() => wrap("_")} title="Itálico"><Italic className="h-3.5 w-3.5" /></ToolbarBtn>
              <ToolbarBtn onClick={() => wrap("~")} title="Tachado"><Strikethrough className="h-3.5 w-3.5" /></ToolbarBtn>
              <ToolbarBtn onClick={() => wrap("```")} title="Monoespaçado"><Code className="h-3.5 w-3.5" /></ToolbarBtn>
              <div className="h-5 w-px bg-white/[0.08] mx-1" />
              {VARIAVEIS.map((v) => (
                <button
                  key={v.token}
                  onClick={() => insertVar(v.token)}
                  className="h-8 px-2.5 rounded-[8px] text-[11.5px] bg-[#FFC247]/10 hover:bg-[#FFC247]/20 text-[#FFC247] border border-[#FFC247]/20 transition"
                >
                  {v.token}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[11px] text-[#9CA3AF] mb-1.5">Mensagem</label>
              <textarea
                ref={taRef}
                value={template.conteudo}
                onChange={(e) => onChange({ ...template, conteudo: e.target.value })}
                rows={10}
                className="w-full rounded-[12px] bg-[#0E1014] border border-white/[0.06] p-3 text-[13px] leading-[1.6] text-[#F5F7FA] font-mono focus:outline-none focus:border-[#FFC247]/40 resize-y"
              />
              <div className="mt-2 text-[10.5px] text-[#6B7280]">
                {template.conteudo.length} caracteres
              </div>
            </div>

            <MediaUploader
              media={template.media ?? null}
              onChange={(m) => onChange({ ...template, media: m })}
            />
          </div>

          {/* Preview */}
          <div className="p-5 bg-[#0B0B0C]">
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-[#6B7280] mb-2">Pré-visualização</div>
            <WhatsPreview content={template.conteudo} media={template.media ?? null} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
          <NeonButton variant="secondary" onClick={onClose}>Cancelar</NeonButton>
          <NeonButton onClick={onSave}>Salvar template</NeonButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ToolbarBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="h-8 w-8 grid place-items-center rounded-[8px] bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-[#D4D4D8] transition"
    >
      {children}
    </button>
  );
}

function WhatsPreview({ content, media }: { content: string; media?: Media | null }) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const html = renderWhatsapp(content || " ", true);
  return (
    <div
      className="rounded-[16px] overflow-hidden border border-white/[0.06] shadow-2xl"
      style={{
        background:
          "linear-gradient(180deg, #0e1a14 0%, #0b1410 100%)",
      }}
    >
      {/* header */}
      <div className="px-3.5 py-2.5 flex items-center gap-2.5" style={{ background: "#1f2c2a" }}>
        <div className="h-8 w-8 rounded-full bg-[#FFC247]/20 grid place-items-center text-[#FFC247] text-[12px] font-semibold">BR</div>
        <div className="leading-tight">
          <div className="text-[12.5px] text-white font-semibold">BR Revenda</div>
          <div className="text-[10px] text-emerald-300/80">online</div>
        </div>
      </div>

      {/* chat body */}
      <div
        className="p-4 min-h-[340px]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(255,194,71,0.04), transparent 40%), radial-gradient(circle at 80% 80%, rgba(34,197,94,0.04), transparent 40%)",
        }}
      >
        <div className="flex justify-end">
          <div
            className="max-w-[85%] rounded-[10px] rounded-br-[2px] p-1.5 text-[13px] leading-[1.5] text-[#E8F5E9] shadow"
            style={{ background: "#005c4b" }}
          >
            {media && (
              <div className="rounded-[8px] overflow-hidden mb-1 bg-black/40">
                {media.kind === "image" ? (
                  <img src={media.url} alt="" className="w-full max-h-64 object-cover" />
                ) : (
                  <video src={media.url} controls className="w-full max-h-64 bg-black" />
                )}
              </div>
            )}
            <div className="px-2 pb-1 pt-0.5">
              <div
                className="whitespace-pre-wrap break-words wa-body"
                dangerouslySetInnerHTML={{ __html: html }}
              />
              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-emerald-100/70">
                {hh}:{mm}
                <CheckCheck className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .wa-body strong { font-weight: 700; color: #fff; }
        .wa-body em { font-style: italic; }
        .wa-body s { opacity: 0.7; }
        .wa-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          background: rgba(0,0,0,0.25);
          padding: 1px 5px;
          border-radius: 4px;
          font-size: 12px;
        }
        .wa-var {
          background: rgba(255,194,71,0.18);
          color: #FFD98A;
          padding: 0 4px;
          border-radius: 4px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

/* ---------- Media Uploader ---------- */
const MAX_BYTES = 4 * 1024 * 1024; // 4MB (localStorage budget)

function MediaUploader({
  media, onChange,
}: {
  media: Media | null;
  onChange: (m: Media | null) => void;
}) {
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File, kind: MediaKind) {
    if (file.size > MAX_BYTES) {
      toast.error(`Arquivo muito grande (máx. 4MB). Atual: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ kind, url: String(reader.result), name: file.name, size: file.size });
      toast.success(`${kind === "image" ? "Imagem" : "Vídeo"} anexado`);
    };
    reader.onerror = () => toast.error("Falha ao ler arquivo");
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="block text-[11px] text-[#9CA3AF] mb-1.5 flex items-center gap-1.5">
        <Paperclip className="h-3 w-3" /> Mídia (opcional)
      </label>

      {!media ? (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => imgRef.current?.click()}
            className="flex items-center gap-2 h-10 px-3 rounded-[10px] bg-[#0E1014] border border-white/[0.06] hover:border-[#FFC247]/40 text-[12.5px] text-[#D4D4D8] transition"
          >
            <ImagePlus className="h-4 w-4 text-[#FFC247]" /> Anexar imagem
          </button>
          <button
            onClick={() => vidRef.current?.click()}
            className="flex items-center gap-2 h-10 px-3 rounded-[10px] bg-[#0E1014] border border-white/[0.06] hover:border-[#FFC247]/40 text-[12.5px] text-[#D4D4D8] transition"
          >
            <Film className="h-4 w-4 text-[#FFC247]" /> Anexar vídeo
          </button>
          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "image")}
          />
          <input
            ref={vidRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "video")}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-2.5 rounded-[10px] bg-[#0E1014] border border-white/[0.06]">
          <div className="h-12 w-12 rounded-[8px] overflow-hidden bg-black grid place-items-center shrink-0">
            {media.kind === "image" ? (
              <img src={media.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Film className="h-5 w-5 text-white/70" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[12px] text-[#F5F7FA] truncate">
              {media.kind === "image" ? <FileImage className="h-3.5 w-3.5 text-[#FFC247]" /> : <Film className="h-3.5 w-3.5 text-[#FFC247]" />}
              <span className="truncate">{media.name}</span>
            </div>
            <div className="text-[10.5px] text-[#6B7280] mt-0.5">
              {(media.size / 1024).toFixed(0)} KB · {media.kind === "image" ? "Imagem" : "Vídeo"}
            </div>
          </div>
          <button
            onClick={() => onChange(null)}
            className="h-8 w-8 grid place-items-center rounded-[8px] hover:bg-rose-500/10 text-rose-400/80"
            title="Remover"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="mt-1.5 text-[10.5px] text-[#6B7280]">
        Máximo 4MB. Para vídeos maiores, use link no corpo da mensagem.
      </div>
    </div>
  );
}
