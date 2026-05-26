import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Server, Plus, Calendar, Coins, Edit3, Trash2, X, Search } from "lucide-react";

export const Route = createFileRoute("/_app/servidores")({ component: Servidores });

type Tipo = "pre" | "pos";
type Status = "ativo" | "atencao" | "vencido";
type Servidor = {
  id: number;
  nome: string;
  host?: string;
  tipo: Tipo;
  clientes: number;
  vencimento?: string;
  creditos?: number;
  status: Status;
};

const seed: Servidor[] = [
  { id: 1, nome: "SX Server", host: "sx.painel.tv", tipo: "pos", clientes: 482, vencimento: "2026-12-10", status: "ativo" },
  { id: 2, nome: "P2 Premium", host: "p2.cdn.io", tipo: "pre", clientes: 261, creditos: 1840, status: "ativo" },
  { id: 3, nome: "ZTech Cloud", host: "ztech.cloud", tipo: "pos", clientes: 154, vencimento: "2026-11-28", status: "atencao" },
  { id: 4, nome: "FastPlay", host: "fast.play", tipo: "pre", clientes: 98, creditos: 320, status: "ativo" },
  { id: 5, nome: "GoldTV", host: "gold.tv", tipo: "pos", clientes: 73, vencimento: "2026-11-05", status: "vencido" },
  { id: 6, nome: "UltraServer", host: "ultra.srv", tipo: "pre", clientes: 312, creditos: 5400, status: "ativo" },
];

const statusStyle: Record<Status, string> = {
  ativo: "bg-emerald-400/15 border-emerald-400/40 text-emerald-200",
  atencao: "bg-amber-400/15 border-amber-400/40 text-amber-200",
  vencido: "bg-red-400/15 border-red-400/40 text-red-200",
};
const statusLabel: Record<Status, string> = { ativo: "Ativo", atencao: "Atenção", vencido: "Vencido" };

