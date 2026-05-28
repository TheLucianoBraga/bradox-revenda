import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PageHeader, NeonButton } from "@/components/ui-kit";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ModalPortal } from "@/components/ModalPortal";
import { useAppSession } from "@/contexts/AppSessionContext";
import { Server, Plus, Calendar, Hash, Edit3, Trash2, X, Search } from "lucide-react";
import { deleteServer, fetchServers, saveServer, type ServerRow } from "@/services/bradox/catalog";

export const Route = createFileRoute("/_app/servidores")({ component: Servidores });

type Tipo = "pre" | "pos";
type TipoFiltro = "todos" | Tipo;
type Status = "ativo" | "atencao" | "vencido";
type Servidor = {
  id: string;
  nome: string;
  host?: string;
  tipo: Tipo;
  vencimento?: string;
  quantidadeMinima?: number;
  valorCredito?: number;
  diaAcerto?: number;
  status: Status;
};

const toServidor = (row: ServerRow): Servidor => {
  const metadata = typeof row.metadata === "object" && row.metadata !== null && !Array.isArray(row.metadata) ? row.metadata : {};
  const metadataMinCredits = typeof metadata.min_credits === "number" ? metadata.min_credits : undefined;
  const metadataCreditPrice = typeof metadata.credit_price === "number" ? metadata.credit_price : undefined;
  const legacyCreditPrice = typeof metadata.legacy_credit_price === "number" ? metadata.legacy_credit_price : undefined;
  const settlementDay = typeof metadata.settlement_day === "number" ? metadata.settlement_day : undefined;
  const quantidadeMinima = row.minimum_credits || metadataMinCredits || 0;
  const valorCredito = Number(row.credit_price || metadataCreditPrice || legacyCreditPrice || 0);
  return {
    id: row.id,
    nome: row.name,
    host: row.base_url ?? undefined,
    tipo: row.billing_type === "postpaid" ? "pos" : "pre",
    quantidadeMinima,
    valorCredito,
    diaAcerto: settlementDay,
    status: row.status === "active" ? "ativo" : row.status === "attention" ? "atencao" : "vencido",
  };
};

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

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function Servidores() {
  const { activeNetworkId } = useAppSession();
  const [items, setItems] = useState<Servidor[]>([]);
  const [q, setQ] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Servidor | null>(null);
  const [toDelete, setToDelete] = useState<Servidor | null>(null);

  useEffect(() => {
    let active = true;
    fetchServers(activeNetworkId)
      .then((rows) => { if (active) setItems(rows.map(toServidor)); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [activeNetworkId]);

  const filtered = items.filter((s) => {
    const matchesType = tipoFiltro === "todos" || s.tipo === tipoFiltro;
    const matchesSearch = s.nome.toLowerCase().includes(q.toLowerCase()) || (s.host ?? "").toLowerCase().includes(q.toLowerCase());
    return matchesType && matchesSearch;
  });

  const onNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const onEdit = (s: Servidor) => {
    setEditing(s);
    setOpen(true);
  };
  const onDelete = (s: Servidor) => setToDelete(s);
  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteServer(toDelete.id);
      setItems((prev) => prev.filter((i) => i.id !== toDelete.id));
      toast.success("Servidor removido");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover servidor");
    }
  };

  const onSave = async (data: Omit<Servidor, "id"> & { id?: string }) => {
    try {
      const saved = await saveServer({
        id: data.id ?? null,
        networkId: activeNetworkId,
        name: data.nome,
        baseUrl: data.host ?? null,
        billingType: data.tipo === "pre" ? "prepaid" : "postpaid",
        creditPrice: data.valorCredito ?? 0,
        minimumCredits: data.quantidadeMinima ?? 0,
        status: data.status === "ativo" ? "active" : data.status === "atencao" ? "attention" : "inactive",
      });
      const nextItem = toServidor(saved);
      setItems((prev) => data.id ? prev.map((item) => (item.id === data.id ? nextItem : item)) : [nextItem, ...prev]);
      toast.success(data.id ? "Servidor atualizado" : "Servidor criado");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar servidor");
    }
  };

  return (
    <>
      <PageHeader
        title="Servidores"
        subtitle="Cadastre servidores nos modelos pré-pago (quantidade mínima) e pós-pago (vencimento mensal)."
        actions={
          <NeonButton onClick={onNew}>
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Novo servidor
            </span>
          </NeonButton>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar servidor ou host…"
            className="input-ghost w-full pl-9 pr-3 py-2 text-sm rounded-xl"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {([
            ["todos", "Todos"],
            ["pre", "Pré-pago"],
            ["pos", "Pós-pago"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTipoFiltro(value)}
              className={`rounded-xl border px-3 py-2 text-xs transition ${tipoFiltro === value ? "border-amber-300/50 bg-amber-300/15 text-amber-100" : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
          <div className="pl-1 text-xs text-white/40">{filtered.length} de {items.length}</div>
        </div>
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
              {s.tipo === "pre" ? (
                <>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-white/50 flex items-center gap-1"><Hash className="h-3 w-3" /> Credito</div>
                    <div className="text-amber-300 text-lg font-display mt-0.5">{formatMoney(s.valorCredito ?? 0)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-white/50 flex items-center gap-1"><Hash className="h-3 w-3" /> Compra minima</div>
                    <div className="text-white text-sm font-display mt-1">{s.quantidadeMinima ?? 0} creditos</div>
                  </div>
                  <div className="col-span-2 p-3 rounded-xl bg-amber-300/10 border border-amber-300/20">
                    <div className="text-amber-100/70 flex items-center gap-1"><Hash className="h-3 w-3" /> Total para comprar no painel externo</div>
                    <div className="text-amber-100 text-sm font-display mt-1">{formatMoney((s.valorCredito ?? 0) * (s.quantidadeMinima ?? 0))}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-white/50 flex items-center gap-1"><Hash className="h-3 w-3" /> Credito</div>
                    <div className="text-amber-300 text-lg font-display mt-0.5">{formatMoney(s.valorCredito ?? 0)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-white/50 flex items-center gap-1"><Hash className="h-3 w-3" /> Minimo</div>
                    <div className="text-white text-sm font-display mt-1">{s.quantidadeMinima ?? 0} creditos</div>
                  </div>
                  <div className="col-span-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-white/50 flex items-center gap-1"><Calendar className="h-3 w-3" /> Dia de acerto</div>
                    <div className="text-white text-sm font-display mt-1">{s.diaAcerto ? `Dia ${s.diaAcerto}` : fmtData(s.vencimento)}</div>
                  </div>
                </>
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
  onSave: (s: Omit<Servidor, "id"> & { id?: string }) => void;
}) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [host, setHost] = useState(initial?.host ?? "");
  const [tipo, setTipo] = useState<Tipo>(initial?.tipo ?? "pos");
  const [vencimento, setVencimento] = useState(initial?.vencimento ?? "");
  const [quantidadeMinima, setQuantidadeMinima] = useState<number>(initial?.quantidadeMinima ?? 0);
  const [valorCredito, setValorCredito] = useState<number>(initial?.valorCredito ?? 0);
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
      vencimento: tipo === "pos" ? vencimento || undefined : undefined,
      quantidadeMinima: Number(quantidadeMinima) || 0,
      valorCredito: Number(valorCredito) || 0,
      status,
    });
  };

  return (
    <ModalPortal open onClose={onClose}>
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
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="input-ghost w-full px-3 py-2 rounded-xl text-sm" placeholder="Nome do servidor" />
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

          {tipo === "pos" ? (
            <>
              <Field label="Valor por credito">
                <input type="number" min={0} step="0.01" value={valorCredito} onChange={(e) => setValorCredito(Number(e.target.value))} className="input-ghost w-full px-3 py-2 rounded-xl text-sm" />
              </Field>
              <Field label="Quantidade minima">
                <input type="number" min={0} value={quantidadeMinima} onChange={(e) => setQuantidadeMinima(Number(e.target.value))} className="input-ghost w-full px-3 py-2 rounded-xl text-sm" />
              </Field>
              <Field label="Vencimento / acerto" className="col-span-2">
                <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className="input-ghost w-full px-3 py-2 rounded-xl text-sm" />
              </Field>
            </>
          ) : (
            <>
              <Field label="Valor por credito">
                <input type="number" min={0} step="0.01" value={valorCredito} onChange={(e) => setValorCredito(Number(e.target.value))} className="input-ghost w-full px-3 py-2 rounded-xl text-sm" />
              </Field>
              <Field label="Quantidade minima">
                <input type="number" min={0} value={quantidadeMinima} onChange={(e) => setQuantidadeMinima(Number(e.target.value))} className="input-ghost w-full px-3 py-2 rounded-xl text-sm" />
              </Field>
              <div className="col-span-2 rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                Total minimo: {formatMoney((Number(valorCredito) || 0) * (Number(quantidadeMinima) || 0))}
              </div>
            </>
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
    </ModalPortal>
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