const fmtData = (iso?: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

function Servidores() {
  const [items, setItems] = useState<Servidor[]>(seed);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Servidor | null>(null);
  const [toDelete, setToDelete] = useState<Servidor | null>(null);

  const filtered = items.filter(
    (s) =>
      s.nome.toLowerCase().includes(q.toLowerCase()) ||
      (s.host ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  const onNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const onEdit = (s: Servidor) => {
    setEditing(s);
    setOpen(true);
  };
  const onDelete = (s: Servidor) => setToDelete(s);
  const confirmDelete = () => {
    if (!toDelete) return;
    setItems((prev) => prev.filter((i) => i.id !== toDelete.id));
    toast.success("Servidor removido");
  };

  const onSave = (data: Omit<Servidor, "id"> & { id?: number }) => {
    if (data.id != null) {
      setItems((prev) => prev.map((i) => (i.id === data.id ? ({ ...i, ...data } as Servidor) : i)));
      toast.success("Servidor atualizado");
    } else {
      const id = Math.max(0, ...items.map((i) => i.id)) + 1;
      setItems((prev) => [{ ...(data as Servidor), id }, ...prev]);
      toast.success("Servidor criado");
    }
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Servidores"
        subtitle="Cadastre servidores nos modelos pré-pago (créditos) e pós-pago (vencimento mensal)."
        actions={
          <NeonButton onClick={onNew}>
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Novo servidor
            </span>
          </NeonButton>
        }
      />

      <div className="mb-5 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar servidor ou host…"
            className="input-ghost w-full pl-9 pr-3 py-2 text-sm rounded-xl"
          />
        </div>
        <div className="text-xs text-white/40">{filtered.length} de {items.length}</div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {filtered.map((s) => (
          <GlassCard key={s.id} className="col-span-12 md:col-span-6 xl:col-span-4 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400/25 to-amber-600/25 border border-white/10 grid place-items-center">
                  <Server className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <div className="font-display text-lg text-white">{s.nome}</div>
                  <div className="text-[11px] uppercase tracking-widest text-white/40">
                    {s.tipo === "pre" ? "Pré-pago" : "Pós-pago"}
                    {s.host ? ` · ${s.host}` : ""}
                  </div>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusStyle[s.status]}`}>{statusLabel[s.status]}</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-white/50">Clientes</div>
                <div className="text-white text-lg font-display mt-0.5">{s.clientes}</div>
              </div>
              {s.tipo === "pre" ? (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-white/50 flex items-center gap-1"><Coins className="h-3 w-3" /> Créditos</div>
                  <div className="text-amber-300 text-lg font-display mt-0.5">{s.creditos ?? 0}</div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-white/50 flex items-center gap-1"><Calendar className="h-3 w-3" /> Vence em</div>
                  <div className="text-white text-sm font-display mt-1">{fmtData(s.vencimento)}</div>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => onEdit(s)}
                className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition"
              >
                <Edit3 className="h-3.5 w-3.5" /> Editar
              </button>
              <button
                onClick={() => onDelete(s)}
                className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-500/10 transition"
              >
                <Trash2 className="h-3.5 w-3.5" /> Apagar
              </button>
            </div>
          </GlassCard>
        ))}
        {filtered.length === 0 && (
          <GlassCard className="col-span-12 p-10 text-center text-white/50">
            Nenhum servidor encontrado.
          </GlassCard>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <ServidorModal
            initial={editing}
            onClose={() => setOpen(false)}
            onSave={onSave}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        open={!!toDelete}
        title="Excluir servidor"
        description={toDelete ? `Tem certeza que deseja apagar "${toDelete.nome}"? Esta ação não pode ser desfeita.` : ""}
        confirmLabel="Excluir servidor"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

function ServidorModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Servidor | null;
  onClose: () => void;
  onSave: (s: Omit<Servidor, "id"> & { id?: number }) => void;
}) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [host, setHost] = useState(initial?.host ?? "");
  const [tipo, setTipo] = useState<Tipo>(initial?.tipo ?? "pos");
  const [clientes, setClientes] = useState<number>(initial?.clientes ?? 0);
  const [vencimento, setVencimento] = useState(initial?.vencimento ?? "");
  const [creditos, setCreditos] = useState<number>(initial?.creditos ?? 0);
  const [status, setStatus] = useState<Status>(initial?.status ?? "ativo");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return toast.error("Informe o nome");
    onSave({
      id: initial?.id,
      nome: nome.trim(),
      host: host.trim() || undefined,
      tipo,
      clientes: Number(clientes) || 0,
      vencimento: tipo === "pos" ? vencimento || undefined : undefined,
      creditos: tipo === "pre" ? Number(creditos) || 0 : undefined,
      status,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.form
        initial={{ y: 16, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 16, opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="glass-float w-full max-w-xl rounded-3xl p-6 relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5">
          <div className="text-[11px] uppercase tracking-widest text-amber-300/80">
            {initial ? "Editar" : "Novo"}
          </div>
          <h2 className="font-display text-2xl text-white mt-1">
            {initial ? "Editar servidor" : "Cadastrar servidor"}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome" className="col-span-2">
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="input-ghost w-full px-3 py-2 rounded-xl text-sm" placeholder="Ex.: SX Server" />
          </Field>
          <Field label="Host / domínio" className="col-span-2">
            <input value={host} onChange={(e) => setHost(e.target.value)} className="input-ghost w-full px-3 py-2 rounded-xl text-sm" placeholder="sx.painel.tv" />
          </Field>

          <Field label="Tipo">
            <div className="flex gap-2">
              {(["pos", "pre"] as Tipo[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs border transition ${
                    tipo === t
                      ? "bg-amber-400/15 border-amber-400/50 text-amber-200"
                      : "bg-white/[0.03] border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {t === "pos" ? "Pós-pago" : "Pré-pago"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="input-ghost w-full px-3 py-2 rounded-xl text-sm"
            >
              <option value="ativo">Ativo</option>
              <option value="atencao">Atenção</option>
              <option value="vencido">Vencido</option>
            </select>
          </Field>

          <Field label="Clientes">
            <input type="number" min={0} value={clientes} onChange={(e) => setClientes(Number(e.target.value))} className="input-ghost w-full px-3 py-2 rounded-xl text-sm" />
          </Field>

          {tipo === "pos" ? (
            <Field label="Vencimento">
              <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className="input-ghost w-full px-3 py-2 rounded-xl text-sm" />
            </Field>
          ) : (
            <Field label="Créditos">
              <input type="number" min={0} value={creditos} onChange={(e) => setCreditos(Number(e.target.value))} className="input-ghost w-full px-3 py-2 rounded-xl text-sm" />
            </Field>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 rounded-xl text-sm">
            Cancelar
          </button>
          <button type="submit" className="btn-primary px-4 py-2 rounded-xl text-sm">
            {initial ? "Salvar alterações" : "Criar servidor"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-[11px] uppercase tracking-widest text-white/50 mb-1.5">{label}</div>
      {children}
    </label>
  );
}
